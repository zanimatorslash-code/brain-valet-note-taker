import React, { useEffect, useMemo, useRef, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { useVault } from '../vault/VaultContext.jsx';
import { basenameNoExt } from '../vault/fsVault.js';

// Interactive force-directed graph (Obsidian-style) on a canvas.
export default function GraphView() {
  const { files, graph, activeTab, openNote, createNote, setGraphViewOpen } = useVault();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const simRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const hoverRef = useRef(null);
  const [, forceRender] = useState(0);

  // Build simulation data from the link graph.
  useEffect(() => {
    const unresolvedNames = new Set();
    for (const set of graph.unresolved.values()) for (const t of set) unresolvedNames.add(t.replace(/\.md$/, ''));

    const nodes = [...files.keys()].map((p) => ({
      id: p, label: basenameNoExt(p), unresolved: false,
      degree: (graph.incoming.get(p)?.size || 0) + (graph.outgoing.get(p)?.size || 0),
    }));
    const seenU = new Set();
    for (const name of unresolvedNames) {
      if (!seenU.has(name.toLowerCase())) { seenU.add(name.toLowerCase()); nodes.push({ id: `u:${name}`, label: name, unresolved: true, degree: 1 }); }
    }
    const links = [];
    for (const [src, set] of graph.outgoing.entries()) {
      for (const dst of set) links.push({ source: src, target: dst });
    }
    // Link unresolved targets to their pseudo-nodes.
    for (const [src, set] of graph.unresolved.entries()) {
      for (const t of set) {
        const id = `u:${t.replace(/\.md$/, '')}`;
        if (nodes.some((n) => n.id === id)) links.push({ source: src, target: id });
      }
    }
    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation(nodes)
      .force('link', forceLink(links).id((d) => d.id).distance(70).strength(0.5))
      .force('charge', forceManyBody().strength(-160))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide().radius((d) => nodeRadius(d) + 4))
      .alphaDecay(0.028);
    sim.on('tick', () => draw());
    simRef.current = sim;
    return () => sim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, graph]);

  function nodeRadius(d) {
    return Math.min(14, 4 + Math.sqrt(d.degree || 1) * 2.2);
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const { x: tx, y: ty, k } = transformRef.current;
    ctx.translate(w / 2 + tx, h / 2 + ty);
    ctx.scale(k, k);

    const accent = cssVar('--accent') || '#89b4fa';
    const pink = cssVar('--link-unresolved') || '#f38ba8';
    const textCol = cssVar('--text-muted') || '#a6adc8';
    const hover = hoverRef.current;
    const connected = new Set();
    if (hover) {
      connected.add(hover.id);
      for (const l of linksRef.current) {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === hover.id) connected.add(t);
        if (t === hover.id) connected.add(s);
      }
    }

    // edges
    ctx.lineWidth = 1 / k;
    for (const l of linksRef.current) {
      const s = l.source, t = l.target;
      if (!s.x || !t.x) continue;
      const dim = hover && !(connected.has(s.id) && connected.has(t.id));
      ctx.strokeStyle = dim ? 'rgba(137,180,250,0.06)' : 'rgba(137,180,250,0.35)';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // nodes
    for (const n of nodesRef.current) {
      if (n.x == null) continue;
      const r = nodeRadius(n);
      const isActive = n.id === activeTab;
      const dim = hover && !connected.has(n.id);
      ctx.globalAlpha = dim ? 0.25 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.unresolved ? pink : isActive ? '#cba6f7' : accent;
      ctx.fill();
      if (isActive) {
        ctx.lineWidth = 2 / k;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }
      // labels for bigger/zoomed nodes
      if (k > 0.55 || isActive || (hover && hover.id === n.id) || n.degree > 3) {
        ctx.globalAlpha = dim ? 0.2 : 0.9;
        ctx.fillStyle = textCol;
        ctx.font = `${11 / Math.max(k, 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y - r - 4 / k);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Fit view initially & on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onResize = () => { draw(); };
    window.addEventListener('resize', onResize);
    const t = setTimeout(() => { transformRef.current = { x: 0, y: 0, k: 1 }; draw(); }, 400);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);

  function nodeAt(evt) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { x: tx, y: ty, k } = transformRef.current;
    const mx = (evt.clientX - rect.left - rect.width / 2 - tx) / k;
    const my = (evt.clientY - rect.top - rect.height / 2 - ty) / k;
    let best = null, bestD = Infinity;
    for (const n of nodesRef.current) {
      if (n.x == null) continue;
      const d = Math.hypot(n.x - mx, n.y - my);
      const r = nodeRadius(n) + 4 / k;
      if (d < r && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  const onMouseDown = (e) => {
    const n = nodeAt(e);
    if (n) {
      dragRef.current = { node: n, moved: false };
      simRef.current?.alphaTarget(0.25).restart();
      n.fx = n.x; n.fy = n.y;
    } else {
      panRef.current = { x: e.clientX, y: e.clientY, tx: transformRef.current.x, ty: transformRef.current.y };
    }
  };
  const onMouseMove = (e) => {
    if (dragRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const { x: tx, y: ty, k } = transformRef.current;
      const n = dragRef.current.node;
      n.fx = (e.clientX - rect.left - rect.width / 2 - tx) / k;
      n.fy = (e.clientY - rect.top - rect.height / 2 - ty) / k;
      dragRef.current.moved = true;
    } else if (panRef.current) {
      transformRef.current.x = panRef.current.tx + (e.clientX - panRef.current.x);
      transformRef.current.y = panRef.current.ty + (e.clientY - panRef.current.y);
      draw();
    } else {
      hoverRef.current = nodeAt(e);
      canvasRef.current.style.cursor = hoverRef.current ? 'pointer' : 'grab';
      draw();
    }
  };
  const onMouseUp = (e) => {
    if (dragRef.current) {
      const { node, moved } = dragRef.current;
      simRef.current?.alphaTarget(0);
      if (!moved) {
        if (node.unresolved) {
          if (window.confirm(`"${node.label}" doesn't exist. Create it?`)) createNote(node.label, '');
        } else {
          openNote(node.id);
        }
      } else {
        node.fx = null; node.fy = null;
      }
      dragRef.current = null;
    }
    panRef.current = null;
  };
  const onWheel = (e) => {
    e.preventDefault();
    const t = transformRef.current;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    t.k = Math.min(4, Math.max(0.15, t.k * factor));
    draw();
  };

  const recenter = () => { transformRef.current = { x: 0, y: 0, k: 1 }; simRef.current?.alpha(0.6).restart(); draw(); };

  return (
    <div className="graph-view" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />
      <div className="graph-controls">
        <button onClick={() => setGraphViewOpen(false)}>✕ Close graph</button>
        <button onClick={recenter}>⟳ Re-center</button>
        <span style={{ alignSelf: 'center', color: 'var(--text-faint)', fontSize: 11 }}>
          scroll = zoom · drag bg = pan · click node = open · drag node = pin
        </span>
      </div>
    </div>
  );
}
