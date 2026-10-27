/* ============================================================
 * Math3D Catalog Library v1.0
 * 1000+ math 3D models (primary -> high school), pure HTML/JS,
 * WebGL2 renderer with automatic Canvas-2D fallback.
 *
 * Reuse in other apps:
 *   <script src="js/math3d.js"></script>
 *   Math3DCatalog.loadModels(url)        // or pass array
 *   const viewer = Math3DCatalog.createViewer(containerEl, {modelId})
 *   viewer.showModel(model | modelId)
 *   Math3DCatalog.buildPreviewCanvas(model, px)  // offscreen-ish thumbnail
 * ============================================================ */
(function (global) {
  'use strict';

  /* ---------- deterministic RNG ---------- */
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const TAU = Math.PI * 2;

  /* ---------- palette: refined museum-grade set (harmonious hue wheel, muted saturation) ---------- */
  const PAL = ['#c65f56', '#4a7fc1', '#3f9e7a', '#d9a05b', '#8a6ac1', '#2fa8c9', '#c56a9e', '#6fa8dc', '#d9c05b', '#4cb89a',
               '#a85751', '#5b8cd9', '#57a878', '#c98d4f', '#7d5fb0', '#4aa3b8', '#b0578a', '#82b4e0', '#c9b458', '#3aa88f'];
  function col(i) { return PAL[((i % PAL.length) + PAL.length) % PAL.length]; }
  /* smooth pastel gradient between two elegant hues (for curved surfaces) */
  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round((((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t));
    const g = Math.round((((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t));
    const bl = Math.round(((pa & 255) * (1 - t) + (pb & 255) * t));
    return `rgb(${r},${g},${bl})`;
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    g = Math.max(0, Math.min(255, Math.round(g * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return `rgb(${r},${g},${b})`;
  }

  /* ============================================================
   * GEOMETRY BUILDERS -> {verts:[[x,y,z]...], tris:[[i,j,k]...], lines:[[i,j]...] or seg pairs}
   * lines stored separately as linePairs: [[p1,p2],...] with raw coords
   * ============================================================ */
  function geo() {
    return { verts: [], tris: [], edges: [], rawLines: [], pts: [] };
  }
  function addVert(g, x, y, z) { g.verts.push([x, y, z]); return g.verts.length - 1; }
  function addTri(g, a, b, c) { g.tris.push([a, b, c]); }
  function addQuad(g, a, b, c, d) { addTri(g, a, b, c); addTri(g, a, c, d); }
  function addEdge(g, a, b) { g.edges.push([a, b]); }
  function addLine(g, p1, p2) {
    // tolerant: accepts addLine(g,[a,b]) or addLine(g,a,b)
    if (p2 === undefined && Array.isArray(p1) && p1.length === 2 && Array.isArray(p1[0]) && Array.isArray(p1[1])) {
      g.rawLines.push([p1[0], p1[1]]);
    } else {
      g.rawLines.push([p1, p2]);
    }
  }
  function addPoint(g, p) { g.pts.push(p); }

  /* --- platonic solids --- */
  function buildPlatonic(type, size) {
    const g = geo(), s = size || 1.5;
    if (type === 0) { // tetrahedron
      const v = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(p => p.map(c => c * s * 0.7));
      v.forEach(p => addVert(g, ...p));
      [[0,1,2],[0,3,1],[0,2,3],[1,3,2]].forEach(t => addTri(g, ...t));
      [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]].forEach(e => addEdge(g, ...e));
    } else if (type === 1) { // cube
      const c = s * 0.6;
      for (let i = 0; i < 8; i++) addVert(g, (i & 1 ? c : -c), (i & 2 ? c : -c), (i & 4 ? c : -c));
      const F = [[0,2,3,1],[4,5,7,6],[0,1,5,4],[2,6,7,3],[0,4,6,2],[1,3,7,5]];
      F.forEach(f => addQuad(g, f[0], f[1], f[2], f[3]));
      [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]].forEach(e => addEdge(g, ...e));
    } else if (type === 2) { // octahedron
      const c = s * 0.8;
      [[c,0,0],[-c,0,0],[0,c,0],[0,-c,0],[0,0,c],[0,0,-c]].forEach(p => addVert(g, ...p));
      const T = [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]];
      T.forEach(t => addTri(g, ...t));
      [[0,2],[2,1],[1,3],[3,0],[0,4],[2,4],[1,4],[3,4],[0,5],[2,5],[1,5],[3,5]].forEach(e => addEdge(g, ...e));
    } else if (type === 3) { // dodecahedron: 20 vertices known ordering
      const phi = (1 + Math.sqrt(5)) / 2, ip = 1 / phi, a = s * 0.45;
      const V = [];
      // cube vertices
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
      // (0, ±1/φ, ±φ) and permutations
      for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
        V.push([0, s1 * ip, s2 * phi]);
        V.push([s1 * ip, s2 * phi, 0]);
        V.push([s1 * phi, 0, s2 * ip]);
      }
      V.forEach(p => addVert(g, p[0] * a, p[1] * a, p[2] * a));
      const FACES = [
        [0,8,9,1,12],[17,3,11,10,16],[4,14,13,2,6],[0,12,15,5,8],[17,16,7,19,3],
        [4,6,18,15,14],[8,5,13,14,15],[16,10,18,6,7],[0,1,10,9,8],[1,17,19,11,10],
        [5,12,1,19,7],[2,13,5,7,18],[2,3,11,16,7],[2,18,9,4,14],[9,12,15,6,18],[4,9,8,5,13]
      ];
      // dedupe faces (some listed twice with different rotation); use set on sorted key
      const seen = new Set();
      for (const f of FACES) {
        const key = f.slice().sort((x,y)=>x-y).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        for (let t = 1; t < f.length - 1; t++) addTri(g, f[0], f[t], f[t+1]);
        for (let t = 0; t < f.length; t++) addEdge(g, f[t], f[(t+1)%f.length]);
      }
    } else { // icosahedron
      const phi = (1 + Math.sqrt(5)) / 2, a = s * 0.5;
      const V = [];
      for (const t of [-1, 1]) for (const u of [-1, 1]) {
        V.push([0, t * a, u * a * phi]);
        V.push([t * a, u * a * phi, 0]);
        V.push([t * a * phi, 0, u * a]);
      }
      V.forEach(p => addVert(g, ...p));
      icosaFaces(g);
    }
    return g;
  }
  function dodecaFaces(g) {}
  function icosaFaces(g) {
    // edge length among our vertex ordering: find all pairs at min distance -> triangles
    const V = g.verts, n = V.length;
    let minD = Infinity;
    const dist = (a,b)=>Math.hypot(V[a][0]-V[b][0],V[a][1]-V[b][1],V[a][2]-V[b][2]);
    for (let i=0;i<n;i++)for(let j=i+1;j<n;j++) minD=Math.min(minD,dist(i,j));
    const adj = Array.from({length:n},()=>[]);
    for (let i=0;i<n;i++)for(let j=i+1;j<n;j++) if (dist(i,j) < minD*1.05){adj[i].push(j);adj[j].push(i);addEdge(g,i,j);}
    const seen=new Set();
    for (let i=0;i<n;i++) for (const j of adj[i]) for (const k of adj[j]) if (adj[k].includes(i)) {
      const key=[i,j,k].sort((x,y)=>x-y).join(',');
      if(seen.has(key))continue; seen.add(key);
      addTri(g,i,j,k);
    }
  }
  function cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function dot(a, b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function norm(a) { const l = Math.hypot(...a) || 1; return a.map(c => c / l); }

  /* --- polygon prism thin plate --- */
  function buildPolygonPlate(sides, radius, thickness) {
    const g = geo(); sides = Math.max(3, sides || 5);
    const t = (thickness || 0.12) / 2;
    const top = [], bot = [];
    for (let i = 0; i < sides; i++) {
      const a = -Math.PI / 2 + i * TAU / sides;
      top.push(addVert(g, Math.cos(a) * radius, Math.sin(a) * radius, t));
      bot.push(addVert(g, Math.cos(a) * radius, Math.sin(a) * radius, -t));
    }
    for (let i = 0; i < sides - 2; i++) addTri(g, top[0], top[i + 1], top[i + 2]);
    for (let i = 0; i < sides - 2; i++) addTri(g, bot[0], bot[i + 2], bot[i + 1]);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      addQuad(g, top[i], top[j], bot[j], bot[i]);
      addEdge(g, top[i], top[j]);
    }
    for (let i = 0; i < sides; i++) addEdge(g, top[i], bot[i]);
    return g;
  }

  /* --- prism / pyramid --- */
  function buildPrism(sides, radius, height) {
    const g = geo(); sides = Math.max(3, sides || 4);
    const h = height || 2, r = radius || 1, top = [], bot = [];
    for (let i = 0; i < sides; i++) {
      const a = i * TAU / sides;
      top.push(addVert(g, Math.cos(a) * r, h / 2, Math.sin(a) * r));
      bot.push(addVert(g, Math.cos(a) * r, -h / 2, Math.sin(a) * r));
    }
    for (let i = 0; i < sides - 2; i++) addTri(g, top[0], top[i + 2], top[i + 1]);
    for (let i = 0; i < sides - 2; i++) addTri(g, bot[0], bot[i + 1], bot[i + 2]);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      addQuad(g, top[i], bot[i], bot[j], top[j]);
      addEdge(g, top[i], top[j]); addEdge(g, bot[i], bot[j]); addEdge(g, top[i], bot[i]);
    }
    return g;
  }
  function buildPyramid(sides, radius, height) {
    const g = geo(); sides = Math.max(3, sides || 4);
    const h = height || 1.6, r = radius || 1;
    const base = [];
    for (let i = 0; i < sides; i++) {
      const a = i * TAU / sides;
      base.push(addVert(g, Math.cos(a) * r, -h / 2, Math.sin(a) * r));
    }
    const apex = addVert(g, 0, h / 2, 0);
    for (let i = 0; i < sides - 2; i++) addTri(g, base[0], base[i + 1], base[i + 2]);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      addTri(g, base[i], apex, base[j]);
      addEdge(g, base[i], base[j]); addEdge(g, base[i], apex);
    }
    return g;
  }

  /* --- cylinder / cone / sphere / torus (mesh rings) --- */
  function buildCylinder(variant, r, h) {
    const g = geo(); r = r || 1; h = h || 2;
    const N = 40, rx = variant === 1 ? r * 1.5 : r, ry = r;
    const ringTop = [], ringBot = [];
    for (let i = 0; i < N; i++) {
      const a = i * TAU / N;
      ringTop.push(addVert(g, Math.cos(a) * rx, h / 2, Math.sin(a) * ry));
      ringBot.push(addVert(g, Math.cos(a) * rx, -h / 2, Math.sin(a) * ry));
    }
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      addQuad(g, ringTop[i], ringTop[j], ringBot[j], ringBot[i]);
    }
    if (variant === 2 || variant === 3) { // annulus / hollow tube: side hole walls + caps ring
      const ri = variant === 3 ? r * 0.6 : r * 0.55;
      const mix = variant === 3 ? 1.5 : 1;
      const holeT = [], holeB = [];
      for (let i = 0; i < N; i++) {
        const a = i * TAU / N;
        holeT.push(addVert(g, Math.cos(a) * ri * mix, h / 2, Math.sin(a) * ri));
        holeB.push(addVert(g, Math.cos(a) * ri * mix, -h / 2, Math.sin(a) * ri));
      }
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        addQuad(g, holeT[j], holeT[i], holeB[i], holeB[j]);   // inner wall (flipped)
        addQuad(g, ringTop[j], holeT[j], holeT[i], ringTop[i]); // top ring
        addQuad(g, ringBot[i], holeB[i], holeB[j], ringBot[j]); // bottom ring
      }
      for (let i = 0; i < N; i += 5) addEdge(g, ringTop[i], holeT[i]);
    } else {
      const ct = addVert(g, 0, h / 2, 0), cb = addVert(g, 0, -h / 2, 0);
      for (let i = 0; i < N; i++) { const j = (i + 1) % N; addTri(g, ct, ringTop[i], ringTop[j]); addTri(g, cb, ringBot[j], ringBot[i]); }
    }
    for (let i = 0; i < N; i += 8) addEdge(g, ringTop[i], ringBot[i]);
    return g;
  }
  function buildCone(variant, r, h) {
    const g = geo(); r = r || 1; h = h || 2;
    const N = 40, rx = variant === 1 ? r * 1.5 : r, ry = r;
    const off = variant === 2 ? r * 0.7 : 0;
    const ring = [];
    for (let i = 0; i < N; i++) {
      const a = i * TAU / N;
      ring.push(addVert(g, Math.cos(a) * rx, -h / 2, Math.sin(a) * ry));
    }
    const apex = addVert(g, off, h / 2, 0);
    const cbase = addVert(g, 0, -h / 2, 0);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      addTri(g, ring[i], apex, ring[j]);
      addTri(g, cbase, ring[j], ring[i]);
      if (i % 5 === 0) addEdge(g, ring[i], apex);
    }
    for (let i = 0; i < N; i += 2) addEdge(g, ring[i], ring[(i + 1) % N]);
    return g;
  }
  function buildSphere(r, material) {
    const g = geo(); r = r || 1;
    const segU = material === 'textured' ? 12 : 24, segV = 16;
    const grid = [];
    for (let i = 0; i <= segV; i++) {
      const phi = i * Math.PI / segV;
      grid[i] = [];
      for (let j = 0; j <= segU; j++) {
        const th = j * TAU / segU;
        grid[i][j] = addVert(g, r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
      }
    }
    for (let i = 0; i < segV; i++) for (let j = 0; j < segU; j++)
      addQuad(g, grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]);
    // lat/long wireframe edges
    for (let i = 0; i <= segV; i += 2) for (let j = 0; j < segU; j += 2) addEdge(g, grid[i][j], grid[i][j + 2] != null ? grid[i][Math.min(j + 2, segU)] : grid[i][j]);
    return g;
  }
  function buildTorus(R, r) {
    const g = geo(); R = R || 1.2; r = r || 0.4;
    const N = 36, M = 18, grid = [];
    for (let i = 0; i <= N; i++) {
      const u = i * TAU / N; grid[i] = [];
      for (let j = 0; j <= M; j++) {
        const v = j * TAU / M;
        grid[i][j] = addVert(g, (R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u));
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++)
      addQuad(g, grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]);
    for (let i = 0; i < N; i += 6) addEdge(g, grid[i][0], grid[i][M]);
    return g;
  }
  function buildTorusKnot(p, q) {
    const g = geo(); p = p || 2; q = q || 3;
    const N = 220, tube = 12, rad = 0.28, pts = [];
    for (let i = 0; i < N; i++) {
      const u = i * TAU / N;
      const cu = Math.cos(q * u), su = Math.sin(q * u);
      const R = 2 + cu;
      pts.push([R * Math.cos(u) * 0.6, su * 0.6 * 1.2, R * Math.sin(u) * 0.6]);
    }
    const grid = [];
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[(i + 1) % N];
      const t = norm([b[0]-a[0], b[1]-a[1], b[2]-a[2]]);
      let up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const n1 = norm(cross(t, up)), n2 = cross(t, n1);
      grid[i] = [];
      for (let j = 0; j <= tube; j++) {
        const v = j * TAU / tube;
        const o = [a[0] + rad * (Math.cos(v) * n1[0] + Math.sin(v) * n2[0]),
                   a[1] + rad * (Math.cos(v) * n1[1] + Math.sin(v) * n2[1]),
                   a[2] + rad * (Math.cos(v) * n1[2] + Math.sin(v) * n2[2])];
        grid[i][j] = addVert(g, ...o);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < tube; j++)
      addQuad(g, grid[i][j], grid[i][(j + 1) % tube], grid[(i + 1) % N][(j + 1) % tube], grid[(i + 1) % N][j]);
    return g;
  }

  /* --- fractals --- */
  function buildFractal(type, depth) {
    const g = geo(); depth = Math.min(depth || 3, 4);
    // safety: for combinatorially explosive types (Menger sponge, Hilbert/Peano),
    // auto-reduce depth so no single model exceeds ~50k triangles.
    if (type === 5 || type === 6) depth = Math.min(depth, 2);      // hilbert n=2^(d+1) -> <=1024 pts
    if (type < 0 || type > 8) depth = Math.min(depth, 1);          // Menger sponge fallback types
    if (type === 7) depth = Math.min(depth, 1);                     // Levy C: 5^(D+4) segments -> cap D at 5 (~3k pts)
    const rng = mulberry32(1234 + type * 7);
    if (type === 0) { // Koch snowflake extruded
      let pts = [];
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; pts.push([Math.cos(a) * 1.6, Math.sin(a) * 1.6]); }
      for (let d = 0; d < depth; d++) {
        const np = [];
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i], q = pts[(i + 1) % pts.length];
          const dx = (q[0] - p[0]) / 3, dy = (q[1] - p[1]) / 3;
          np.push(p);
          np.push([p[0] + dx, p[1] + dy]);
          const ca = Math.cos(Math.PI / 3), sa = Math.sin(Math.PI / 3);
          np.push([p[0] + dx + dx * ca - dy * sa, p[1] + dy + dx * sa + dy * ca]);
          np.push([p[0] + 2 * dx, p[1] + 2 * dy]);
        }
        pts = np;
      }
      return extrudePolyline(g, pts, 0.15);
    }
    if (type === 1) { // Sierpinski
      const tri = [[0, 1.6], [-1.4, -0.9], [1.4, -0.9]];
      const stack = [tri];
      const out = [];
      for (let d = 0; d < depth; d++) {
        const ns = [];
        for (const t of stack) {
          const m = [(t[0][0]+t[1][0])/2,(t[0][1]+t[1][1])/2];
          const m2 = [(t[1][0]+t[2][0])/2,(t[1][1]+t[2][1])/2];
          const m3 = [(t[2][0]+t[0][0])/2,(t[2][1]+t[0][1])/2];
          ns.push([t[0],m,m3],[m,t[1],m2],[m3,m2,t[2]]);
        }
        stack.length = 0; stack.push(...ns);
      }
      for (const t of stack) { const gg = extrudePolyline(geo(), t, 0.12); mergeGeo(g, gg); }
      return g;
    }
    if (type === 2) { // Cantor set as bars
      let segs = [[-1.5, 1.5]];
      const all = [];
      for (let d = 0; d <= depth; d++) { all.push(segs.slice()); const ns = []; for (const [a,b] of segs){ const t=(b-a)/3; ns.push([a,a+t],[b-t,b]); } segs = ns; }
      all.forEach((lvl, i) => lvl.forEach(([a,b]) => {
        const gg = boxGeo(((a+b)/2), 1.2 - i*0.45, 0, (b-a)/2, 0.08, 0.15); mergeGeo(g, gg);
      }));
      return g;
    }
    if (type === 3 || type === 7) { // dragon / levy C curve via L-system turtle
      const D = depth + 4;
      let seq;
      if (type === 3) { seq = 'F'; for (let d = 0; d < D; d++) seq = seq.replace(/./g, c => c === 'F' ? 'F+G' : 'F-G'); }
      else { seq = 'F'; for (let d = 0; d < Math.min(D, 10); d++) seq = seq.replace(/./g, c => c === 'F' ? 'F+F-F-F+F' : 'F'); }
      const step = type === 3 ? 2.6 / Math.pow(Math.SQRT2, D) : 2.6 / Math.pow(Math.sqrt(5), Math.min(D, 10));
      const pts = [[-1.1, -0.7]]; let dir = 0;
      for (const c of seq) {
        if (c === 'F') { const p = pts[pts.length - 1]; pts.push([p[0] + Math.cos(dir) * step, p[1] + Math.sin(dir) * step]); }
        else if (c === '+') dir += Math.PI / 2;
        else if (c === '-') dir -= Math.PI / 2;
      }
      return extrudePolyline(g, pts, 0.09);
    }
    if (type === 4) { // Gosper-ish hex spiral
      const pts = [];
      for (let i = 0; i < 240; i++) { const a = i * 0.22, r = 0.06 * i; pts.push([Math.cos(a)*r, Math.sin(a)*r]); }
      return extrudePolyline(g, pts, 0.1);
    }
    if (type === 5 || type === 6) { // Hilbert / Peano
      const n = Math.pow(2, depth + 1), pts = hilbert(n);
      pts.forEach(p => { p[0] = p[0]/n*3 - 1.5; p[1] = p[1]/n*3 - 1.5; });
      return extrudePolyline(g, pts, 0.09);
    }
    if (type === 8) { // fractal tree
      const branches = [];
      (function grow(x, y, ang, len, d) {
        if (d === 0 || len < 0.05) return;
        const x2 = x + Math.cos(ang)*len, y2 = y + Math.sin(ang)*len;
        branches.push([[x,y],[x2,y2],d]);
        grow(x2,y2,ang+0.5,len*0.7,d-1); grow(x2,y2,ang-0.45,len*0.72,d-1);
      })(0, -1.4, Math.PI/2, 0.9, depth + 2);
      for (const [a,b,d] of branches) {
        const gg = segmentTube(a[0],a[1],b[0],b[1],0.02+d*0.02); mergeGeo(g, gg);
      }
      return g;
    }
    // Menger sponge
    const level = Math.min(depth, 2);
    (function sponge(cx, cy, cz, s, d) {
      if (d === 0) { mergeGeo(g, boxGeo(cx, cy, cz, s/2, s/2, s/2)); return; }
      const ns = s / 3;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
        const cnt = (i===0?1:0)+(j===0?1:0)+(k===0?1:0);
        if (cnt >= 2) continue;
        sponge(cx+i*ns, cy+j*ns, cz+k*ns, ns, d-1);
      }
    })(0, 0, 0, 2.4, level);
    return g;
  }
  function hilbert(order) {
    // standard d2xy bit-manipulation Hilbert curve
    const pts = [];
    const N = order * order;
    for (let d = 0; d < N; d++) {
      let rx, ry, t = d, x = 0, y = 0;
      for (let s = 1; s < order; s *= 2) {
        rx = 1 & (Math.floor(t / 2));
        ry = 1 & (t ^ rx);
        if (ry === 0) {
          if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
          const tmp = x; x = y; y = tmp;
        }
        x += s * rx; y += s * ry;
        t = Math.floor(t / 4);
      }
      pts.push([x, y]);
    }
    return pts;
  }
  function boxGeo(cx, cy, cz, hx, hy, hz) {
    const g = geo();
    for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1]) addVert(g, cx+sx*hx, cy+sy*hy, cz+sz*hz);
    const F=[[0,2,3,1],[4,5,7,6],[0,1,5,4],[2,6,7,3],[0,4,6,2],[1,3,7,5]];
    F.forEach(f=>addQuad(g,f[0],f[1],f[2],f[3]));
    return g;
  }
  function segmentTube(x1,y1,x2,y2,r) {
    const g = geo(); const N=8;
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1;
    const t=[dx/L,dy/L,0], up=[0,0,1], n1=norm(cross(t,up)), n2=cross(t,n1);
    const A=[],B=[];
    for(let i=0;i<N;i++){const a=i*TAU/N;const ox=r*Math.cos(a),oz=r*Math.sin(a);
      A.push(addVert(g,x1+ox*n1[0]+oz*n2[0],y1+ox*n1[1]+oz*n2[1],oz*0+ox*n1[2]+oz*n2[2]));
      B.push(addVert(g,x2+ox*n1[0]+oz*n2[0],y2+ox*n1[1]+oz*n2[1],ox*n1[2]+oz*n2[2]));}
    for(let i=0;i<N;i++){const j=(i+1)%N;addQuad(g,A[i],A[j],B[j],B[i]);}
    return g;
  }
  function extrudePolyline(g, pts, th) {
    const top = [], bot = [];
    pts.forEach(p => { top.push(addVert(g, p[0], p[1], th)); bot.push(addVert(g, p[0], p[1], -th)); });
    for (let i = 0; i < pts.length - 1; i++) addQuad(g, top[i], top[i+1], bot[i+1], bot[i]);
    if (pts.length > 50) { // closed shape assumption for koch
      addQuad(g, top[pts.length-1], top[0], bot[0], bot[pts.length-1]);
    }
    return g;
  }
  function mergeGeo(dst, src) {
    const off = dst.verts.length;
    // pad dst.faceColors with default gray up to current tris count
    if (src.faceColors || dst.faceColors) {
      if (!dst.faceColors) dst.faceColors = [];
      while (dst.faceColors.length < dst.tris.length) dst.faceColors.push('#c8ccd4');
    }
    src.verts.forEach(v => dst.verts.push(v));
    src.tris.forEach((t, i) => {
      dst.tris.push([t[0]+off, t[1]+off, t[2]+off]);
      if (dst.faceColors) dst.faceColors.push(src.faceColors ? src.faceColors[i] : '#c8ccd4');
    });
    src.edges.forEach(e => dst.edges.push([e[0]+off, e[1]+off]));
    src.rawLines.forEach(l => dst.rawLines.push(l));
    src.pts.forEach(p => dst.pts.push(p));
  }

  /* --- fraction pie: one cylinder per slice, lifted slices = numerator --- */
  function buildFractionPie(num, den, size) {
    const g = geo(); den = Math.max(2, den || 4); size = size || 1.4;
    num = Math.min(num || 0, den);
    for (let s = 0; s < den; s++) {
      const a0 = -Math.PI/2 + s * TAU / den + 0.02, a1 = -Math.PI/2 + (s+1) * TAU / den - 0.02;
      const filled = s < num;
      const lift = filled ? 0.22 : 0;
      const K = 8, th = 0.13;
      const gg = geo();
      const ct = addVert(gg, 0, 0, lift + th), cb = addVert(gg, 0, 0, lift - th);
      const rt = [], rb = [];
      for (let i = 0; i <= K; i++) {
        const a = a0 + (a1 - a0) * i / K;
        rt.push(addVert(gg, Math.cos(a) * size, Math.sin(a) * size, lift + th));
        rb.push(addVert(gg, Math.cos(a) * size, Math.sin(a) * size, lift - th));
      }
      for (let i = 0; i < K; i++) {
        addTri(gg, ct, rt[i], rt[i+1]);
        addTri(gg, cb, rb[i+1], rb[i]);
        addQuad(gg, rt[i], rt[i+1], rb[i+1], rb[i]);
        if (i === 0) addQuad(gg, ct, rt[0], rb[0], cb);
        if (i === K-1) addQuad(gg, cb, rt[K], rb[K], ct);
      }
      gg.faceColors = gg.tris.map(() => filled ? col(s) : '#e6e0d2');
      mergeGeo(g, gg);
    }
    return g;
  }

  /* --- rect --- */
  function buildRect(ratio, scale) {
    const s = scale || 1.4;
    const w = ratio >= 1 ? s : s * ratio, h = ratio >= 1 ? s / ratio : s;
    return buildPolygonPlateCustom([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]], 0.12);
  }
  function buildPolygonPlateCustom(pts, th) {
    const g = geo();
    const top = pts.map(p => addVert(g, p[0], p[1], th));
    const bot = pts.map(p => addVert(g, p[0], p[1], -th));
    for (let i = 1; i < pts.length - 1; i++) { addTri(g, top[0], top[i], top[i+1]); addTri(g, bot[0], bot[i+1], bot[i]); }
    for (let i = 0; i < pts.length; i++) { const j = (i+1)%pts.length; addQuad(g, top[i], top[j], bot[j], bot[i]); addEdge(g, top[i], top[j]); }
    return g;
  }

  /* --- triangle types --- */
  function buildTriangle(type, scale) {
    const s = scale || 1.5;
    let pts;
    switch (type) {
      case 0: pts = [[-s, -s*0.55], [s, -s*0.55], [s*0.0, s*0.8]]; break; // 30-60-90 approx
      case 1: pts = [[-s, -s*0.6], [s, -s*0.6], [0, s*0.6]]; break;
      case 2: pts = [[-s, -s*0.5], [s*0.6, -s*0.5], [-s, s*0.7]]; break;
      case 3: pts = [[-s*0.9, -s*0.5], [s*0.9, -s*0.5], [0, s*0.9]]; break;
      case 4: pts = [[-s, -s*0.5], [s, -s*0.5], [0, s*0.86]]; break;
      case 5: pts = [[-s, -s*0.4], [s, -s*0.4], [s*0.15, s*0.9]]; break;
      default: pts = [[-s, -s*0.3], [s, -s*0.3], [-s*0.55, s*0.7]];
    }
    const g = buildPolygonPlateCustom(pts, 0.12);
    g.faceColors = g.tris.map(() => col(type + 1));
    return g;
  }

  /* --- quadrilaterals --- */
  function buildQuad(type, scale) {
    const s = scale || 1.3;
    let pts;
    switch (type) {
      case 0: pts = [[-s,-s],[s,-s],[s,s],[-s,s]]; break;
      case 1: pts = [[-1.4*s,-0.8*s],[1.4*s,-0.8*s],[1.4*s,0.8*s],[-1.4*s,0.8*s]]; break;
      case 2: pts = [[-1.2*s-0.4*s,-0.8*s],[1.2*s-0.4*s,-0.8*s],[1.2*s+0.4*s,0.8*s],[-1.2*s+0.4*s,0.8*s]]; break;
      case 3: pts = [[-1.3*s,0],[0,-0.8*s],[1.3*s,0],[0,0.8*s]]; break;
      case 4: pts = [[-1.3*s,-0.7*s],[1.3*s,-0.7*s],[0.7*s,0.7*s],[-0.7*s,0.7*s]]; break;
      case 5: pts = [[-1.2*s,-0.7*s],[1.2*s,-0.7*s],[0.7*s,0.7*s],[-0.7*s,0.7*s]]; break;
      default: pts = [[0,-1.3*s],[0.8*s,0],[0,1.3*s],[-0.8*s,0]]; pts = [[-0.9*s,-0.9*s],[0.2*s,-1.2*s],[0.9*s,0.2*s],[-0.2*s,1.2*s]];
    }
    const g = buildPolygonPlateCustom(pts, 0.12);
    g.faceColors = g.tris.map(() => col(type + 3));
    return g;
  }

  /* --- transforms: original + transformed grid shape --- */
  function buildTransform(type, amount) {
    const g = geo();
    const a = amount || 1;
    function unitSquare(offX, tx, ty, sc, rot, shx) {
      const ptsLocal = [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]];
      const pts = ptsLocal.map(([x,y]) => {
        let X = x * sc, Y = y * sc;
        const c = Math.cos(rot), s2 = Math.sin(rot);
        const r1 = X * c - Y * s2, r2 = X * s2 + Y * c;
        X = r1 + shx * Y; Y = r2;
        return [X + tx, Y + ty];
      });
      const sub = buildPolygonPlateCustom(pts, 0.1);
      sub.faceColors = sub.tris.map(() => offX ? col(1) : '#bbbbbb');
      mergeGeo(g, sub);
    }
    unitSquare(0, -1.4, 0, 1, 0, 0);
    switch (type) {
      case 0: unitSquare(1, 1.4 + a * 0.4, a * 0.3, 1, 0, 0); break;
      case 1: unitSquare(1, 1.4, 0, 1, a, 0); break;
      case 2: unitSquare(1, 1.4, 0, 1, 0, 0); mergeGeo(g, (() => { const s2 = buildPolygonPlateCustom([[0.9,0.5],[1.9,0.5],[1.9,1.5],[0.9,1.5]].map(p=>[p[0], -p[1]+2*a%2*0]), 0.1); s2.faceColors = s2.tris.map(()=>col(2)); return s2; })()); break;
      case 3: unitSquare(1, 1.4, 0, a, 0, 0); break;
      case 4: unitSquare(1, 1.4, 0, 1, 0, a * 0.5); break;
      default: unitSquare(1, 1.4, 0, 1, 0, 0); unitSquare(2, 1.4, -1.6, 1, 0, 0);
    }
    return g;
  }

  /* --- 2D graph ribbon --- */
  function fnForType(t) {
    switch (t) {
      case 0: return x => 0.8 * x + 0.4;
      case 1: return x => 0.5 * x * x - 0.8;
      case 2: return x => 0.3 * (x*x*x - x);
      case 3: return x => 1 / (x === 0 ? 0.01 : x);
      case 4: return x => Math.abs(x) - 0.6;
      case 5: return x => x >= 0 ? Math.sqrt(x) * 0.8 : NaN;
      case 6: return x => Math.sin(x);
      case 7: return x => Math.cos(x);
      case 8: return x => Math.max(-2.5, Math.min(2.5, Math.tan(x)));
      case 9: return x => Math.exp(x) * 0.4 - 1;
      case 10: return x => x > 0 ? Math.log(x) * 0.6 : NaN;
      case 11: return x => 0.6;
      case 12: return x => Math.floor(x) * 0.4;
      default: return x => 0.2 * (x*x*x*x - 2*x*x) + 0.5;
    }
  }
  function buildGraph2D(type, width) {
    const g = geo(); const W = width || 3, f = fnForType(type), N = 160, th = 0.09;
    const top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const x = -W + 2 * W * i / N;
      let y = f(x);
      if (!isFinite(y)) y = 0;
      y = Math.max(-2.6, Math.min(2.6, y));
      top.push(addVert(g, x, y + th, 0));
      bot.push(addVert(g, x, y - th, 0));
    }
    for (let i = 0; i < N; i++) addQuad(g, top[i], top[i+1], bot[i+1], bot[i]);
    // axes
    addLine(g, [[-W, -2.6, 0], [W, -2.6, 0]]);
    addLine(g, [[-W, 0, 0], [-W, 2.6, 0]]);
    g.faceColors = g.tris.map(() => col(type));
    return g;
  }

  /* --- polar curves --- */
  function polarPoints(type, scale) {
    const pts = [], N = 400, s = scale || 1.2;
    for (let i = 0; i <= N; i++) {
      const t = i * TAU * (type === 0 || type === 1 ? 2 : 1) / N;
      let r;
      switch (type) {
        case 0: r = 0.18 * t; break;
        case 1: r = 0.25 * Math.exp(0.3 * t); break;
        case 2: break; // Lissajous handled below (parametric, not polar r)
        case 3: r = Math.cos(2.5 * t); break;
        case 4: r = 1 + Math.cos(t); break;
        case 5: r = 1 + Math.cos(t) * Math.cos(t); r = 2 * Math.abs(Math.cos(t/2)); break; // nephroid approx
        case 6: { const c = Math.pow(Math.cos(t),3), si = Math.pow(Math.sin(t),3); pts.push([c*2.2*s, si*2.2*s]); continue; }
        case 7: { const R=1.6,rr=0.5; const a=(R-rr)*Math.cos(t)+rr*Math.cos((R-rr)/rr*t); const b=(R-rr)*Math.sin(t)-rr*Math.sin((R-rr)/rr*t); pts.push([a*s*0.55,b*s*0.55]); continue; }
        case 8: { const R=1.2,rr=0.4; const a=(R+rr)*Math.cos(t)-rr*Math.cos((R+rr)/rr*t); const b=(R+rr)*Math.sin(t)-rr*Math.sin((R+rr)/rr*t); pts.push([a*s*0.5,b*s*0.5]); continue; }
        case 9: { const a=t-Math.cos(t), b=Math.sin(t)-t*0.0; pts.push([(t*0.4-Math.sin(t)*0.4)*s,(1-Math.cos(t))*0.5*s]); continue; }
        case 10: r = 0.7 * Math.cosh(t / 1.5) - 0.7; break;
        default: { const a = t - Math.sin(t), b = 1 - Math.cos(t); pts.push([(a - 3.2) * 0.45 * s, b * 0.45 * s]); continue; }
      }
      if (type === 2) { pts.push([Math.sin(3*t)*s*1.4, Math.sin(2*t)*s*1.4]); continue; }
      if (type === 5) { pts.push([(2*Math.cos(t)-Math.cos(2*t))*s*0.7,(2*Math.sin(t)-Math.sin(2*t))*s*0.7]); continue; }
      if (isFinite(r)) pts.push([r * Math.cos(t) * s * 0.7, r * Math.sin(t) * s * 0.7]);
    }
    return pts;
  }
  function buildPolarCurve(type, scale) {
    const pts = polarPoints(type, scale) || [];
    const g = extrudePolyline(geo(), pts, 0.07);
    g.faceColors = g.tris.map(() => col(type + 2));
    return g;
  }

  /* --- z=f(x,y) surfaces --- */
  function surfFn(idx) {
    switch (idx) {
      case 0: return (x,y)=>x*x-y*y;
      case 1: return (x,y)=>Math.sin(x)*Math.sin(y);
      case 2: return (x,y)=>x*y;
      case 3: return (x,y)=>(x+y)*(x+y)*0.5-1;
      case 4: return (x,y)=>Math.hypot(x,y);
      case 5: return (x,y)=>{const r=Math.hypot(x,y)*3+1e-6;return Math.sin(r)/r;};
      case 6: return (x,y)=>0.3*(x*x*x+y*y*y);
      case 7: return (x,y)=>Math.cos(Math.hypot(x,y)*2.5);
      case 8: return (x,y)=>Math.exp(-(x*x+y*y));
      case 9: return (x,y)=>{const r=Math.hypot(x,y)*3+1e-6;return Math.sin(r)/r*1.6;};
      case 10: return (x,y)=>0.5*(x*x+y*y)-0.8;
      case 11: return (x,y)=>x*y*(x*x-y*y)*0.4;
      case 12: return (x,y)=>Math.sin(x*y*1.6);
      case 13: return (x,y)=>Math.cos(x*1.6)+Math.cos(y*1.6);
      default: return (x,y)=>0.6*Math.sin(x*2)*Math.cos(y*2)+0.25*x;
    }
  }
  function buildSurfaceFn(fnIdx, res) {
    const g = geo(); const n = Math.min(res || 32, 48), f = surfFn(fnIdx), W = 1.6;
    const grid = [];
    for (let i = 0; i <= n; i++) {
      grid[i] = [];
      for (let j = 0; j <= n; j++) {
        const x = -W + 2*W*i/n, y = -W + 2*W*j/n;
        grid[i][j] = addVert(g, x, f(x,y), y);
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
      addQuad(g, grid[i][j], grid[i][j+1], grid[i+1][j+1], grid[i+1][j]);
    g.faceColors = g.tris.map((t,k) => {
      const h = (g.verts[t[0]][1] + g.verts[t[2]][1]) / 2;
      const v = Math.max(0, Math.min(1, (h + 1.6) / 3.2));
      return `hsl(${210 - v*180},70%,${35+v*25}%)`;
    });
    return g;
  }

  /* --- parametric surfaces --- */
  function buildParamSurface(type, scale) {
    const g = geo(); const s = scale || 1.2;
    const nu = 60, nv = 24;
    const grid = [];
    for (let i = 0; i <= nu; i++) {
      grid[i] = [];
      const u = i / nu;
      for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        let p = [0,0,0];
        switch (type) {
          case 0: { const a=u*TAU, b=(v-0.5)*0.7; p=[(1+b*Math.cos(a/2))*Math.cos(a), (1+b*Math.cos(a/2))*Math.sin(a), b*Math.sin(a/2)]; break; }
          case 1: { const a=u*TAU, b=v*TAU; const r=2*(1-Math.cos(a)/2); const x=a<Math.PI? 3*Math.cos(a)*(1+Math.sin(a))+(r*(-2/3)*Math.cos(a)) : 3*Math.cos(a)*(1+Math.sin(a))+r*(-2/3)*Math.cos(a)*Math.exp((Math.PI-a)/3*Math.PI*0); p=[p[0]*0.5, (3*Math.sin(a))*(0.5)+ (a<Math.PI? -r*Math.sin(a+Math.PI/2)*0.3: 0), Math.cos(b)*0.5+r*0.2]; break; }
          case 2: { const a=u*TAU, b=v*TAU; p=[Math.cos(a)*Math.sin(2*b)*0.9+Math.sin(a)*Math.sin(b)*0.4, Math.sin(a)*Math.sin(2*b)*0.9-Math.cos(a)*Math.sin(b)*0.4, Math.cos(2*b)*0.9]; break; }
          case 3: { const a=u*TAU, b=(v-0.5)*2; p=[Math.cos(a)*(1+0.4*b), b*1.2, Math.sin(a)*(1+0.4*b)]; break; }
          case 4: { const a=u*TAU*2, b=(v-0.5)*1.2; p=[Math.cos(a)*(0.9+b*0.3), a*0.35-1, Math.sin(a)*(0.9+b*0.3)]; break; }
          case 5: { const a=u*TAU, b=(v-0.5)*2.2; const r=Math.cosh(b)*0.8; p=[r*Math.cos(a), b*0.9, r*Math.sin(a)]; break; }
          case 6: { const a=u*TAU, b=(v-0.5)*2; p=[b*Math.cos(a)*0.8, b*b*0.4-0.6, b*Math.sin(a)*0.8]; break; }
          case 7: { const a=u*TAU, b=v*TAU; p=[(1.3+0.4*Math.cos(b))*Math.cos(a), 0.4*Math.sin(b), (1.3+0.4*Math.cos(b))*Math.sin(a)]; break; }
          case 8: { const a=u*TAU, b=v*1.6-0.8; p=[Math.cos(a)*(0.8+b*0.5), Math.sin(2*a)*0.3+b*0.4, Math.sin(a)*(0.8+b*0.5)]; break; }
          default: { const a=u*TAU, b=v*1.8; p=[a*0.4-1.2, b*b*0.5-0.8, Math.sin(a)*b*0.5]; break; }
        }
        grid[i][j] = addVert(g, p[0]*s, p[1]*s, p[2]*s);
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++)
      addQuad(g, grid[i][j], grid[i][j+1], grid[i+1][j+1], grid[i+1][j]);
    g.faceColors = g.tris.map((t,k)=> col(type) );
    return g;
  }

  /* --- quadric-type surfaces (implicit parametrized) --- */
  function buildQuadSurface(type, scale) {
    const g = geo(); const s = scale || 1.2, nu = 48, nv = 24, grid = [];
    for (let i = 0; i <= nu; i++) {
      grid[i] = [];
      const u = i / nu * TAU;
      for (let j = 0; j <= nv; j++) {
        const v = (j / nv - 0.5) * 2.4;
        let p;
        switch (type) {
          case 0: { const t = j/nv*Math.PI; p=[1.4*Math.sin(t)*Math.cos(u), 0.9*Math.cos(t), 1.1*Math.sin(t)*Math.sin(u)]; break; }
          case 1: p=[Math.cosh(v)*Math.cos(u), v, Math.cosh(v)*Math.sin(u)]; break;
          case 2: p=[Math.sinh(Math.abs(v))*Math.cos(u)*0.8, Math.sign(v)*1.1, Math.sinh(Math.abs(v))*Math.sin(u)*0.8]; break;
          case 3: { const r=Math.abs(v)*1.1; p=[r*Math.cos(u), 0.6*v*v+ (v<0?-0.6:0.6)*0 , r*Math.sin(u)]; p[1]=0.5*r*r-0.8; break; }
          case 4: p=[v*1.2, 0.4*(v*v - (1.2*Math.cos(u))**2 )*0.8, 1.2*Math.cos(u)*1.4]; p=[v*1.2*Math.cos(u), 0.5*(v*v-1.44*Math.cos(u)*Math.cos(u)), 1.2*Math.sin(u)]; break;
          case 5: { const a=u,b=v; p=[Math.sin(a)*Math.cos(b)*Math.cos(a), Math.sin(a)*Math.sin(b), Math.cos(a)*Math.cos(b)*Math.cos(a)]; break; }
          case 6: { const a=u,b=v; p=[2*Math.cos(a)/(3-Math.sqrt(2)*Math.sin(b)*Math.sin(a)), 2*Math.cos(a)*Math.sin(b)/(3-Math.sqrt(2)*Math.sin(b)*Math.sin(a)), Math.sin(2*a)/(3-Math.sqrt(2)*Math.sin(b)*Math.sin(a))]; break; }
          case 7: { const a=u,b=v; const D=3-Math.sqrt(2)*Math.sin(b)*Math.sin(a); p=[Math.sqrt(2)*Math.cos(2*a)/D+0, Math.sqrt(2)*Math.sin(a)*Math.sin(b)*Math.cos(2*a)/D, Math.sin(a)*Math.sin(2*a)/D]; break; }
          case 8: { const a=u*0.5,b=v*0.5; p=[a - b*b*0.6, 3*(a*a*a)/3 - 3*a*b*b, b]; p=[a-b**3+3*a*a*b, 3*a*a-3*b*b, a*a*a-3*a*b*b]; break; }
          default: { const a=u*0.6-1.8,b=v*0.9; p=[a*a, b*b, a*a*a/3 - a*b*b]; break; }
        }
        if (!isFinite(p[0])||!isFinite(p[1])||!isFinite(p[2])) p=[0,0,0];
        grid[i][j] = addVert(g, p[0]*s, p[1]*s, p[2]*s);
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++)
      addQuad(g, grid[i][j], grid[i][j+1], grid[i+1][j+1], grid[i+1][j]);
    g.faceColors = g.tris.map(()=> col(type+5));
    return g;
  }

  /* --- revolution solids --- */
  function revProfile(type) {
    switch (type) {
      case 0: return t => Math.sqrt(Math.max(0, 1 - t*t)) * 1.6;
      case 1: return t => 0.3 + t*t*0.5;
      case 2: return t => 0.5 + 0.55*Math.abs(Math.sin(t*3));
      case 3: return t => 0.5 + 0.55*Math.abs(Math.cos(t*3));
      case 4: return t => 0.35 + 0.9*Math.exp(-Math.abs(t)*1.4);
      case 5: return t => 0.4 + 0.3*Math.log(1.2+Math.abs(t));
      case 6: return t => 0.3 + 0.75*Math.sqrt(Math.abs(t));
      default: return t => 0.4 + 0.6/(1+t*t);
    }
  }
  function buildRevolution(type, segments) {
    const g = geo(); const N = Math.min(segments || 32, 48), f = revProfile(type);
    const grid = [];
    for (let i = 0; i <= N; i++) {
      grid[i] = [];
      const u = i / N * TAU;
      for (let j = 0; j <= 24; j++) {
        const t = (j / 24 - 0.5) * 2.4;
        const r = f(t);
        grid[i][j] = addVert(g, t * 1.1, r * Math.sin(u), r * Math.cos(u));
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < 24; j++)
      addQuad(g, grid[i][j], grid[i][j+1], grid[i+1][j+1], grid[i+1][j]);
    g.faceColors = g.tris.map((tr,k)=>{ const yy=g.verts[tr[0]][1]; return `hsl(${30+ (yy)*60},65%,55%)`;});
    return g;
  }

  /* --- vectors --- */
  function arrow(g, from, to, colorName, headScale) {
    const d = [to[0]-from[0], to[1]-from[1], to[2]-from[2]];
    const L = Math.hypot(...d) || 1e-6;
    const t = d.map(c=>c/L);
    let up = Math.abs(t[1])<0.9?[0,1,0]:[1,0,0];
    const n1=norm(cross(t,up)), n2=cross(t,n1);
    const shaftEnd = to.map((c,i)=>c - t[i]*L*0.22);
    const R = 0.035, HH = L*0.22;
    const A=[],B=[];
    for(let i=0;i<8;i++){const a=i*TAU/8;const ox=R*Math.cos(a),oz=R*Math.sin(a);
      A.push(addVert(g, from[0]+ox*n1[0]+oz*n2[0], from[1]+ox*n1[1]+oz*n2[1], from[2]+ox*n1[2]+oz*n2[2]));
      B.push(addVert(g, shaftEnd[0]+ox*n1[0]+oz*n2[0], shaftEnd[1]+ox*n1[1]+oz*n2[1], shaftEnd[2]+ox*n1[2]+oz*n2[2]));}
    for(let i=0;i<8;i++){const j=(i+1)%8;addQuad(g,A[i],A[j],B[j],B[i]);}
    const tip=addVert(g,...to);
    const hc=addVert(g, ...shaftEnd);
    for(let i=0;i<8;i++){const j=(i+1)%8;addTri(g,B[i],tip,B[j]); addTri(g,hc,B[j],B[i]);}
    g.faceColors = (g.faceColors||[]);
    while(g.faceColors.length<g.tris.length-1) g.faceColors.push('#cccccc');
    for(let k=g.tris.length-(8*2+8);k<g.tris.length;k++) g.faceColors[k]=colorName;
  }
  function axesLines(g) {
    addLine(g,[[-2,0,0],[2,0,0]]); addLine(g,[[0,-2,0],[0,2,0]]); addLine(g,[[0,0,-2],[0,0,2]]);
  }
  function buildVector(type, len) {
    const g = geo(); const L = len || 1.4;
    axesLines(g);
    switch (type) {
      case 0: arrow(g,[0,0,0],[L,L*0.5,0],col(0)); break;
      case 1: arrow(g,[0,0,0],[L,L*0.7,L*0.5],col(0)); break;
      case 2: arrow(g,[0,0,0],[L,0.4*L,0],col(1)); arrow(g,[0,0,0],[0.3*L,L*0.7,0],col(2)); arrow(g,[0,0,0],[L+0.3*L,0.4*L+L*0.7,0],col(0)); break;
      case 3: arrow(g,[0,0,0],[L,0.4*L,0],col(1)); arrow(g,[0,0,0],[-0.3*L,L*0.6,0],col(2)); arrow(g,[0,0,0],[L+0.3*L,0.4*L-L*0.6,0],col(0)); break;
      case 4: arrow(g,[-1.2,0,0],[-1.2+L,0.5*L,0],col(1)); arrow(g,[-1.2,0,0],[-1.2+0.6*L,-0.6*L,0],col(2)); addPoint(g,[-1.2+L*0.6,-0.3*L,0]); break;
      case 5: arrow(g,[0,-0.6,0],[L,-0.6,0],col(1)); arrow(g,[0,-0.6,0],[0.3*L,0.9*L,0],col(2)); arrow(g,[0,-0.6,0],[0,0,L*1.2],col(0)); break;
      case 6: arrow(g,[-1,0.8,0],[L-1,L*0.5+0.8,0],col(0)); arrow(g,[-1,0.8,0],[L-1,0.8,0],col(1)); addLine(g,[[L-1,0.8,0],[L-1,L*0.5+0.8,0]]); break;
      default: arrow(g,[0,0,0],[1.2,0,0],'#e0564f'); arrow(g,[0,0,0],[0,1.2,0],'#4f8ee0'); arrow(g,[0,0,0],[0,0,1.2],'#4fbf7f');
    }
    return g;
  }

  /* --- stats charts (3D bars etc.) --- */
  function buildStats(type, seed) {
    const g = geo(); const rng = mulberry32(seed * 991 + type * 17);
    const data = Array.from({length: 12}, () => 0.3 + rng() * 1.6);
    function bar(x, z, h, c, w) {
      const gg = boxGeo(x, h/2 - 1, z, (w||0.28), h/2, (w||0.28));
      gg.faceColors = gg.tris.map(()=>c); mergeGeo(g, gg);
    }
    switch (type) {
      case 0: case 3: case 6: case 7: case 8: case 9: case 10:
        data.forEach((h,i)=> bar(-1.7+i*0.31, 0, h, col(i)));
        break;
      case 1: { const q=[0.5,1.0,1.4,1.8,2.2]; q.forEach((h,i)=> bar(-1.2+i*0.6,0,h,col(i+2),0.12)); break; }
      case 2: for(let i=0;i<40;i++){ const x=(rng()-0.5)*3.4, y=(rng()-0.5)*2.4; const gg=boxGeo(x,y-0.8,(rng()-0.5)*1.5,0.07,0.07,0.07); gg.faceColors=gg.tris.map(()=>col(5)); mergeGeo(g,gg);} break;
      case 4: { let a0=-Math.PI/2; data.slice(0,6).forEach((h,i)=>{ const a1=a0+h/6*TAU; const gg=geo(); const c=addVert(gg,0,-0.9,0); const r=1.4; for(let t=0;t<=10;t++){const a=a0+(a1-a0)*t/10; addVert(gg,Math.cos(a)*r,-0.9,Math.sin(a)*r);} const first=1; for(let t=first;t<11;t++)addTri(gg,c,t,t+1); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg); a0=a1; }); break; }
      case 5: case 11: { const n=24; for(let i=0;i<n;i++)for(let j=0;j<n;j++){ const x=-1.7+3.4*i/n, y=-1.7+3.4*j/n; const h=1.6*Math.exp(-(x*x+y*y)/1.2)+0.1; const gg=boxGeo(x,h/2-1,y,0.07,h/2,0.07); gg.faceColors=gg.tris.map(()=>`hsl(${200-h*60},70%,55%)`); mergeGeo(g,gg);} break; }
      default: data.forEach((h,i)=> bar(-1.7+i*0.31, 0, h, col(i)));
    }
    return g;
  }

  /* --- probability models --- */
  function buildProb(type, seed) {
    const g = geo(); const rng = mulberry32(seed*7717+type*131);
    switch (type) {
      case 0: { for(let i=0;i<4;i++){ const gg=buildCylinder(0,0.5,0.12); const off=[[-0.8,0.8],[0.8,0.8],[-0.8,-0.8],[0.8,-0.8]][i]; translateVerts(gg,off[0],off[1]-0.3,0); gg.faceColors=gg.tris.map(()=>i%2?'#d9d9d9':col(3)); mergeGeo(g,gg);} break; }
      case 1: { const counts=Array.from({length:11},(_,i)=>0); for(let i=0;i<120;i++)counts[Math.floor(rng()*6)+Math.floor(rng()*6)]++; counts.forEach((c,i)=>{ const gg=boxGeo(-2.2+i*0.44,c*0.06-1,0,0.18,c*0.06,0.18); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg);}); break; }
      case 2: { const gg=buildCylinder(0,1.4,0.15); gg.faceColors=gg.tris.map((_,k)=>col(k%7)); mergeGeo(g,gg); const pin=boxGeo(0,0.9,0,0.06,0.9,0.06); pin.faceColors=pin.tris.map(()=>'#333'); mergeGeo(g,pin); break; }
      case 3: { const jar=buildCylinder(3,1,2); jar.faceColors=jar.tris.map(()=>'rgba'); mergeGeo(g,jar); for(let i=0;i<24;i++){ const a=rng()*TAU, r=rng()*0.6; const gg=buildSphere(0.16); const cols=gg.tris.map(()=>col(Math.floor(rng()*3))); gg.faceColors=cols; translateVerts(gg, Math.cos(a)*r, -0.7+rng()*0.8, Math.sin(a)*r); mergeGeo(g,gg);} break; }
      case 4: { function node(x,y,d){ const gg=buildSphere(0.14); gg.faceColors=gg.tris.map(()=>col(d)); translateVerts(gg,x,y,0); mergeGeo(g,gg); if(d<3){ for(const s of[-1,1]){ addLine(g,[[x,y,0],[x+s*0.8/(d+1),y-0.6,0]]); node(x+s*0.8/(d+1),y-0.6,d+1);} } } node(0,1.2,0); break; }
      case 5: case 6: { const rows=5; for(let i=0;i<rows;i++){ const cnt=i+1; for(let j=0;j<cnt;j++){ const gg=boxGeo(-1.5+j*0.7-i*0.35, 1-i*0.5, 0,0.28,0.2,0.28); gg.faceColors=gg.tris.map(()=>col(i*cnt+j)); mergeGeo(g,gg);} } break; }
      case 7: { const L=6; for(let i=0;i<L;i++)for(let j=0;j<=i;j++){ const v=binom(i,j)%6+1; const gg=boxGeo((j-i/2)*0.4,1-i*0.4,-0.2,0.16,0.16,0.16); gg.faceColors=gg.tris.map(()=>col(v)); mergeGeo(g,gg);} break; }
      case 8: { const L=7; for(let i=0;i<L;i++){ for(let j=0;j<=i;j++){ addLine(g,[[ (j-i/2)*0.35 -0.17, 1.2-i*0.3,0],[(j-i/2)*0.35+0.17,1.2-i*0.3,0]]); } } const bins=Array.from({length:L+1},()=>0); for(let k=0;k<60;k++){let pos=0;for(let i=0;i<L;i++)pos+=rng()<0.5?-1:1; bins[pos+L]++;} bins.forEach((c,i)=>{ const gg=boxGeo((i-L/2)*0.32,-1+c*0.04,0,0.13,c*0.04+0.02,0.13); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg);}); break; }
      default: { for(let i=0;i<3;i++){ const gg=boxGeo(-1.2+i*1.2,0,0,0.45,0.9,0.15); gg.faceColors=gg.tris.map(()=>i===1?col(0):'#c9c2b8'); mergeGeo(g,gg);} const car=buildCylinder(0,0.12,0.12); translateVerts(car,-1.2+ (seed%3)*1.2, -0.4, 0.2); car.faceColors=car.tris.map(()=>col(3)); mergeGeo(g,car); break; }
    }
    return g;
  }
  function binom(n,k){ let r=1; for(let i=0;i<k;i++) r=r*(n-i)/(i+1); return Math.round(r); }
  function translateVerts(gg, dx, dy, dz) { gg.verts.forEach(v=>{v[0]+=dx;v[1]+=dy;v[2]+=dz;}); }

  /* --- number systems --- */
  function buildNumSys(type, scale) {
    const g = geo(); const s = scale || 1;
    function cube(x,y,z,size,c){ const gg=boxGeo(x,y,z,size,size,size); gg.faceColors=gg.tris.map(()=>c); mergeGeo(g,gg); }
    switch (type) {
      case 0: cube(-1.2*s,0,0,0.5*s,col(0)); cube(0,0,0,0.3*s,col(1)); cube(0.8*s,0,0,0.15*s,col(2)); cube(1.3*s,0,0,0.15*s,col(2)); cube(1.3*s,0.35*s,0,0.15*s,col(2)); break;
      case 1: for(let i=0;i<8;i++){ const bit=(13>>i)&1; cube(-1.6+i*0.45,bit?0.4:-0.4,0,0.18, bit?col(0):'#888'); } break;
      case 2: for(let i=0;i<4;i++){ const gg=buildCylinder(0,(0.7-i*0.12)*s,0.1); translateVerts(gg,-1.4+i*0.95,0,0); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg);} break;
      case 3: { addLine(g,[[-2, -1,0],[2,-1,0]]); for(let i=0;i<=8;i++) addLine(g,[[-2+i*0.5,-1.1,0],[-2+i*0.5,-0.9,0]]); const arcPts=[]; for(let t=0;t<=24;t++){const a=Math.PI*t/24; arcPts.push([-0.5+Math.cos(a)*1.0, -1+Math.sin(a)*0.7]);} const ag=extrudePolyline(geo(),arcPts,0.04); ag.faceColors=ag.tris.map(()=>col(4)); mergeGeo(g,ag); break;}
      case 4: for(let i=0;i<5;i++)for(let j=0;j<4;j++) cube(-1.2+i*0.6,-0.9+j*0.6,0,0.22,col(i)); break;
      case 5: for(let k=1;k<=6;k++){ const gg=buildCylinder(0,0.12,1.6); translateVerts(gg,-1.5+k*0.55,0,0); gg.faceColors=gg.tris.map(()=>col(k)); mergeGeo(g,gg);} break;
      case 6: { const prime=i=>{if(i<2)return false;for(let d=2;d*d<=i;d++)if(i%d===0)return false;return true;}; for(let i=0;i<25;i++){const x=-1.8+(i%5)*0.9, y=1.2-Math.floor(i/5)*0.9; const n=i+1; cube(x,y,0,prime(n)?0.3:0.18, prime(n)?col(0):'#bbb');} break;}
      case 7: for(let h=1;h<=5;h++)for(let w=0;w<h;w++) cube(-1+w*0.5+(5-h)*0.25, -1+h*0.4, 0, 0.2, col(h)); break;
      case 8: ['(',')','×','+'].forEach((ch,i)=>{ const gg=buildTorus(0.3,0.08); translateVerts(gg,-1.4+i*0.95,0.4,0); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg); const gg2=boxGeo(-1.4+i*0.95,-0.4,0,0.3,0.3,0.1); gg2.faceColors=gg2.tris.map(()=>col(i+3)); mergeGeo(g,gg2);}); break;
      default: for(let i=0;i<10;i++){ const plus=i<6; const gg=buildCylinder(0,0.3,0.1); translateVerts(gg,-1.8+i*0.4, plus?0.3:-0.3,0); gg.faceColors=gg.tris.map(()=>plus?col(0):col(1)); mergeGeo(g,gg);} break;
    }
    return g;
  }

  /* --- geo extras --- */
  function buildGeoExtra(type, scale) {
    const g = geo(); const s = scale || 1.2;
    switch (type) {
      case 0: case 8: { const gg=geo(); const R=s*1.3, seg=12, ring=[]; for(let i=0;i<=seg;i++){ring[i]=[];for(let j=0;j<=seg/2;j++){const a=i/seg*TAU,b=j/seg*Math.PI; ring[i][j]=addVert(gg,R*Math.sin(b)*Math.cos(a),R*Math.cos(b),R*Math.sin(b)*Math.sin(a));}} for(let i=0;i<seg;i++)for(let j=0;j<seg/2;j++)addQuad(gg,ring[i][j],ring[i][j+1],ring[i+1][j+1],ring[i+1][j]); gg.faceColors=gg.tris.map((_,k)=>k%2?col(1):col(4)); mergeGeo(g,gg); break; }
      case 1: { const gg=buildSphere(s); gg.faceColors=gg.tris.map((_,k)=>k%3?col(0):'#fff'); mergeGeo(g,gg); break; }
      case 2: { const gg=buildTorus(s,0.25); gg.faceColors=gg.tris.map(()=>col(5)); mergeGeo(g,gg); const inner=buildTorus(s*0.6,0.12); inner.faceColors=inner.tris.map(()=>col(2)); mergeGeo(g,inner); break; }
      case 3: case 4: { for(let i=0;i<5;i++){ const sz=(5-i)*0.4*s; const gg=boxGeo(0,-s+ i*0.45*s,0,sz,0.22*s,sz); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg);} break; }
      case 5: { const gg=buildPrism(4,0.25*s,2.4*s); gg.faceColors=gg.tris.map(()=>col(6)); mergeGeo(g,gg); const cap=buildPyramid(4,0.35*s,0.5*s); translateVerts(cap,0,1.45*s,0); mergeGeo(g,cap); break; }
      case 6: { for(let i=0;i<=16;i++){const a=Math.PI*i/16; const gg=boxGeo(Math.cos(a)*1.5*s, Math.sin(a)*0.9*s-1, 0, 0.08,0.08,0.4*s); gg.faceColors=gg.tris.map(()=>col(3)); mergeGeo(g,gg);} break; }
      case 7: { for(let i=0;i<5;i++){ const x=-1.6+i*0.8; arrowG(g,x,-1,x,0.4,col(0)); arrowG(g,x,0.4,x+0.8,-1,col(1)); arrowG(g,x,-1,x+0.8,0.4,'#999'); } break; }
      default: for(let i=0;i<3;i++){ const gg=buildCylinder(0,0.5*s,1.8*s); translateVerts(gg,-1.2+i*1.2,0,0); gg.faceColors=gg.tris.map(()=>col(i)); mergeGeo(g,gg); const top=buildCone(0,0.55*s,0.5*s); translateVerts(top,-1.2+i*1.2,1.15*s,0); top.faceColors=top.tris.map(()=>col(i+3)); mergeGeo(g,top);} break;
    }
    return g;
  }
  function arrowG(g,x1,y1,x2,y2,c){ const gg=geo(); addLine(gg,[[x1,y1,0],[x2,y2,0]]); mergeGeo(g,gg); }

  /* --- misc (549 advanced models): map type->parametric family --- */
  function buildMisc(type, variant) {
    const g = geo();
    const fam = type % 12;
    const seed = variant * 31 + type * 7;
    const rng = mulberry32(seed);
    switch (fam) {
      case 0: return buildParamSurface(variant % 10, 1 + (variant % 3) * 0.2);
      case 1: return buildSurfaceFn(variant % 15, 24 + (variant % 4) * 6);
      case 2: return buildPolarCurve(variant % 12, 1 + (variant % 3) * 0.25);
      case 3: return buildTorusKnot(2 + variant % 4, 3 + variant % 5);
      case 4: { const gg = buildFractal(variant % 10, 2 + variant % 3); return gg; }
      case 5: return buildQuadSurface(variant % 10, 1 + (variant % 3) * 0.2);
      case 6: { // helix / spring / DNA
        const turns = 3 + variant % 4, N = 120, r = 0.7;
        const strands = variant % 2 ? 2 : 1;
        for (let st = 0; st < strands; st++) {
          const pts3 = [];
          for (let i = 0; i <= N; i++) { const a = i / N * turns * TAU + st * Math.PI;
            pts3.push([Math.cos(a) * r, i / N * 3 - 1.5, Math.sin(a) * r]); }
          const tube = tubeFromPath(pts3, 0.08);
          tube.faceColors = tube.tris.map(() => col(st)); mergeGeo(g, tube);
        }
        if (strands === 2) for (let i = 0; i < N; i += 8) { const a = i / N * turns * TAU, a2 = a + Math.PI;
          addLine(g, [[Math.cos(a)*r, i/N*3-1.5, Math.sin(a)*r],[Math.cos(a2)*r, i/N*3-1.5, Math.sin(a2)*r]]); }
        return g; }
      case 7: { // gear wheel
        const teeth = 10 + variant % 14, R = 1.2, th = 0.3;
        const pts = [];
        for (let i = 0; i < teeth; i++) {
          const a0 = i * TAU / teeth, w = TAU / teeth;
          pts.push([Math.cos(a0)*R*0.8, Math.sin(a0)*R*0.8]);
          pts.push([Math.cos(a0+w*0.2)*R, Math.sin(a0+w*0.2)*R]);
          pts.push([Math.cos(a0+w*0.45)*R, Math.sin(a0+w*0.45)*R]);
          pts.push([Math.cos(a0+w*0.5)*R*0.8, Math.sin(a0+w*0.5)*R*0.8]);
        }
        const gg = buildPolygonPlateCustom(pts, th);
        gg.faceColors = gg.tris.map(() => col(variant)); mergeGeo(g, gg);
        const hub = buildCylinder(0, 0.3, th*2.4); hub.faceColors = hub.tris.map(() => '#888'); mergeGeo(g, hub);
        return g; }
      case 8: { // pendulum / clock angles
        const arms = 1 + variant % 3;
        for (let i = 0; i < arms; i++) { const a = -0.8 + i * 0.8;
          addLine(g, [[0,1.4,0],[Math.sin(a)*1.6, 1.4-Math.cos(a)*1.6, 0]]);
          const bob = buildSphere(0.25); translateVerts(bob, Math.sin(a)*1.6, 1.4-Math.cos(a)*1.6, 0);
          bob.faceColors = bob.tris.map(()=>col(i)); mergeGeo(g,bob); }
        const dial = buildCylinder(0, 1.8, 0.08); translateVerts(dial, 0, 1.4, -0.2);
        dial.faceColors = dial.tris.map(()=>'#eee'); mergeGeo(g, dial);
        return g; }
      case 9: { // graphs/networks
        const n = 8 + variant % 8; const nodes = [];
        for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 1.2 + rng()*0.5; nodes.push([Math.cos(a)*r, Math.sin(a)*r, (rng()-0.5)*0.8]); }
        const edges = [];
        for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) if (rng() < 0.35) edges.push([i,j]);
        edges.forEach(([i,j]) => addLine(g, [nodes[i], nodes[j]]));
        nodes.forEach((p,i)=>{ const s2=buildSphere(0.12); translateVerts(s2,...p); s2.faceColors=s2.tris.map(()=>col(i)); mergeGeo(g,s2);});
        return g; }
      case 10: { // distribution / statistical cloud
        const bins = 16, hist = [];
        for (let i = 0; i < bins; i++) { const x = (i - bins/2)/bins*4;
          const y = variant%3===0? Math.exp(-x*x) : variant%3===1? Math.exp(-Math.abs(x)) : Math.max(0,1-Math.abs(x)/2);
          hist.push(y); }
        hist.forEach((h,i)=>{ const gg=boxGeo(-1.8+i*0.24, h*1.4/2-1, 0, 0.1, h*0.7, 0.1); gg.faceColors=gg.tris.map(()=>col(i%7)); mergeGeo(g,gg); });
        return g; }
      default: { // coordinate / grid scenes
        const n = 5 + variant % 4;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x = -1.6 + i * 3.2/(n-1), y = -1.6 + j * 3.2/(n-1);
          const h = Math.abs(Math.sin(x*1.3 + variant) * Math.cos(y*1.3)) * 1.2;
          const gg = boxGeo(x, -1 + h/2, y, 0.14, h/2, 0.14);
          gg.faceColors = gg.tris.map(()=>`hsl(${h*120+200},60%,55%)`);
          mergeGeo(g, gg);
        }
        addLine(g,[[-2,-1,0],[2,-1,0]]); addLine(g,[[0,-1,-2],[0,-1,2]]);
        return g; }
    }
  }
  function tubeFromPath(pts, r) {
    const g = geo(); const N = pts.length, M = 8;
    const grid = [];
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[Math.min(i+1,N-1)];
      const t = norm([b[0]-a[0]||1e-6, b[1]-a[1], b[2]-a[2]]);
      let up = Math.abs(t[1])<0.9?[0,1,0]:[1,0,0];
      const n1=norm(cross(t,up)), n2=cross(t,n1);
      grid[i]=[];
      for (let j = 0; j <= M; j++) { const v=j/M*TAU;
        grid[i][j]=addVert(g, a[0]+r*(Math.cos(v)*n1[0]+Math.sin(v)*n2[0]), a[1]+r*(Math.cos(v)*n1[1]+Math.sin(v)*n2[1]), a[2]+r*(Math.cos(v)*n1[2]+Math.sin(v)*n2[2])); }
    }
    for (let i = 0; i < N-1; i++) for (let j = 0; j < M; j++)
      addQuad(g, grid[i][j], grid[i][j+1], grid[i+1][j+1], grid[i+1][j]);
    return g;
  }

  /* ---------- master builder ---------- */
  function buildGeometry(model) {
    const p = model.params || {};
    switch (model.kind) {
      case 'platonic': return buildPlatonic(p.type, p.size);
      case 'polygon': return buildPolygonPlate(p.sides, p.radius, 0.12);
      case 'prism': return buildPrism(p.sides, p.radius, p.height);
      case 'pyramid': return buildPyramid(p.sides, p.radius, p.height);
      case 'cylinder': return buildCylinder(p.variant, p.r, p.h);
      case 'cone': return buildCone(p.variant, p.r, p.h);
      case 'sphere': return buildSphere(p.r, p.material);
      case 'torus': return buildTorus(p.R, p.r);
      case 'torusknot': return buildTorusKnot(p.p, p.q);
      case 'fractal': return buildFractal(p.type, p.depth);
      case 'rect': return buildRect(p.ratio, p.scale);
      case 'fractionpie': return buildFractionPie(p.num, p.den, p.size);
      case 'triangle': return buildTriangle(p.type, p.scale);
      case 'quad': return buildQuad(p.type, p.scale);
      case 'transform': return buildTransform(p.type, p.amount);
      case 'graph2d': return buildGraph2D(p.type, p.width);
      case 'polarcurve': return buildPolarCurve(p.type, p.scale);
      case 'surfacefn': return buildSurfaceFn(p.fn, p.res);
      case 'paramsurface': return buildParamSurface(p.type, p.scale);
      case 'quadsurface': return buildQuadSurface(p.type, p.scale);
      case 'revolution': return buildRevolution(p.type, p.segments);
      case 'vector': return buildVector(p.type, p.len);
      case 'stats': return buildStats(p.type, p.seed);
      case 'prob': return buildProb(p.type, p.seed);
      case 'numsys': return buildNumSys(p.type, p.scale);
      case 'geoextra': return buildGeoExtra(p.type, p.scale);
      case 'misc': return buildMisc(p.type, p.variant);
      default: return buildPlatonic(1, 1.5);
    }
  }

  /* ============================================================
   * RENDERER: WebGL2 primary, Canvas2D fallback
   * ============================================================ */
  const VS = `#version 300 es
  layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec3 aCol;
  uniform mat4 uMVP; uniform mat4 uMV; uniform mat3 uNM;
  out vec3 vN; out vec3 vC; out vec3 vP;
  void main(){ vN=normalize(uNM*aNrm); vC=aCol; vec4 p=uMV*vec4(aPos,1.0); vP=p.xyz; gl_Position=uMVP*vec4(aPos,1.0); }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 vN; in vec3 vC; in vec3 vP; out vec4 o;
  uniform float uAlpha;
  // elegant studio look: warm key + cool sky fill + rim light + soft specular + ACES tonemap
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
  void main(){
    vec3 N=normalize(vN); vec3 V=normalize(-vP);
    vec3 Lk=normalize(vec3(0.55,0.9,0.75));   // warm key
    vec3 Lf=normalize(vec3(-0.7,0.15,-0.35)); // cool fill (from behind-left)
    vec3 Lb=normalize(vec3(0.1,-0.65,-0.75)); // low back bounce
    float ndk=max(dot(N,Lk),0.0);
    float diff=ndk*0.95 + max(dot(N,Lf),0.0)*0.30 + max(dot(N,Lb),0.0)*0.12 + 0.30;
    vec3 H=normalize(Lk+V);
    float sp=pow(ndk*max(dot(N,H),0.0),54.0)*0.55;
    float fres=pow(1.0-max(dot(N,V),0.0),3.0);
    vec3 col=vC*diff + vec3(1.0,0.96,0.90)*sp + vec3(0.45,0.62,0.95)*fres*0.30;
    col=aces(col*1.12);
    col=pow(col, vec3(0.92)); // gentle lift
    o=vec4(col, uAlpha);
  }`;
  const LS = `#version 300 es
  layout(location=0) in vec3 aPos; uniform mat4 uMVP; void main(){gl_Position=uMVP*vec4(aPos,1.0);}`;
  const LF = `#version 300 es
  precision mediump float; out vec4 o; uniform vec4 uColor; void main(){o=uColor;}`;

  function parseColor(c) {
    if (typeof c !== 'string') return [0.8, 0.8, 0.8];
    if (c.startsWith('#')) {
      const n = parseInt(c.slice(1), 16);
      if (c.length === 4) return [((n>>8)&15)/15, ((n>>4)&15)/15, (n&15)/15];
      return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
    }
    const m = c.match(/hsl\(\s*([\d.-]+)\s*,\s*([\d.-]+)%?\s*,\s*([\d.-]+)%?/);
    if (m) { let [h,s,l]=[+m[1]/360,+m[2]/100,+m[3]/100];
      if (s===0) return [l,l,l];
      const q=l<0.5?l*(1+s):l+s-l*s, pp=2*l-q;
      const f=(t)=>{t=(t+1)%1; if(t<1/6)return pp+(q-pp)*6*t; if(t<0.5)return q; if(t<2/3)return pp+(q-pp)*(2/3-t)*6; return pp;};
      return [f(h+1/3),f(h),f(h-1/3)]; }
    const rgb = c.match(/rgba?\(([\d.\s,]+)/);
    if (rgb) { const a = rgb[1].split(',').map(Number); return [a[0]/255,a[1]/255,a[2]/255]; }
    return [0.8,0.8,0.8];
  }

  function prepBuffers(gl, g) {
    // compute normals, interleave; per-face colors duplicate verts, else indexed shared verts
    const vn = g.verts.length;
    const normals = new Float32Array(vn * 3);
    for (const t of g.tris) {
      const a = g.verts[t[0]], b = g.verts[t[1]], c = g.verts[t[2]];
      const nx = (b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);
      const ny = (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
      const nz = (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
      for (const i of t) { normals[i*3]+=nx; normals[i*3+1]+=ny; normals[i*3+2]+=nz; }
    }
    for (let i = 0; i < vn; i++) {
      const l = Math.hypot(normals[i*3],normals[i*3+1],normals[i*3+2]) || 1;
      normals[i*3]/=l; normals[i*3+1]/=l; normals[i*3+2]/=l;
    }
    const fc = g.faceColors && g.faceColors.length === g.tris.length;
    const out = { triCount: g.tris.length };
    if (!fc) {
      const data = new Float32Array(vn * 9);
      for (let i = 0; i < vn; i++) {
        const v = g.verts[i];
        data[i*9]=v[0]; data[i*9+1]=v[1]; data[i*9+2]=v[2];
        data[i*9+3]=normals[i*3]; data[i*9+4]=normals[i*3+1]; data[i*9+5]=normals[i*3+2];
        data[i*9+6]=0.80; data[i*9+7]=0.83; data[i*9+8]=0.90;
      }
      const idx = new Uint32Array(g.tris.length * 3);
      g.tris.forEach((t, f) => { idx[f*3]=t[0]; idx[f*3+1]=t[1]; idx[f*3+2]=t[2]; });
      out.tri = data; out.index = idx;
    } else {
      // smooth-shading trick with per-face colors: average the two face colors at each edge
      // so curved surfaces get a gentle gradient instead of hard facets.
      const ntri = g.tris.length;
      const faceCol = new Array(ntri);
      for (let f = 0; f < ntri; f++) faceCol[f] = parseColor(g.faceColors[f]);
      // accumulate color sums per (vertex, face-neighborhood) via vertex->faces map
      const vfaces = new Map();
      for (let f = 0; f < ntri; f++) {
        for (const vi of g.tris[f]) {
          let arr = vfaces.get(vi); if (!arr) { arr = []; vfaces.set(vi, arr); }
          if (arr.length < 8) arr.push(f);
        }
      }
      const smoothC = new Float32Array(vn * 3);
      for (const [vi, fs] of vfaces) {
        let r = 0, gg = 0, bb = 0;
        for (const f of fs) { r += faceCol[f][0]; gg += faceCol[f][1]; bb += faceCol[f][2]; }
        const n = fs.length;
        smoothC[vi*3] = r/n; smoothC[vi*3+1] = gg/n; smoothC[vi*3+2] = bb/n;
      }
      const dup = new Float32Array(ntri * 3 * 9);
      for (let f = 0; f < ntri; f++) {
        const t = g.tris[f];
        const cc = faceCol[f];
        for (let k = 0; k < 3; k++) {
          const i = t[k], o = (f*3+k)*9;
          dup[o]=g.verts[i][0]; dup[o+1]=g.verts[i][1]; dup[o+2]=g.verts[i][2];
          dup[o+3]=normals[i*3]; dup[o+4]=normals[i*3+1]; dup[o+5]=normals[i*3+2];
          // blend flat face color with neighborhood-smoothed color -> elegant gradient, still crisp edges
          dup[o+6]=cc[0]*0.55 + smoothC[i*3]*0.45;
          dup[o+7]=cc[1]*0.55 + smoothC[i*3+1]*0.45;
          dup[o+8]=cc[2]*0.55 + smoothC[i*3+2]*0.45;
        }
      }
      out.tri = dup; out.index = null;
    }
    const lineData = new Float32Array(g.rawLines.length * 6);
    g.rawLines.forEach((ln, i) => {
      lineData[i*6]=ln[0][0]; lineData[i*6+1]=ln[0][1]; lineData[i*6+2]=ln[0][2];
      lineData[i*6+3]=ln[1][0]; lineData[i*6+4]=ln[1][1]; lineData[i*6+5]=ln[1][2];
    });
    const edgeData = new Float32Array(g.edges.length * 6);
    g.edges.forEach((e, i) => {
      const a = g.verts[e[0]], b = g.verts[e[1]];
      edgeData[i*6]=a[0];edgeData[i*6+1]=a[1];edgeData[i*6+2]=a[2];
      edgeData[i*6+3]=b[0];edgeData[i*6+4]=b[1];edgeData[i*6+5]=b[2];
    });
    out.lines = concatF32(lineData, edgeData);
    return out;
  }
  function concatF32(a, b) { const c = new Float32Array(a.length + b.length); c.set(a); c.set(b, a.length); return c; }

  function mat4Identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mat4Mul(a, b) { const o = new Float32Array(16);
    for (let i=0;i<4;i++) for (let j=0;j<4;j++) o[j*4+i]=a[i]*b[j*4]+a[4+i]*b[j*4+1]+a[8+i]*b[j*4+2]+a[12+i]*b[j*4+3];
    return o; }
  function mat4Persp(fov, asp, near, far) { const f = 1/Math.tan(fov/2), nf = 1/(near-far);
    return new Float32Array([f/asp,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]); }
  function mat4LookAt(eye, ctr) {
    const z = norm([eye[0]-ctr[0], eye[1]-ctr[1], eye[2]-ctr[2]]);
    const up = [0,1,0];
    let x = cross(up, z); if (Math.hypot(...x) < 1e-6) x = [1,0,0]; x = norm(x);
    const y = cross(z, x);
    return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
      -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  function mat4RotYX(ry, rx) {
    const cy=Math.cos(ry), sy=Math.sin(ry), cx=Math.cos(rx), sx=Math.sin(rx);
    return new Float32Array([cy,0,-sy,0, sy*sx,cx,cy*sx,0, sy*cx,-sx,cy*cx,0, 0,0,0,1]);
  }
  function mat3NormalFromMat4(m) { return new Float32Array([m[0],m[1],m[2], m[4],m[5],m[6], m[8],m[9],m[10]]); }

  class Viewer {
    constructor(container, opts) {
      opts = opts || {};
      this.container = container;
      this.autoRotate = opts.autoRotate !== false;
      this.bg = opts.bg || '#101826';
      this.rotY = 0.6; this.rotX = -0.35; this.dist = 6;
      this.model = null; this.geo = null; this.glObj = null;
      this.dragging = false; this.last = null;
      this.fitDist = 1;
      this._bgGrad = null; // cached gradient key
      this._buildDom();
      this._initGL();
      this._bind();
      this._raf = requestAnimationFrame(this._loop.bind(this));
      if (opts.model) this.showModel(opts.model);
    }
    _buildDom() {
      const c = this.container;
      c.style.position = 'relative';
      c.innerHTML = `<canvas class="m3d-canvas" style="width:100%;height:100%;display:block;border-radius:12px;touch-action:none"></canvas>
        <div class="m3d-hud" style="position:absolute;left:10px;bottom:8px;font-size:11px;opacity:.75;color:#cfe3ff;pointer-events:none"></div>`;
      this.canvas = c.querySelector('canvas');
      this.hud = c.querySelector('.m3d-hud');
    }
    _initGL() {
      const gl = this.canvas.getContext('webgl2', { antialias: true, alpha: false });
      this.gl = gl;
      if (gl) {
        this.prog = this._program(VS, FS);
        this.lineProg = this._program(LS, LF);
        this.triVAO = gl.createVertexArray(); this.triBuf = gl.createBuffer();
        this.lineVAO = gl.createVertexArray(); this.lineBuf = gl.createBuffer();
      }
    }
    _program(vsSrc, fsSrc) {
      const gl = this.gl;
      const compile = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
      gl.linkProgram(p); return p;
    }
    _bind() {
      const cv = this.canvas;
      const down = e => { this.dragging = true; this.last = [e.clientX, e.clientY]; };
      const move = e => { if (!this.dragging) return;
        const dx = e.clientX - this.last[0], dy = e.clientY - this.last[1];
        this.rotY += dx * 0.008; this.rotX = Math.max(-1.4, Math.min(1.4, this.rotX + dy * 0.008));
        this.last = [e.clientX, e.clientY]; };
      const up = () => { this.dragging = false; };
      cv.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      cv.addEventListener('wheel', e => { e.preventDefault(); this.dist = Math.max(2.5, Math.min(14, this.dist + e.deltaY * 0.004)); }, { passive: false });
    }
    showModel(model) {
      this.model = model;
      try { this.geo = buildGeometry(model); } catch (err) { console.warn('build fail', err); this.geo = buildPlatonic(1, 1.5); }
      // fit distance
      let maxR = 0.5;
      for (const v of this.geo.verts) maxR = Math.max(maxR, Math.hypot(...v));
      this.fitDist = maxR;
      this.hud.textContent = `${model.name} · ${model.category} · ${model.level}`;
      if (this.gl) {
        this.glObj = prepBuffers(this.gl, this.geo);
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.glObj.tri, gl.STATIC_DRAW);
        gl.bindVertexArray(this.triVAO);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        if (this.glObj.index) {
          if (!this.idxBuf) this.idxBuf = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.glObj.index, gl.STATIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.glObj.lines, gl.STATIC_DRAW);
        gl.bindVertexArray(this.lineVAO);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
        gl.bindVertexArray(null);
      }
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
        if (this.gl) this.gl.viewport(0, 0, w, h);
      }
    }
    _loop(t) {
      this.resize();
      if (this.autoRotate && !this.dragging) this.rotY += 0.004;
      if (this.gl && this.geo) this._renderGL(t);
      else if (this.geo) this._render2D(t);
      this._raf = requestAnimationFrame(this._loop.bind(this));
    }
    _matrices() {
      const aspect = this.canvas.width / Math.max(1, this.canvas.height);
      // elegant framing: gentle ease toward the fitted distance (smooth zoom-in on model change)
      if (this._curDist == null) this._curDist = this.dist;
      const target = this.dist * (this.fitDist || 1) * 0.9 + 2.2;
      this._curDist += (target - this._curDist) * 0.08;
      const dist = this._curDist;
      const eye = [Math.sin(this.rotY) * Math.cos(this.rotX) * dist, -Math.sin(this.rotX) * dist, Math.cos(this.rotY) * Math.cos(this.rotX) * dist];
      const proj = mat4Persp(0.85, aspect, 0.1, 100);
      const view = mat4LookAt(eye, [0, 0, 0]);
      const mv = mat4Mul(view, mat4Identity());
      const mvp = mat4Mul(proj, mv);
      return { mvp, mv, nm: mat3NormalFromMat4(mv) };
    }
    _drawBackgroundGL(gl, W, H) {
      // fullscreen quad with vertical gradient + soft radial vignette (no depth write)
      if (!this.bgProg) {
        const bvs = `#version 300 es
        layout(location=0) in vec2 aP; out vec2 vUv;
        void main(){ vUv=aP*0.5+0.5; gl_Position=vec4(aP,0.999,1.0); }`;
        const bfs = `#version 300 es
        precision mediump float; in vec2 vUv; out vec4 o;
        uniform vec3 uTop; uniform vec3 uBot; uniform vec3 uGlow;
        void main(){
          vec3 c = mix(uBot, uTop, smoothstep(0.0,1.0,vUv.y));
          // studio glow behind subject
          float d = distance(vUv, vec2(0.5,0.56));
          c += uGlow * exp(-d*d*7.0) * 0.9;
          // subtle corner darkening
          c *= 1.0 - 0.35*pow(d*1.25, 2.6);
          o = vec4(c,1.0);
        }`;
        this.bgProg = this._program(bvs, bfs);
        this.bgVAO = gl.createVertexArray();
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        gl.bindVertexArray(this.bgVAO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
      }
      const gl2 = gl;
      gl2.disable(gl2.DEPTH_TEST);
      gl2.useProgram(this.bgProg);
      const key = this.bg;
      if (this._bgKey !== key) {
        this._bgKey = key;
        const base = parseColor(key);
        // derive an elegant navy-graphite range from the requested bg color
        const top = [base[0]*0.9+0.06, base[1]*0.95+0.09, base[2]*1.05+0.16];
        const bot = [base[0]*0.45, base[1]*0.5, base[2]*0.62];
        const glow = [base[0]*0.5+0.10, base[1]*0.6+0.14, base[2]*0.75+0.20];
        gl2.uniform3fv(gl2.getUniformLocation(this.bgProg, 'uTop'), top);
        gl2.uniform3fv(gl2.getUniformLocation(this.bgProg, 'uBot'), bot);
        gl2.uniform3fv(gl2.getUniformLocation(this.bgProg, 'uGlow'), glow);
      }
      gl2.bindVertexArray(this.bgVAO);
      gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
      gl2.bindVertexArray(null);
      gl2.enable(gl2.DEPTH_TEST);
    }
    _renderGL(t) {
      const gl = this.gl;
      const W = this.canvas.width, H = this.canvas.height;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this._drawBackgroundGL(gl, W, H);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      const { mvp, mv, nm } = this._matrices();
      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uMVP'), false, mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uMV'), false, mv);
      gl.uniformMatrix3fv(gl.getUniformLocation(this.prog, 'uNM'), false, nm);
      gl.uniform1f(gl.getUniformLocation(this.prog, 'uAlpha'), 1);
      gl.bindVertexArray(this.triVAO);
      if (this.glObj.index) gl.drawElements(gl.TRIANGLES, this.glObj.index.length, gl.UNSIGNED_INT, 0);
      else gl.drawArrays(gl.TRIANGLES, 0, this.glObj.triCount * 3);
      gl.useProgram(this.lineProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProg, 'uMVP'), false, mvp);
      // crisp luminous wireframe over shaded surface
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform4f(gl.getUniformLocation(this.lineProg, 'uColor'), 0.92, 0.96, 1.0, 0.6);
      gl.bindVertexArray(this.lineVAO);
      gl.drawArrays(gl.LINES, 0, this.glObj.lines.length / 3);
      gl.bindVertexArray(null);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    _render2D() {
      const ctx = this.canvas.getContext('2d');
      if (!ctx) return;
      const W = this.canvas.width, H = this.canvas.height;
      // elegant gradient background matching the GL studio look
      const bg = parseColor(this.bg);
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, `rgb(${Math.round((bg[0]*0.9+0.06)*255)},${Math.round((bg[1]*0.95+0.09)*255)},${Math.round(Math.min(1,bg[2]*1.05+0.16)*255)})`);
      grd.addColorStop(1, `rgb(${Math.round(bg[0]*0.45*255)},${Math.round(bg[1]*0.5*255)},${Math.round(bg[2]*0.62*255)})`);
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W/2, H*0.56, 0, W/2, H*0.56, Math.max(W,H)*0.55);
      glow.addColorStop(0, 'rgba(120,150,200,0.18)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      const { mvp } = this._matrices();
      const project = (p) => {
        const x = mvp[0]*p[0]+mvp[4]*p[1]+mvp[8]*p[2]+mvp[12];
        const y = mvp[1]*p[0]+mvp[5]*p[1]+mvp[9]*p[2]+mvp[13];
        const w = mvp[3]*p[0]+mvp[7]*p[1]+mvp[11]*p[2]+mvp[15];
        return [x/w*W/2+W/2, -y/w*H/2+H/2, w];
      };
      // key light direction in world space (matches GL shader) for painter's shading
      const Lk = [0.479, 0.784, 0.654];
      const shadeFace = (nrm, baseStr) => {
        const c = parseColor(baseStr);
        const nd = Math.max(nrm[0]*Lk[0]+nrm[1]*Lk[1]+nrm[2]*Lk[2], 0);
        const f = nd*0.85 + 0.42;
        return `rgb(${Math.min(255,Math.round(c[0]*f*255))},${Math.min(255,Math.round(c[1]*f*255))},${Math.min(255,Math.round(c[2]*f*255))})`;
      };
      const faces = [];
      const fc = this.geo.faceColors && this.geo.faceColors.length === this.geo.tris.length;
      this.geo.tris.forEach((t, f) => {
        const a = project(this.geo.verts[t[0]]), b = project(this.geo.verts[t[1]]), c = project(this.geo.verts[t[2]]);
        if (a[2] <= 0 || b[2] <= 0 || c[2] <= 0) return;
        const va = this.geo.verts[t[0]], vb = this.geo.verts[t[1]], vc = this.geo.verts[t[2]];
        const ux = vb[0]-va[0], uy = vb[1]-va[1], uz = vb[2]-va[2];
        const wx = vc[0]-va[0], wy = vc[1]-va[1], wz = vc[2]-va[2];
        let nx = uy*wz-uz*wy, ny = uz*wx-ux*wz, nz = ux*wy-uy*wx;
        const nl = Math.hypot(nx,ny,nz) || 1; nx/=nl; ny/=nl; nz/=nl;
        const base = fc ? this.geo.faceColors[f] : col(f);
        faces.push({ pts: [a, b, c], depth: (a[2]+b[2]+c[2])/3, color: shadeFace([nx,ny,nz], base) });
      });
      faces.sort((x, y) => x.depth - y.depth);
      for (const f of faces) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        ctx.lineTo(f.pts[1][0], f.pts[1][1]);
        ctx.lineTo(f.pts[2][0], f.pts[2][1]);
        ctx.closePath();
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.96; ctx.fill();
        ctx.globalAlpha = 0.10; ctx.strokeStyle = '#04070c'; ctx.lineWidth = 0.7; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = 'rgba(210,228,255,.55)'; ctx.lineWidth = 1;
      for (const ln of this.geo.rawLines) {
        const a = project(ln[0]), b = project(ln[1]);
        if (a[2] <= 0 || b[2] <= 0) continue;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    }
    dispose() { cancelAnimationFrame(this._raf); }
  }

  /* ---------- static preview image (no animation) — elegant studio thumbnail ---------- */
  function buildPreviewCanvas(model, px) {
    px = px || 120;
    let g;
    try { g = buildGeometry(model); } catch (e) { g = buildPlatonic(1, 1.5); }
    const cv = document.createElement('canvas');
    cv.width = px; cv.height = px;
    const ctx = cv.getContext('2d');
    // gradient + glow background (matches viewer)
    const grd = ctx.createLinearGradient(0, 0, 0, px);
    grd.addColorStop(0, '#1c2a41'); grd.addColorStop(1, '#060b14');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, px, px);
    const glow = ctx.createRadialGradient(px/2, px*0.56, 0, px/2, px*0.56, px*0.62);
    glow.addColorStop(0, 'rgba(110,145,200,0.20)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, px, px);
    const rotY = 0.7, rotX = -0.45, dist = 5.2;
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    let maxR = 0.5; g.verts.forEach(v => maxR = Math.max(maxR, Math.hypot(...v)));
    const scale = px * 0.38 / maxR;
    const project = (p) => {
      let x = p[0]*cy + p[2]*sy, z = -p[0]*sy + p[2]*cy, y = p[1];
      const y2 = y*cx - z*sx, z2 = y*sx + z*cx;
      y = y2; z = z2;
      const w = dist + z;
      return [px/2 + x*scale*(dist/w), px/2 - y*scale*(dist/w), w];
    };
    // world-space normals for painter lighting (key light matches GL shader)
    const Lk = [0.479, 0.784, 0.654], Lf = [-0.706, 0.151, -0.353];
    const toRgb = (c) => {
      if (typeof c !== 'string') return [0.8,0.8,0.8];
      return parseColor(c);
    };
    const faces = [];
    const fc = g.faceColors && g.faceColors.length === g.tris.length;
    for (let f = 0; f < g.tris.length; f++) {
      const t = g.tris[f];
      const a = project(g.verts[t[0]]), b = project(g.verts[t[1]]), c = project(g.verts[t[2]]);
      if (a[2] <= 0.1) continue;
      const va = g.verts[t[0]], vb = g.verts[t[1]], vc = g.verts[t[2]];
      const ux = vb[0]-va[0], uy = vb[1]-va[1], uz = vb[2]-va[2];
      const wx = vc[0]-va[0], wy = vc[1]-va[1], wz = vc[2]-va[2];
      let nx = uy*wz-uz*wy, ny = uz*wx-ux*wz, nz = ux*wy-uy*wx;
      const nl = Math.hypot(nx,ny,nz) || 1; nx/=nl; ny/=nl; nz/=nl;
      const base = toRgb(fc ? g.faceColors[f] : col(f + hashStr(model.id)));
      const nd = Math.max(nx*Lk[0]+ny*Lk[1]+nz*Lk[2], 0);
      const ndf = Math.max(nx*Lf[0]+ny*Lf[1]+nz*Lf[2], 0);
      const sh = nd*0.9 + ndf*0.25 + 0.38;
      faces.push({ pts: [a, b, c], depth: (a[2]+b[2]+c[2])/3,
        color: `rgb(${Math.min(255,Math.round(base[0]*sh*255))},${Math.min(255,Math.round(base[1]*sh*255))},${Math.min(255,Math.round(base[2]*sh*255))})` });
    }
    faces.sort((x, y) => y.depth - x.depth);
    for (const f of faces) {
      ctx.beginPath();
      ctx.moveTo(f.pts[0][0], f.pts[0][1]);
      ctx.lineTo(f.pts[1][0], f.pts[1][1]);
      ctx.lineTo(f.pts[2][0], f.pts[2][1]);
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.globalAlpha = 0.97; ctx.fill();
      ctx.globalAlpha = 0.10; ctx.strokeStyle = '#04070c'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(205,225,255,.5)'; ctx.lineWidth = Math.max(0.8, px/140);
    for (const ln of g.rawLines) {
      const a = project(ln[0]), b = project(ln[1]);
      if (a[2] <= 0.1 || b[2] <= 0.1) continue;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // soft vignette on top
    const vg = ctx.createRadialGradient(px/2, px/2, px*0.35, px/2, px/2, px*0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, px, px);
    return cv;
  }

  /* ---------- catalog API ---------- */
  let MODELS = [];
  const api = {
    version: '1.0.0',
    get models() { return MODELS; },
    loadModels: async function (urlOrData) {
      if (Array.isArray(urlOrData)) { MODELS = urlOrData; return MODELS; }
      const res = await fetch(urlOrData);
      MODELS = await res.json();
      return MODELS;
    },
    getModel: id => MODELS.find(m => m.id === id),
    search: q => {
      q = q.toLowerCase();
      return MODELS.filter(m => !q || m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    },
    createViewer: (el, opts) => new Viewer(el, opts),
    buildPreviewCanvas,
    buildGeometry,
    Viewer
  };
  global.Math3DCatalog = api;
})(window);
