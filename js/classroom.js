/* ============================================================
 * Math3D · CLASSROOM LAYER  (lớp học toán) v1.0
 * Biến bộ sưu tập mô hình 3D thành HỌC LIỆU thật: công thức + số đo,
 * khai triển (net), mặt cắt (cross-section), tháo rời từng phần,
 * câu hỏi kiểm tra tự sinh, giáo án, phiếu bài tập in ra giấy.
 *
 * Nạp SAU js/math3d.js. Không dùng thư viện ngoài.
 *
 *   Math3DClassroom.metrics(m)            -> [{label,value,unit,formula}]
 *   Math3DClassroom.net(m)                -> {faces,folds,title,note}|null
 *   Math3DClassroom.sectionAt(m,mode,k)   -> {segs,loops,info}
 *   Math3DClassroom.parts(m)              -> {list:[{name,sub,note}]}|null
 *   Math3DClassroom.quiz(m,n)             -> [{q,options,answer,explain}]
 *   Math3DClassroom.lessonPlan(m)         -> {objectives,activities,...}
 *   Math3DClassroom.teachSteps(m)         -> [{title,body}]
 *   Math3DClassroom.worksheetHTML(list)   -> HTML tự chứa để in
 *   Math3DClassroom.exportOBJ(m)          -> chuỗi .obj
 *   Math3DClassroom.embedCode(m)          -> snippet nhúng trang khác
 *   Math3DClassroom.enrich(m) / enrichAll -> gắn mọi thứ vào model
 * ============================================================ */
(function (global) {
  'use strict';
  const CAT = global.Math3DCatalog;
  if (!CAT || !CAT.buildGeometry) throw new Error('math3d.js phải được nạp trước classroom.js');

  const PI = Math.PI, TAU = 2 * PI;

  /* ---------- helpers ---------- */
  function fmt(n, d) {
    if (typeof n !== 'number' || !isFinite(n)) return String(n == null ? '—' : n);
    d = d === undefined ? 2 : d;
    let s = n.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  const UNIT_BY_CAT = { 'Khối đa diện': 'cm', 'Mặt tròn xoay': 'cm', 'Hình phẳng': 'cm',
                        'Ứng dụng thực tế': 'cm', 'Công nghệ 3D': 'cm', 'Số học': '',
                        'Hàm số': '', 'Giải tích': '', 'Hàm lượng giác': '', 'Fractal': '',
                        'Thống kê': '', 'Xác suất': '', 'Vectơ': '', 'Hình học biến đổi': '' };
  function unitOf(m) { return UNIT_BY_CAT[m.category] !== undefined ? UNIT_BY_CAT[m.category] : 'cm'; }
  function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function rngFrom(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a || 1; }
  const sq = x => x * x;
  const sideFromR = (n, R) => 2 * R * Math.sin(PI / n);
  const polyPerim = (n, R) => n * sideFromR(n, R);
  const polyArea = (n, R) => 0.5 * n * R * R * Math.sin(TAU / n);
  const apothem = (n, R) => R * Math.cos(PI / n);

  /* ============================================================
   * 1) METRICS — công thức chương trình + kết quả tính sẵn
   * ============================================================ */
  function metrics(model) {
    const p = model.params || {}, u = unitOf(model), A = [];
    const row = (label, value, formula, unit) => {
      if (value === undefined || value === null || value === '') return;
      if (typeof value === 'number' && !isFinite(value)) return;
      A.push({ label, value: typeof value === 'number' ? fmt(value, 3) : String(value),
               unit: unit === undefined ? (u || '') : unit, formula: formula || '' });
    };
    switch (model.kind) {
      case 'platonic': {
        const ty = p.type | 0, a = p.size || 1.5;
        const NM = ['Tứ diện đều', 'Lập phương', 'Bát diện đều', 'Thập nhị diện đều', 'Ngũ thập nhị diện đều'];
        const Vv = [Math.SQRT2 / 12, 1, Math.SQRT2 / 3, (15 + 7 * Math.sqrt(5)) / 12, (15 + 7 * Math.sqrt(5)) / 4][ty] * Math.pow(a, 3);
        const Sv = [Math.sqrt(3), 6, 2 * Math.sqrt(3), Math.sqrt(25 + 10 * Math.sqrt(5)), Math.sqrt(25 + 10 * Math.sqrt(5))][ty] * sq(a);
        const F = [4, 6, 8, 12, 20][ty], E = [6, 12, 12, 30, 30][ty], D = [4, 8, 6, 20, 12][ty];
        const fV = ['V = (√2/12)·a³', 'V = a³', 'V = (√2/3)·a³', 'V = ((15+7√5)/12)·a³', 'V = ((15+7√5)/4)·a³'][ty];
        const fS = ['S_tp = √3·a²', 'S_tp = 6a²', 'S_tp = 2√3·a²', 'S_tp = √(25+10√5)·a²', 'S_tp = √(25+10√5)·a²'][ty];
        row('Khối', NM[ty], 'khối đa diện đều (Platon) — chỉ có đúng 5 loại', '');
        row('Cạnh a', a, 'đề bài cho', u);
        row('Thể tích V', Vv, fV, u + '³');
        row('Diện tích toàn phần', Sv, fS, u + '²');
        row('Số mặt F', F, `mỗi mặt là ${[3, 4, 3, 5, 3][ty]} giác đều`, '');
        row('Số cạnh E', E, `tại mỗi đỉnh gặp ${[3, 3, 4, 3, 5][ty]} cạnh`, '');
        row('Số đỉnh Đ', D, `Euler: ${D} − ${E} + ${F} = 2 ✓`, '');
        if (ty === 1) { row('Đường chéo hình', a * Math.sqrt(3), 'd = a√3', u); row('Đường chéo mặt', a * Math.sqrt(2), 'd_mặt = a√2', u); }
        if (ty === 0) row('Chiều cao', a * Math.sqrt(2 / 3), 'h = a·√(2/3)', u);
        break;
      }
      case 'prism': {
        const n = Math.max(3, p.sides || 4), R = p.radius || 1, h = p.height || 2;
        const a = sideFromR(n, R), B = polyArea(n, R), C = polyPerim(n, R);
        row('Lăng trụ đều', `${n} cạnh`, 'hai đáy song song & bằng nhau, mặt bên là chữ nhật', '');
        row('Cạnh đáy a', a, `a = 2R·sin(π/${n})`, u);
        row('Chu vi đáy C', C, 'C = n·a', u);
        row('Diện tích đáy B', B, 'B = ½·n·R²·sin(2π/n)', u + '²');
        row('Chiều cao h', h, 'đề bài cho', u);
        row('Diện tích xung quanh', C * h, 'S_xq = C·h', u + '²');
        row('Diện tích toàn phần', C * h + 2 * B, 'S_tp = S_xq + 2B', u + '²');
        row('Thể tích V', B * h, 'V = B·h', u + '³');
        row('Mặt/Cạnh/Đỉnh', `${n + 2} / ${3 * n} / ${2 * n}`, `Euler: ${2 * n} − ${3 * n} + ${n + 2} = 2 ✓`, '');
        break;
      }
      case 'pyramid': {
        const n = Math.max(3, p.sides || 4), R = p.radius || 1, h = p.height || 1.6;
        const a = sideFromR(n, R), B = polyArea(n, R), C = polyPerim(n, R);
        const ap = apothem(n, R), l = Math.hypot(h, ap), ben = Math.hypot(h, R);
        row('Hình chóp đều', `${n} cạnh`, 'đáy là đa giác đều, chân đường cao trùng tâm đáy', '');
        row('Cạnh đáy a', a, `a = 2R·sin(π/${n})`, u);
        row('Đường cao h', h, 'đề bài cho', u);
        row('Trung đoạn đáy', ap, 'ap = R·cos(π/n)', u);
        row('Đường nghiêng l', l, 'l = √(h² + ap²)', u);
        row('Cạnh bên', ben, 'cạnh bên = √(h² + R²)', u);
        row('Diện tích đáy B', B, 'B = ½·n·R²·sin(2π/n)', u + '²');
        row('Diện tích xung quanh', 0.5 * C * l, 'S_xq = ½·C·l', u + '²');
        row('Diện tích toàn phần', 0.5 * C * l + B, 'S_tp = S_xq + B', u + '²');
        row('Thể tích V', B * h / 3, 'V = ⅓·B·h', u + '³');
        row('So sánh lăng trụ', B * h, `lăng trụ cùng đáy & cao có V gấp 3 lần (${fmt(B * h)} ${u}³)`, u + '³');
        row('Góc cạnh bên–đáy', fmt(Math.atan2(h, R) * 180 / PI, 1), 'tan φ = h/R', '°');
        break;
      }
      case 'cylinder': {
        const r = p.r || 1, h = p.h || 2, hollow = p.variant === 2 || p.variant === 3;
        row('Hình trụ', p.variant === 1 ? 'trụ elip' : hollow ? 'trụ rỗng (vật)' : 'tròn xoay', 'quay hình chữ nhật quanh một cạnh của nó', '');
        row('Bán kính đáy R', r, 'đề bài cho', u);
        row('Chiều cao h', h, 'đề bài cho', u);
        row('Chu vi đáy C', TAU * r, 'C = 2πR', u);
        row('Diện tích đáy B', PI * sq(r), 'B = πR²', u + '²');
        row('Diện tích xung quanh', TAU * r * h, 'S_xq = 2πR·h', u + '²');
        row('Diện tích toàn phần', TAU * r * (h + r), 'S_tp = 2πR(h + R)', u + '²');
        row('Thể tích V', PI * sq(r) * h, 'V = πR²h', u + '³');
        if (hollow) {
          const ri = (p.variant === 3 ? r * 0.6 : r * 0.55);
          row('Bán kính lỗ r', ri, 'lỗ trong ≈ 0.55R ÷ 0.6R', u);
          row('Thể tích vật liệu', PI * (sq(r) - sq(ri)) * h, 'V = π(R² − r²)·h', u + '³');
        }
        row('Khai triển S_xq', `${fmt(TAU * r)} × ${fmt(h)}`, 'chữ nhật: ngang = chu vi đáy, dọc = h', u);
        break;
      }
      case 'cone': {
        const r = p.r || 1, h = p.h || 2, l = Math.hypot(r, h);
        row('Hình nón', p.variant === 2 ? 'nón xiên' : 'nón tròn', 'quay tam giác vuông quanh một cạnh góc vuông', '');
        row('Bán kính đáy R', r, 'đề bài cho', u);
        row('Chiều cao h', h, 'đề bài cho', u);
        row('Đường sinh l', l, 'l = √(R² + h²) — Pythagoras', u);
        row('Diện tích đáy B', PI * sq(r), 'B = πR²', u + '²');
        row('Diện tích xung quanh', PI * r * l, 'S_xq = πRl', u + '²');
        row('Diện tích toàn phần', PI * r * (l + r), 'S_tp = πR(l + R)', u + '²');
        row('Thể tích V', PI * sq(r) * h / 3, 'V = ⅓πR²h', u + '³');
        row('Góc ở đỉnh', fmt(2 * Math.atan2(r, h) * 180 / PI, 1), 'góc đỉnh = 2·arctan(R/h)', '°');
        row('Quạt khai triển', `R = ${fmt(l)}, θ = ${fmt(TAU * r / l * 180 / PI, 1)}°`, 'θ = (R/l)·360°; cung quạt = 2πR', u);
        break;
      }
      case 'sphere': {
        const r = p.r || 1;
        row('Mặt cầu', `bán kính ${fmt(r)} ${u}`, 'tập hợp các điểm cách O một khoảng R', '');
        row('Đường kính D', 2 * r, 'D = 2R', u);
        row('Chu vi vòng lớn', TAU * r, 'C = 2πR', u);
        row('Diện tích mặt S', 4 * PI * sq(r), 'S = 4πR²', u + '²');
        row('Thể tích V', 4 / 3 * PI * Math.pow(r, 3), 'V = (4/3)πR³', u + '³');
        row('Trụ bao ngoài', PI * sq(r) * 2 * r, 'V_trụ = πR²·2R ⇒ V_trụ : V_cầu = 3 : 2 (Archimedes)', u + '³');
        break;
      }
      case 'torus': {
        const R = p.R || 1.2, r = p.r || 0.4;
        row('Hình xuyến (torus)', `R = ${fmt(R)}, r = ${fmt(r)}`, 'quay một đường tròn quanh trục không cắt nó', '');
        row('Thể tích V', 2 * PI * PI * R * sq(r), 'V = 2π²Rr² (định lý Pappinus)', u + '³');
        row('Diện tích mặt S', 4 * PI * PI * R * r, 'S = 4π²Rr', u + '²');
        break;
      }
      case 'polygon': {
        const n = Math.max(3, p.sides || 5), R = p.radius || 1;
        row('Đa giác đều', `${n} cạnh`, 'nội tiếp đường tròn bán kính R', '');
        row('Cạnh a', sideFromR(n, R), `a = 2R·sin(π/${n})`, u);
        row('Chu vi P', polyPerim(n, R), 'P = n·a', u);
        row('Diện tích S', polyArea(n, R), 'S = ½·n·R²·sin(2π/n)', u + '²');
        row('Trung đoạn ap', apothem(n, R), 'ap = R·cos(π/n) ⇒ S = ½·P·ap', u);
        row('Tổng góc trong', (n - 2) * 180, '(n − 2)·180°', '°');
        row('Mỗi góc trong', (n - 2) * 180 / n, '((n − 2)·180°)/n', '°');
        row('Mỗi góc ngoài', 360 / n, '360°/n — tổng góc ngoài luôn bằng 360°', '°');
        row('Số đường chéo', n * (n - 3) / 2, 'n(n − 3)/2', '');
        break;
      }
      case 'rect': {
        const ratio = p.ratio || 1, sc = p.scale || 1.4;
        const w = ratio >= 1 ? sc : sc * ratio, hh = ratio >= 1 ? sc / ratio : sc;
        row('Hình chữ nhật', `tỉ lệ a:b = ${fmt(ratio, 3)}`, 'bốn góc vuông', '');
        row('Chiều dài a', w, 'đề bài cho', u);
        row('Chiều rộng b', hh, 'đề bài cho', u);
        row('Chu vi P', 2 * (w + hh), 'P = 2(a + b)', u);
        row('Diện tích S', w * hh, 'S = a·b', u + '²');
        row('Đường chéo d', Math.hypot(w, hh), 'd = √(a² + b²)', u);
        break;
      }
      case 'triangle': {
        const t = p.type | 0, sc = p.scale || 1;
        const SPEC = [
          { n: 'đều', c: [sc, sc, sc], ang: [60, 60, 60] },
          { n: 'cân', c: [sc, sc, sc * 1.2], ang: null },
          { n: 'vuông', c: [sc, sc * 0.8, Math.hypot(sc, sc * 0.8)], ang: null },
          { n: 'nhọn', c: [sc, sc * 0.9, sc * 0.7], ang: null },
          { n: 'tù', c: [sc, sc * 0.8, sc * 1.5], ang: null },
          { n: '30°-60°-90°', c: [sc, sc * Math.sqrt(3), 2 * sc], ang: [30, 60, 90] },
          { n: 'vuông cân', c: [sc, sc, sc * Math.SQRT2], ang: [45, 45, 90] }
        ];
        const sp = SPEC[t % SPEC.length] || SPEC[0];
        const a = sp.c[0], b = sp.c[1], c = sp.c[2], pd = (a + b + c) / 2;
        const S = Math.sqrt(Math.max(0, pd * (pd - a) * (pd - b) * (pd - c)));
        let ang = sp.ang;
        if (!ang) {
          const A1 = Math.acos((sq(b) + sq(c) - sq(a)) / (2 * b * c)) * 180 / PI;
          const A2 = Math.acos((sq(a) + sq(c) - sq(b)) / (2 * a * c)) * 180 / PI;
          ang = [A1, A2, 180 - A1 - A2];
        }
        row('Tam giác', sp.n, 'phân loại theo cạnh và theo góc', '');
        row('Ba cạnh', `${fmt(a)} ; ${fmt(b)} ; ${fmt(c)}`, 'a, b, c', u);
        row('Ba góc', ang.map(x => fmt(x, 1)).join('° ; ') + '°', `tổng = ${fmt(ang[0] + ang[1] + ang[2], 1)}° = 180° ✓ (định lý)`, '');
        row('Nửa chu vi p', pd, 'p = (a+b+c)/2', u);
        row('Chu vi P', 2 * pd, 'P = a + b + c', u);
        row('Diện tích S', S, 'Heron: S = √(p(p−a)(p−b)(p−c))', u + '²');
        row('Chiều cao h_a', 2 * S / a, 'S = ½·a·h_a ⇒ h_a = 2S/a', u);
        row('Bán kính nội tiếp r', S / pd, 'r = S/p', u);
        row('Bán kính ngoại tiếp R', a * b * c / (4 * Math.max(S, 1e-9)), 'R = abc/(4S)', u);
        row('Kiểm tra Pythagoras', Math.abs(sq(a) + sq(b) - sq(c)) < 1e-6 * sq(c) ? 'a² + b² = c² ✓ tam giác vuông' : 'không thoả a² + b² = c² → không vuông', 'a² + b² ⋛ c²', '');
        break;
      }
      case 'quad': {
        const t = p.type | 0, sc = p.scale || 1.2;
        const K = [
          { n: 'Hình vuông', a: sc, b: sc, note: '4 cạnh bằng nhau; 4 góc 90°; hai đường chéo bằng nhau và vuông góc tại trung điểm' },
          { n: 'Hình chữ nhật', a: sc * 1.4, b: sc, note: '4 góc 90°; hai đường chéo bằng nhau' },
          { n: 'Hình bình hành', a: sc * 1.3, b: sc, note: 'cặp cạnh đối song song và bằng nhau; đường chéo cắt nhau tại trung điểm mỗi đường' },
          { n: 'Hình thoi', a: sc, b: sc, note: '4 cạnh bằng nhau; hai đường chéo vuông góc tại trung điểm' },
          { n: 'Hình thang', a: sc * 1.4, b: sc, note: 'có đúng một cặp cạnh đối song song' },
          { n: 'Hình thang cân', a: sc * 1.4, b: sc, note: 'thang có hai cạnh bên bằng nhau ⇒ hai đường chéo bằng nhau' },
          { n: 'Tứ giác lồi', a: sc, b: sc, note: 'tổng bốn góc trong bằng 360°' }
        ];
        const q = K[t % K.length] || K[0];
        row(q.n, 'đặc điểm', q.note, '');
        row('Cạnh a', q.a, 'đáy lớn / cạnh', u);
        row('Cạnh b', q.b, 'đáy nhỏ / cạnh', u);
        row('Chu vi P', 2 * (q.a + q.b), 'P = tổng bốn cạnh', u);
        if (t === 3) {
          const d1 = q.a * Math.sqrt(3), d2 = q.a;
          row('Hai đường chéo', `${fmt(d1)} ; ${fmt(d2)}`, 'd₁ = a√3, d₂ = a (minh hoạ)', u);
          row('Diện tích S', d1 * d2 / 2, 'S = ½·d₁·d₂', u + '²');
        } else if (t === 4 || t === 5) {
          const hg = Math.sqrt(Math.max(0, sq(q.b) - sq((q.a - q.b) / 2)));
          row('Chiều cao h', hg, 'h = √(cạnh_bên² − ((a−b)/2)²)', u);
          row('Diện tích S', (q.a + q.b) / 2 * hg, 'S = ½(a + b)·h', u + '²');
        } else {
          row('Diện tích S', q.a * q.b, t === 2 ? 'S = a·b·sin α với α = 60° (minh hoạ)' : 'S = a·b', u + '²');
          if (t === 2) row('S theo góc', q.a * q.b * Math.sin(PI / 3), 'S = a·b·sin α', u + '²');
        }
        row('Đường chéo d₁', Math.hypot(q.a, q.b), 'd = √(a² + b²) với hình vuông/chữ nhật', u);
        row('Tổng 4 góc trong', 360, '∠A + ∠B + ∠C + ∠D = 360°', '°');
        break;
      }
      case 'fractionpie': {
        const den = Math.max(2, p.den || 4), num = Math.min(Math.max(0, p.num | 0), den), g = gcd(num, den);
        row('Phân số', `${num}/${den}`, 'tử = số phần tô màu, mẫu = tổng số phần bằng nhau', '');
        row('Số thập phân', num / den, `${num} ÷ ${den}`, '');
        row('Phần trăm', `${fmt(100 * num / den, 2)}%`, '(tử số : mẫu số)·100%', '');
        row('Một phần', `1/${den} = ${fmt(1 / den, 4)}`, 'đơn vị của phép chia', '');
        row('Góc mỗi phần', `${fmt(360 / den, 1)}°`, '360° ÷ mẫu số', '');
        row('Góc phần tô', `${fmt(360 * num / den, 1)}°`, '(tử/mẫu)·360°', '');
        row('Rút gọn', g > 1 ? `${num / g}/${den / g}` : 'đã tối giản', `ƯCLN(${num}, ${den}) = ${g}`, '');
        row('Cần thêm', `${den - num}/${den}`, 'để được cả hình tròn (bằng 1)', '');
        break;
      }
      case 'transform': {
        const N = ['Tịnh tiến', 'Đối xứng trục', 'Đối xứng tâm', 'Quay 90°', 'Quay 180°', 'Vị tự (phóng to)'];
        const t = (p.type | 0) % N.length;
        row('Phép biến hình', N[t], t <= 4 ? 'phép dời hình: giữ nguyên độ dài, góc và diện tích' : 'phép đồng dạng: giữ nguyên góc, các cạnh nhân k', '');
        row('Toạ độ ảnh', t === 0 ? '(x, y) → (x+a, y+b)' : t === 1 ? '(x, y) → (−x, y)' : t === 2 ? '(x, y) → (−x, −y)'
            : t === 3 ? '(x, y) → (−y, x)' : t === 4 ? '(x, y) → (−x, −y)' : '(x, y) → (k·x, k·y)', 'quy tắc toạ độ', '');
        row('Bất biến', t <= 4 ? 'chu vi và diện tích không đổi' : 'chu vi nhân k, diện tích nhân k²', '', '');
        break;
      }
      case 'vector': {
        const len = p.len || 1;
        row('Độ dài vectơ |v⃗|', len, '|v⃗| = √(x² + y² + z²)', u);
        row('Vectơ đơn vị', 'v⃗ / |v⃗|', 'chia mỗi thành phần cho |v⃗| để được vectơ dài 1', '');
        row('Tích vô hướng v⃗·v⃗', sq(len), '|v⃗|² = v⃗·v⃗', '');
        row('Phép cộng', 'vec{AB} + vec{BC} = vec{AC}', 'quy tắc tam giác / quy tắc hình bình hành', '');
        break;
      }
      case 'stats': {
        const st = statsData(model);
        row('Bộ số liệu', st.data.join(' ; '), `n = ${st.n} giá trị (đọc từ các cột của biểu đồ)`, '');
        row('Lớn nhất / nhỏ nhất', `${st.max} / ${st.min}`, 'max − min = khoảng biến thiên', '');
        row('Trung bình cộng x̄', st.mean, 'x̄ = (x₁ + … + xₙ)/n', '');
        row('Trung vị Me', st.median, 'giá trị chính giữa của dãy đã sắp xếp', '');
        row('Mốt Mo', st.mode, 'giá trị xuất hiện nhiều nhất', '');
        row('Khoảng biến thiên R', st.range, 'R = max − min', '');
        row('Phương sai σ²', st.var, 'σ² = Σ(xᵢ − x̄)² / n', '');
        row('Độ lệch chuẩn σ', st.sd, 'σ = √σ² — đo mức độ phân tán', '');
        break;
      }
      case 'prob': {
        const pr = probData(model);
        row('Bài toán', pr.desc, 'các kết quả được coi là đồng khả năng', '');
        row('Không gian mẫu |Ω|', pr.n, 'đếm mọi kết quả có thể xảy ra', '');
        row('Kết quả thuận lợi |A|', pr.k, 'biến cố A', '');
        row('Xác suất P(A)', pr.k / pr.n, 'P(A) = |A| / |Ω|', '');
        row('Phần trăm', `${fmt(100 * pr.k / pr.n, 1)}%`, 'P(A)·100%', '');
        row('Biến cố đối Ā', 1 - pr.k / pr.n, 'P(Ā) = 1 − P(A)', '');
        row('Quy tắc cộng', 'P(A∪B) = P(A)+P(B)−P(A∩B)', 'hai biến cố xung khắc thì P(A∩B) = 0', '');
        row('Quy tắc nhân', 'P(A∩B) = P(A)·P(B|A)', 'hai biến cố độc lập thì P(A∩B) = P(A)·P(B)', '');
        break;
      }
      case 'graph2d': {
        const f = FN[(p.type | 0) % FN.length];
        row('Hàm số', f.eq, f.note, '');
        row('Tập xác định', f.dom, 'D = ' + f.dom, '');
        row('Đạo hàm y′', f.d, 'dy/dx = ' + f.d, '');
        row('Nguyên hàm', f.i, '∫ y dx = ' + f.i + ' + C', '');
        row('Ý nghĩa của y′', 'hệ số góc tiếp tuyến', 'y′ > 0: hàm đồng biến; y′ = 0: điểm dừng (cực trị)', '');
        break;
      }
      case 'surfacefn': {
        const f = SURF[(p.fn | 0) % SURF.length];
        row('Mặt', f.eq, f.note, '');
        row('Đạo hàm riêng', f.parts, 'grad f = (∂f/∂x , ∂f/∂y) chỉ hướng dốc nhất', '');
        break;
      }
      case 'polarcurve': {
        const f = POLAR[(p.type | 0) % POLAR.length];
        row('Phương trình cực', f.eq, f.note, '');
        row('Dạng Descartes', f.cart, 'x = r·cos θ, y = r·sin θ, r² = x² + y²', '');
        break;
      }
      case 'quadsurface': {
        const f = QUAD[(p.type | 0) % QUAD.length];
        row('Mặt bậc hai', f.eq, f.note, '');
        break;
      }
      case 'paramsurface': {
        row('Mặt tham số', 'r(u,v) = (x(u,v), y(u,v), z(u,v))', 'vectơ pháp tuyến n = r_u × r_v', '');
        break;
      }
      case 'revolution': {
        const f = REV[(p.type | 0) % REV.length];
        row('Đường sinh', f.curve, f.note, '');
        row('Thể tích (phương pháp đĩa)', f.V, 'V = π∫ [R(x)]² dx', '');
        row('Diện tích mặt (vỏ trụ)', f.S, 'S = 2π∫ R(x)·√(1 + y′²) dx', '');
        break;
      }
      case 'fractal': {
        const f = FRAC[(p.type | 0) % FRAC.length], dep = p.depth | 0;
        row('Fractal', f.name, f.rule, '');
        row('Số bản sao N', f.N, 'mỗi bước: 1 phần tử thay bằng N phần tử', '');
        row('Tỉ lệ thu nhỏ r', f.r, 'mỗi phần tử mới bằng r lần phần tử cũ', '');
        row('Kích thước Hausdorff D', f.D, 'D = ln N / ln(1/r)', '');
        row(`Bước ${dep}`, `số phần tử = ${Math.round(Math.pow(f.N, dep))}`, f.measure, '');
        break;
      }
      default:
        row('Mô hình', model.name, model.desc, '');
        break;
    }
    return A;
  }

  /* --- dữ liệu tất định, khớp với hình học do math3d.js sinh ra --- */
  function statsData(model) {
    const p = model.params || {}, rng = rngFrom(hashStr(model.id + '|stat|' + (p.seed || 0)));
    const n = 8 + ((p.seed || 0) % 5) * 2, data = [];
    for (let i = 0; i < n; i++) data.push(Math.round(20 + rng() * 70));
    const sorted = data.slice().sort((a, b) => a - b);
    const mean = data.reduce((s, x) => s + x, 0) / n;
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const freq = {}; let mode = sorted[0], bc = 0;
    data.forEach(v => { freq[v] = (freq[v] || 0) + 1; if (freq[v] > bc) { bc = freq[v]; mode = v; } });
    const variance = data.reduce((s, x) => s + (x - mean) * (x - mean), 0) / n;
    return { data, n, mean, median, mode, range: sorted[n - 1] - sorted[0], var: variance, sd: Math.sqrt(variance), max: sorted[n - 1], min: sorted[0] };
  }
  function probData(model) {
    const p = model.params || {}, t = (p.type | 0) % 8;
    const TABLE = [[6, 1, 'P(ra mặt 6) khi gieo một xúc xắc'], [36, 6, 'P(tổng bằng 7) khi gieo hai xúc xắc'],
                   [52, 13, 'P(rút được quân cơ) từ bộ 52 lá bài'], [36, 18, 'P(tổng chẵn) khi gieo hai xúc xắc'],
                   [8, 3, 'P(rút bóng đỏ) từ hộp có 3 đỏ – 5 xanh'], [4, 1, 'P(hai mặt ngửa) khi gieo hai đồng xu'],
                   [20, 5, 'P(chọn bạn nam) từ nhóm 5 nam – 15 nữ'], [9, 3, 'P(số chính phương) khi chọn một số từ 1 đến 9']];
    const T = TABLE[t];
    return { n: T[0], k: T[1], desc: T[2] };
  }

  const FN = [
    { eq: 'y = x', dom: 'ℝ', d: '1', i: 'x²/2', note: 'đường thẳng đi qua gốc, hệ số góc bằng 1' },
    { eq: 'y = x²', dom: 'ℝ', d: '2x', i: 'x³/3', note: 'parabol hướng lên, đỉnh O, nhận Oy làm trục đối xứng' },
    { eq: 'y = x³', dom: 'ℝ', d: '3x²', i: 'x⁴/4', note: 'hàm lẻ, nhận gốc O làm tâm đối xứng' },
    { eq: 'y = √x', dom: '[0; +∞)', d: '1/(2√x)', i: '(2/3)x^(3/2)', note: 'nghịch đảo của y = x² (với x ≥ 0)' },
    { eq: 'y = 1/x', dom: 'ℝ \\ {0}', d: '−1/x²', i: 'ln|x|', note: 'hyperbol, hai tiệm cận là Ox và Oy' },
    { eq: 'y = |x|', dom: 'ℝ', d: 'sign(x)', i: 'x|x|/2', note: 'hàm chẵn, đồ thị hình chữ V' },
    { eq: 'y = sin x', dom: 'ℝ', d: 'cos x', i: '−cos x', note: 'tuần hoàn với chu kỳ 2π, giá trị trong [−1; 1]' },
    { eq: 'y = cos x', dom: 'ℝ', d: '−sin x', i: 'sin x', note: 'tuần hoàn với chu kỳ 2π, là hàm chẵn' },
    { eq: 'y = tan x', dom: 'x ≠ π/2 + kπ', d: '1/cos²x', i: '−ln|cos x|', note: 'chu kỳ π, có các tiệm cận đứng' },
    { eq: 'y = eˣ', dom: 'ℝ', d: 'eˣ', i: 'eˣ', note: 'đồng biến, tiệm cận ngang y = 0' },
    { eq: 'y = ln x', dom: '(0; +∞)', d: '1/x', i: 'x·ln x − x', note: 'nghịch đảo của eˣ, đồ thị đi qua (1; 0)' },
    { eq: 'y = 1/(1+x²)', dom: 'ℝ', d: '−2x/(1+x²)²', i: 'arctan x', note: 'dạng chuông — liên hệ phân bố Cauchy' },
    { eq: 'y = x·sin x', dom: 'ℝ', d: 'sin x + x·cos x', i: '−x·cos x + sin x', note: 'biên tăng dần: dao động điều biến' },
    { eq: 'y = ⌊x⌋ (bậc thang)', dom: 'ℝ', d: '0 trên từng khoảng', i: 'x²/2 − {x}²/2', note: 'hàm sàn, gián đoạn tại mọi số nguyên' }
  ];
  const SURF = [
    { eq: 'z = x² + y²', note: 'paraboloid elliptic — dạng cái bát', parts: '∂z/∂x = 2x ; ∂z/∂y = 2y' },
    { eq: 'z = x² − y²', note: 'yên ngựa (hyperbolic paraboloid)', parts: '∂z/∂x = 2x ; ∂z/∂y = −2y' },
    { eq: 'z = sin x · cos y', note: 'mặt sóng tuần hoàn theo hai hướng', parts: '∂z/∂x = cos x·cos y ; ∂z/∂y = −sin x·sin y' },
    { eq: 'z = cos(√(x²+y²))', note: 'sóng tròn lan toả từ tâm', parts: '∂z/∂r = −sin r' },
    { eq: 'z = xy·e^{−(x²+y²)}', note: 'yên ngựa suy giảm Gauss', parts: '∇z = 0 tại các điểm tới hạn' },
    { eq: 'z = x³ − 3xy²', note: 'phần thực của z³ — hàm điều hoà', parts: '∂z/∂x = 3x²−3y² ; ∂z/∂y = −6xy' },
    { eq: 'z = 1/(1+x²+y²)', note: 'đồi Gauss', parts: '∂z/∂x = −2x/(1+r²)²' },
    { eq: 'z = |sin x| + |cos y|', note: 'mặt gấp — không khả vi tại các nếp', parts: 'khả vi từng khúc' },
    { eq: 'z = (x²−y²)/(x²+y²)', note: 'giới hạn tại gốc KHÔNG tồn tại', parts: 'phụ thuộc hướng tiếp cận' },
    { eq: 'z = sin(x²+y²)', note: 'vùng Fresnel — giao thoa', parts: '∂z/∂r = 2r·cos(r²)' }
  ];
  const POLAR = [
    { eq: 'r = a(1 + cos θ)', cart: '(x²+y²−ax)² = a²(x²+y²)', note: 'cardioid — đường trái tim' },
    { eq: 'r = a·sin 2θ', cart: '(x²+y²)³ = 4a²x²y²', note: 'hoa bốn cánh' },
    { eq: 'r = a·cos 3θ', cart: 'rhodonea', note: 'hoa ba cánh (n lẻ cho n cánh)' },
    { eq: 'r = a + bθ', cart: 'xoắn Archimedes', note: 'khoảng giữa hai vòng liên tiếp = 2πb' },
    { eq: 'r = a·e^{bθ}', cart: 'xoắn logarit', note: 'tự đồng dạng — gặp trong vỏ ốc' },
    { eq: 'r² = a²cos 2θ', cart: '(x²+y²)² = a²(x²−y²)', note: 'lemniscate Bernoulli (hình số 8 nằm)' },
    { eq: 'r = p/(1 + e·cos θ)', cart: 'conic có tiêu cự tại cực', note: 'e<1: elip, e=1: parabol, e>1: hyperbol' },
    { eq: 'r = 1 + 2cos θ', cart: 'limacon', note: 'có vòng trong khi b > a' },
    { eq: 'r = θ', cart: 'espiral', note: 'θ ∈ [0; 4π]' },
    { eq: 'r = a·sec θ', cart: 'x = a', note: 'đường thẳng — minh hoạ liên hệ cực/Descartes' },
    { eq: 'r = 2a·cos θ', cart: 'x² + y² = 2ax', note: 'đường tròn tâm (a; 0) đi qua cực' },
    { eq: 'r = a·|cos 2θ|^{1/2}', cart: '—', note: 'hoa tám cánh' }
  ];
  const QUAD = [
    { eq: 'x²/a² + y²/b² + z²/c² = 1', note: 'elipxôit — mọi thiết diện là elip' },
    { eq: 'x²/a² + y²/b² − z²/c² = 1', note: 'hyperbolôit một tầng (ống thẳng)' },
    { eq: 'x²/a² − y²/b² − z²/c² = 1', note: 'hyperbolôit hai tầng' },
    { eq: 'z = x²/a² + y²/b²', note: 'parabolôit elliptic (cái bát)' },
    { eq: 'z = x²/a² − y²/b²', note: 'parabolôit hyperbolic (yên ngựa)' },
    { eq: 'x²/a² + y²/b² = 1', note: 'trụ elliptic — trượt dọc trục Oz' },
    { eq: 'x²/a² − y²/b² = 1', note: 'trụ hyperbolic' },
    { eq: 'x² + y² + z² = R²', note: 'mặt cầu tâm O bán kính R' },
    { eq: 'z = √(x² + y²)', note: 'nón tròn đỉnh O' },
    { eq: 'x²/a² + y²/b² − z²/c² = 0', note: 'nón elliptic' }
  ];
  const REV = [
    { curve: 'đoạn thẳng song song với trục', note: 'quay quanh trục → HÌNH TRỤ', V: 'V = πR²h', S: 'S_xq = 2πRh' },
    { curve: 'đoạn thẳng cắt trục', note: 'quay quanh trục → HÌNH NÓN', V: 'V = ⅓πR²h', S: 'S_xq = πRl' },
    { curve: 'nửa đường tròn x²+y²=R²', note: 'quay quanh đường kính → MẶT CẦU', V: 'V = (4/3)πR³', S: 'S = 4πR²' },
    { curve: 'đường tròn (R+r·cos φ, r·sin φ)', note: 'quay → TORUS', V: 'V = 2π²Rr²', S: 'S = 4π²Rr' },
    { curve: 'y = 1/x với x ≥ 1', note: 'HỌC BẠ ĐÁNG SỢ (Gabriel)', V: 'V = π∫₁^∞ dx/x² = π (hữu hạn)', S: 'S = 2π∫₁^∞ dx/x = ∞' },
    { curve: 'y = x², 0 ≤ x ≤ a', note: 'paraboloid', V: 'V = πa⁵/5', S: 'S = (π/6a²)[(a²+4a⁴)^{3/2} − a³]' },
    { curve: 'y = sin x, 0 ≤ x ≤ π', note: 'nón cong', V: 'V = π∫₀^π sin²x dx = π²/2', S: 'S = 2π∫₀^π sin x·√(1+cos²x) dx' },
    { curve: 'elip x²/a² + y²/b² = 1', note: 'elipxôit tròn xoay', V: 'V = (4/3)πab²', S: 'S = 2πb² + 2πab·asin(e)/e' },
    { curve: 'y = √x, 0 ≤ x ≤ a', note: 'cái bát parabôn', V: 'V = πa²/2', S: 'S = (π/6)[(4a+1)^{3/2} − 1]' },
    { curve: 'y = eˣ, 0 ≤ x ≤ h', note: 'chuông mũ', V: 'V = π(e^{2h} − 1)/2', S: 'S = π∫₀^h eˣ√(1+e^{2x}) dx' },
    { curve: 'đường cong Bézier', note: 'chai/bình trong thực tế', V: 'V = π∫ y(t)²·x′(t) dt', S: 'S = 2π∫ y ds' },
    { curve: 'y = |sin x|, 0 ≤ x ≤ 2π', note: 'trục xoay cắt đường sinh', V: 'V = π∫₀^{2π} sin²x dx = π²', S: 'S = 2π∫|sin x|√(1+cos²x) dx' }
  ];
  const FRAC = [
    { name: 'Tập Cantor', N: 2, r: 1 / 3, D: Math.log(2) / Math.log(3), rule: 'bỏ khoảng giữa ⅓ rồi lặp lại trên hai đoạn còn lại', measure: 'độ đo → 0 nhưng vẫn còn vô hạn phần tử' },
    { name: 'Bông tuyết Koch', N: 4, r: 1 / 3, D: Math.log(4) / Math.log(3), rule: 'thay ⅓ ở giữa đoạn bằng hai cạnh tam giác đều', measure: 'chu vi → ∞, diện tích hữu hạn = 8/5·S₀' },
    { name: 'Tam giác Sierpinski', N: 3, r: 1 / 2, D: Math.log(3) / Math.log(2), rule: 'xoá tam giác trung tâm, giữ ba tam giác con', measure: 'diện tích còn lại = (3/4)ⁿ·S₀ → 0' },
    { name: 'Thảm Sierpinski', N: 8, r: 1 / 3, D: Math.log(8) / Math.log(3), rule: 'chia lưới 3×3 rồi xoá ô ở giữa', measure: 'chu vi → ∞, diện tích → 0' },
    { name: 'Tập Mandelbrot', N: 2, r: 1 / 2, D: 2, rule: 'z_{n+1} = z_n² + c, xét tính bị chặn của dãy', measure: ' biên có kích thước Hausdorff = 2' },
    { name: 'Đường Levy C', N: 2, r: 1 / Math.SQRT2, D: 2, rule: 'thay đoạn bằng hai cạnh tam giác vuông cân', measure: 'chu vi nhân √2 mỗi bước, lấp đầy mặt phẳng' },
    { name: 'Miếng bọt biển Menger', N: 20, r: 1 / 3, D: Math.log(20) / Math.log(3), rule: 'khối 3×3×3 bỏ ô tâm và tâm các mặt', measure: 'thể tích → 0, diện tích → ∞' },
    { name: 'Cây phân nhánh', N: 2, r: 0.66, D: Math.log(2) / Math.log(1 / 0.66), rule: 'mỗi cành mọc hai cành con ngắn hơn', measure: 'tổng chiều dài = L·Σ(2r)ⁿ' },
    { name: 'Đường rồng (dragon)', N: 2, r: 1 / Math.SQRT2, D: 2, rule: 'gấp đôi dãy đoạn bằng phép quay 45°', measure: 'số đoạn = 2ⁿ' },
    { name: 'Đường Hilbert', N: 4, r: 1 / 2, D: 2, rule: 'nối liên tục bốn ô con', measure: 'đường cong lấp đầy hình vuông' }
  ];

  /* ============================================================
   * 2) NET — khai triển (2D) + bản mỏng 3D để xem trong viewer
   * ============================================================ */
  function regPolyPts(cx, cy, n, R, dir) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = -PI / 2 + i * TAU / n; pts.push([cx + Math.cos(a) * R, cy + dir * Math.sin(a) * R]); }
    return pts;
  }
  function circlePts(cx, cy, r, N) {
    const pts = [];
    for (let i = 0; i < N; i++) { const a = i * TAU / N; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  function net(model) {
    const p = model.params || {}, u = unitOf(model);
    if (model.kind === 'prism') {
      const n = Math.max(3, p.sides || 4), R = p.radius || 1, h = p.height || 2, a = sideFromR(n, R);
      const faces = [], folds = [];
      for (let i = 0; i < n; i++) {
        const x = i * a;
        faces.push({ pts: [[x, 0], [x + a, 0], [x + a, h], [x, h]], kind: 'lateral', label: `mặt bên ${i + 1}` });
        if (i) folds.push([[x, 0], [x, h]]);
      }
      const Rp = a / (2 * Math.sin(PI / n));
      faces.push({ pts: regPolyPts(a / 2, -Rp * 1.25, n, Rp, -1), kind: 'base', label: 'đáy 1' });
      faces.push({ pts: regPolyPts(a / 2 + n * a, -Rp * 1.25, n, Rp, -1), kind: 'base', label: 'đáy 2' });
      return { faces, folds, title: `Khai triển lăng trụ đều ${n} cạnh`,
        note: `S_xq = ${n} chữ nhật = ${fmt(polyPerim(n, R) * h)} ${u}² · S_tp = S_xq + 2B = ${fmt(polyPerim(n, R) * h + 2 * polyArea(n, R))} ${u}²` };
    }
    if (model.kind === 'pyramid') {
      const n = Math.max(3, p.sides || 4), R = p.radius || 1, h = p.height || 1.6;
      const ap = apothem(n, R), l = Math.hypot(h, ap), a = sideFromR(n, R);
      const base = regPolyPts(0, 0, n, R, 1), faces = [{ pts: base, kind: 'base', label: `đáy ${n} cạnh` }], folds = [];
      for (let i = 0; i < n; i++) {
        const A = base[i], B = base[(i + 1) % n];
        const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, LL = Math.hypot(mx, my) || 1;
        faces.push({ pts: [A, B, [mx + mx / LL * l, my + my / LL * l]], kind: 'lateral', label: 'mặt bên' });
        folds.push([A, B]);
      }
      return { faces, folds, title: `Khai triển chóp đều ${n} cạnh`,
        note: `S_xq = ${n} × (½·a·l) = ${fmt(0.5 * polyPerim(n, R) * l)} ${u}² — mỗi mặt bên là tam giác cân đáy ${fmt(a)}, cao ${fmt(l)}` };
    }
    if (model.kind === 'cylinder') {
      const r = p.r || 1, h = p.h || 2;
      return { faces: [
        { pts: [[-PI * r, -h / 2], [PI * r, -h / 2], [PI * r, h / 2], [-PI * r, h / 2]], kind: 'lateral', label: 'mặt xung quanh' },
        { pts: circlePts(-PI * r * 0.6, -h / 2 - r * 1.4, r, 48), kind: 'base', label: 'đáy 1' },
        { pts: circlePts(PI * r * 0.6, -h / 2 - r * 1.4, r, 48), kind: 'base', label: 'đáy 2' }],
        folds: [[[-PI * r, -h / 2], [PI * r, -h / 2]], [[-PI * r, h / 2], [PI * r, h / 2]]],
        title: 'Khai triển hình trụ',
        note: `chữ nhật có ngang = chu vi đáy ${fmt(TAU * r)} ${u}, dọc = h; S_tp = 2πR(h+R) = ${fmt(TAU * r * (h + r))} ${u}²` };
    }
    if (model.kind === 'cone') {
      const r = p.r || 1, h = p.h || 2, l = Math.hypot(r, h), theta = TAU * r / l;
      const pts = [[0, 0]];
      for (let i = 0; i <= 64; i++) { const a = -theta / 2 + theta * i / 64 - PI / 2; pts.push([Math.cos(a) * l, Math.sin(a) * l + l * 0.2]); }
      return { faces: [{ pts, kind: 'lateral', label: `quạt θ = ${fmt(theta * 180 / PI, 1)}°` },
                       { pts: circlePts(0, -l * 0.55, r, 48), kind: 'base', label: 'đáy tròn' }],
        folds: [], title: 'Khai triển hình nón',
        note: `S_xq = πRl = ${fmt(PI * r * l)} ${u}² — cung của hình quạt đúng bằng chu vi đáy 2πR` };
    }
    if (model.kind === 'sphere') {
      const r = p.r || 1, G = 8, faces = [];
      for (let i = 0; i < G; i++) {
        const pts = [], w = r * Math.sin(PI / G) * 0.95;
        for (let k = 0; k <= 20; k++) { const t = -PI / 2 + PI * k / 20; pts.push([Math.sin(t) * w, Math.cos(t) * r * 1.02]); }
        for (let k = 20; k >= 0; k--) { const t = -PI / 2 + PI * k / 20; pts.push([Math.sin(t) * w + w * 2, Math.cos(t) * r * 1.02]); }
        faces.push({ pts, kind: 'lateral', label: i === 0 ? 'miếng cau' : '' });
      }
      return { faces, folds: [], title: 'GẦN ĐÚNG khai triển mặt cầu',
        note: 'Mặt cầu KHÔNG thể trải phẳng chính xác (định lý Theorema Egregium của Gauss) → mọi bản đồ đều có sai số. S = 4πR² = ' + fmt(4 * PI * sq(r)) + ' ' + u + '²' };
    }
    if (model.kind === 'platonic') {
      const ty = p.type | 0, s = 1, hh = Math.sqrt(3) / 2;
      if (ty === 0) {
        const A = [0, 0], B = [s, 0], C = [s / 2, hh];
        return { faces: [{ pts: [A, B, C], kind: 'lateral', label: 'mặt 1' }, { pts: [A, B, [s / 2, -hh]], kind: 'lateral', label: 'mặt 2' },
                         { pts: [B, C, [s * 1.5, hh / 2]], kind: 'lateral', label: 'mặt 3' }, { pts: [C, A, [-s * 0.5, hh / 2]], kind: 'lateral', label: 'mặt 4' }],
          folds: [[A, B], [B, C], [C, A]], title: 'Khai triển tứ diện đều (4 tam giác đều)', note: 'S_tp = √3·a² — gấp theo ba nếp' };
      }
      if (ty === 1) {
        const q = (x, y, t) => ({ pts: [[x, y], [x + s, y], [x + s, y + s], [x, y + s]], kind: 'lateral', label: t });
        return { faces: [q(s, 0, 'đáy'), q(s, s, 'mặt 2'), q(s, 2 * s, 'mặt 3'), q(0, s, 'mặt 4'), q(2 * s, s, 'mặt 5'), q(s, 3 * s, 'nắp')],
          folds: [[[s, s], [2 * s, s]], [[s, 2 * s], [2 * s, 2 * s]], [[s, 3 * s], [2 * s, 3 * s]], [[s, s], [s, 2 * s]], [[2 * s, s], [2 * s, 2 * s]]],
          title: 'Khai triển hình lập phương (dạng thập tự)', note: 'S_tp = 6a² — hình lập phương có 11 khai triển khác nhau' };
      }
      if (ty === 2) {
        const f = [];
        for (let i = 0; i < 4; i++) { const x = i * s;
          f.push({ pts: [[x, 0], [x + s, 0], [x + s / 2, hh]], kind: 'lateral', label: '' });
          f.push({ pts: [[x + s, 0], [x + s / 2, hh], [x + s * 1.5, hh]], kind: 'lateral', label: '' }); }
        return { faces: f, folds: [], title: 'Khai triển bát diện đều (8 tam giác đều)', note: 'S_tp = 2√3·a²' };
      }
      const nF = ty === 3 ? 12 : 20, sides = ty === 3 ? 5 : 3, f = [];
      for (let i = 0; i < nF; i++) f.push({ pts: regPolyPts((i % 5) * 2.4, Math.floor(i / 5) * 2.4, sides, 1, 1), kind: 'lateral', label: '' });
      return { faces: f, folds: [], title: `${nF} mặt ${sides === 5 ? 'ngũ giác' : 'tam giác'} đều (xếp lưới minh hoạ)`,
        note: (ty === 3 ? 'Thập nhị diện' : 'Ngũ thập nhị diện') + ': S_tp = √(25+10√5)·a²' };
    }
    if (model.kind === 'rect') {
      const ratio = p.ratio || 1, sc = p.scale || 1.4;
      const w = ratio >= 1 ? sc : sc * ratio, hh = ratio >= 1 ? sc / ratio : sc;
      return { faces: [{ pts: [[0, 0], [w, 0], [w, hh], [0, hh]], kind: 'base', label: `${fmt(w)} × ${fmt(hh)}` }], folds: [],
        title: 'Hình chữ nhật (hình phẳng 2D)', note: `P = ${fmt(2 * (w + hh))} ${u}; S = ${fmt(w * hh)} ${u}²; d = ${fmt(Math.hypot(w, hh))} ${u}` };
    }
    if (model.kind === 'polygon') {
      const n = Math.max(3, p.sides || 5), R = p.radius || 1;
      return { faces: [{ pts: regPolyPts(0, 0, n, R, 1), kind: 'base', label: `${n} cạnh đều` }], folds: [],
        title: `Đa giác đều ${n} cạnh`, note: `tổng góc trong ${(n - 2) * 180}°, mỗi góc ${(n - 2) * 180 / n}°, S = ${fmt(polyArea(n, R))} ${u}²` };
    }
    return null;
  }
  /* lưới 2D -> mảnh 3D mỏng (dùng cho nút "Khai triển" trong viewer) */
  function netToGeometry(netObj, thickness) {
    const g = { verts: [], tris: [], edges: [], rawLines: [], pts: [], faceColors: [] };
    if (!netObj || !netObj.faces) return g;
    const t = (thickness || 0.05) / 2;
    netObj.faces.forEach(f => {
      const top = f.pts.map(pt => { g.verts.push([pt[0], pt[1], t]); return g.verts.length - 1; });
      const bot = f.pts.map(pt => { g.verts.push([pt[0], pt[1], -t]); return g.verts.length - 1; });
      const colTop = f.kind === 'base' ? '#4a7fc1' : '#d9a05b';
      for (let i = 1; i < top.length - 1; i++) { g.tris.push([top[0], top[i], top[i + 1]]); g.faceColors.push(colTop); }
      for (let i = 1; i < bot.length - 1; i++) { g.tris.push([bot[0], bot[i + 1], bot[i]]); g.faceColors.push(colTop); }
      for (let i = 0; i < f.pts.length; i++) {
        const j = (i + 1) % f.pts.length;
        g.tris.push([top[i], top[j], bot[j]]); g.faceColors.push('#c9ccd6');
        g.tris.push([top[i], bot[j], bot[i]]); g.faceColors.push('#c9ccd6');
        g.edges.push([top[i], top[j]]);
      }
    });
    (netObj.folds || []).forEach(fl => g.rawLines.push([[fl[0][0], fl[0][1], t * 1.4], [fl[1][0], fl[1][1], t * 1.4]]));
    let cx = 0, cy = 0, n = 0;
    g.verts.forEach(v => { cx += v[0]; cy += v[1]; n++; });
    if (n) { cx /= n; cy /= n; g.verts.forEach(v => { v[0] -= cx; v[1] -= cy; }); }
    // store the unfolded net in a side pocket so the viewer can animate fold/unfold
    g._net = { faces: netObj.faces, folds: netObj.folds || [] };
    return g;
  }

  /* ---------- fold/unfold animation ----------
   * Returns a geometry builder for progress t in [0..1]:
   * t=0 → solid 3D model, t=1 → flat unfolded net laid on the z=0 plane.
   * The net lives in the XY plane while most solids stand on XZ — we rotate
   * the whole assembly by -90° about X during the transition so the paper
   * "stands up" into the solid naturally. */
  function folder(model) {
    const n = net(model);
    if (!n || !n.faces || !n.faces.length) return null;
    let baseGeo;
    try { baseGeo = CAT.buildGeometry(model); } catch (e) { return null; }
    const netGeo = netToGeometry(n, 0.05);
    if (!netGeo.tris.length) return null;
    // centre both around origin
    const centre = g => {
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, mnz = 1e9, mxz = -1e9;
      g.verts.forEach(v => { mnx = Math.min(mnx, v[0]); mxx = Math.max(mxx, v[0]); mny = Math.min(mny, v[1]); mxy = Math.max(mxy, v[1]); mnz = Math.min(mnz, v[2]); mxz = Math.max(mxz, v[2]); });
      const ox = (mnx + mxx) / 2, oy = (mny + mxy) / 2, oz = (mnz + mxz) / 2;
      g.verts.forEach(v => { v[0] -= ox; v[1] -= oy; v[2] -= oz; });
    };
    centre(baseGeo); centre(netGeo);
    // uniform scale so both representations occupy a similar footprint
    const extent = g => { let r = 0.5; g.verts.forEach(v => { r = Math.max(r, Math.hypot(v[0], v[1], v[2])); }); return r; };
    const sB = extent(baseGeo), sN = extent(netGeo), target = Math.max(sB, sN);
    const kB = target / sB, kN = target / sN;
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return {
      netInfo: n,
      build(t) {
        t = Math.max(0, Math.min(1, t || 0));
        const e = ease(t);
        const g = { verts: [], tris: [], edges: [], rawLines: [], pts: [], faceColors: [] };
        const pushShape = (src, k) => {
          const off = g.verts.length;
          src.verts.forEach(v => g.verts.push([v[0] * k, v[1] * k, v[2] * k]));
          src.tris.forEach(tr => g.tris.push([tr[0] + off, tr[1] + off, tr[2] + off]));
          if (src.faceColors) src.faceColors.forEach((c, i) => { if (i < src.tris.length) g.faceColors.push(c); });
          src.rawLines.forEach(ln => g.rawLines.push([[ln[0][0] * k, ln[0][1] * k, ln[0][2] * k], [ln[1][0] * k, ln[1][1] * k, ln[1][2] * k]]));
        };
        if (e < 0.999) pushShape(baseGeo, kB);
        if (e > 0.001) pushShape(netGeo, kN);
        // rotate everything about X by -90°·e : net (XY) rises into XZ as solid appears
        const a = -Math.PI / 2 * e, ca = Math.cos(a), sa = Math.sin(a);
        g.verts.forEach(v => { const y = v[1], z = v[2]; v[1] = y * ca - z * sa; v[2] = y * sa + z * ca; });
        g.rawLines.forEach(ln => ln.forEach(p => { const y = p[1], z = p[2]; p[1] = y * ca - z * sa; p[2] = y * sa + z * ca; }));
        // recompute normals per triangle from the transformed verts (flat shading)
        g.__recomputeNormals = true;
        return g;
      }
    };
  }

  /* ============================================================
   * 3) CROSS SECTIONS — mặt cắt (thuật toán lát cắt thật)
   * ============================================================ */
  function sectionAt(model, mode, k) {
    mode = mode || 'horizontal'; k = k === undefined ? 0 : k;
    let geo;
    try { geo = CAT.buildGeometry(model); } catch (e) { return { segs: [], loops: [], info: { shape: '—', lesson: '', area: '—' } }; }
    let maxR = 0.5;
    for (const v of geo.verts) maxR = Math.max(maxR, Math.hypot(v[0], v[1], v[2]));
    const d = k * maxR * 0.72;
    const nrm = mode === 'horizontal' ? [0, 1, 0] : mode === 'vertical' ? [0, 0, 1] : [0.72, 0.7, 0];
    const segs = [];
    for (const t of geo.tris) {
      const vs = [geo.verts[t[0]], geo.verts[t[1]], geo.verts[t[2]]];
      const ds = vs.map(v => v[0] * nrm[0] + v[1] * nrm[1] + v[2] * nrm[2] - d);
      const sg = ds.map(x => (x >= 0 ? 1 : 0));
      if (sg[0] === sg[1] && sg[1] === sg[2]) continue;
      const hit = [];
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        if (sg[i] !== sg[j]) {
          const tt = ds[i] / (ds[i] - ds[j]);
          hit.push([vs[i][0] + (vs[j][0] - vs[i][0]) * tt, vs[i][1] + (vs[j][1] - vs[i][1]) * tt, vs[i][2] + (vs[j][2] - vs[i][2]) * tt]);
        }
      }
      if (hit.length === 2) segs.push(hit);
    }
    const loops = chainSegs(segs);
    return { segs, loops, nrm, d, mode, k, info: describeSection(model, mode, d, loops) };
  }
  function chainSegs(segs) {
    const key = p => p.map(x => Math.round(x * 1000)).join(',');
    const adj = new Map();
    segs.forEach((s, i) => s.forEach(pt => { const k = key(pt); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); }));
    const used = new Set(), loops = [];
    for (let i = 0; i < segs.length; i++) {
      if (used.has(i)) continue;
      used.add(i);
      const loop = [segs[i]];
      let endKey = key(segs[i][1]);
      for (let guard = 0; guard < 800; guard++) {
        const nxt = (adj.get(endKey) || []).find(j => !used.has(j));
        if (nxt === undefined) break;
        used.add(nxt);
        const s = segs[nxt];
        const pts = key(s[0]) !== endKey ? [s[1], s[0]] : s;
        loop.push(pts); endKey = key(pts[1]);
        if (endKey === key(loop[0][0])) break;
      }
      loops.push(loop);
    }
    return loops;
  }
  function polyArea3(loop) {
    const pts = [];
    loop.forEach(s => pts.push(s[0]));
    if (pts.length < 3) return 0;
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      nx += a[1] * b[2] - b[1] * a[2]; ny += a[2] * b[0] - b[2] * a[0]; nz += a[0] * b[1] - b[0] * a[1];
    }
    return 0.5 * Math.hypot(nx, ny, nz);
  }
  function describeSection(model, mode, d, loops) {
    const p = model.params || {}, u = unitOf(model);
    const nl = loops.length, total = loops.reduce((s, L) => s + L.length, 0);
    const roundish = model.kind === 'cylinder' || model.kind === 'cone' || model.kind === 'sphere' || model.kind === 'torus' || model.kind === 'revolution';
    let shape = nl === 0 ? 'mặt phẳng không cắt khối'
      : nl > 1 ? `${nl} đường bao kín`
      : roundish && total > 8 ? 'ĐƯỜNG TRÒN / ELIP'
      : total <= 3 ? 'TAM GIÁC' : total <= 4 ? 'TỨ GIÁC' : `ĐA GIÁC ${total} CẠNH`;
    const area = loops[0] ? polyArea3(loops[0]) : 0;
    let lesson = '';
    if (model.kind === 'cone') lesson = mode === 'horizontal' ? 'Cắt song song đáy cho đường tròn. Nghiêng dần mặt phẳng cắt: elip → parabol → hyperbol. Đó chính là CONIC SECTION.'
      : mode === 'vertical' ? 'Cắt qua trục cho tam giác cân gồm hai đường sinh.' : 'Cắt nghiêng (kín) cho ELIP — quỹ đạo hành tinh trong định luật Kepler.';
    else if (model.kind === 'cylinder') lesson = mode === 'horizontal' ? 'Mọi lát cắt ngang là đường tròn bằng nhau → hình trụ đều (nguyên lý Cavalieri).'
      : mode === 'vertical' ? 'Cắt dọc trục cho hình chữ nhật có một cạnh bằng đường kính, cạnh kia bằng h.' : 'Cắt nghiêng cho elip.';
    else if (model.kind === 'sphere') lesson = 'Mặt phẳng cắt mặt cầu LUÔN cho một đường tròn — tính chất đặc trưng để nhận biết mặt cầu.';
    else if (model.kind === 'prism') lesson = mode === 'horizontal' ? `Thiết diện song song với đáy là đa giác đều ${Math.max(3, p.sides || 4)} cạnh, diện tích đúng bằng đáy.`
      : 'Thiết diện qua trục là hình chữ nhật a × h.';
    else if (model.kind === 'pyramid') lesson = mode === 'horizontal' ? 'Thiết diện song song đáy ĐỒNG DẠNG với đáy; tỉ lệ k thì diện tích là k² — nền tảng của chóp cụt.'
      : 'Thiết diện chứa hai cạnh bên đối diện là tam giác cân.';
    else if (model.kind === 'torus') lesson = 'Torus cho thiết diện bất ngờ: một vòng, hai vòng hoặc “đôi mắt” — trực giác về mặt cắt cần được kiểm chứng.';
    else if (model.kind === 'platonic') lesson = 'Cắt khối đa diện luôn cho một đa giác; số cạnh của thiết diện không vượt quá số mặt mà mặt phẳng cắt đi qua.';
    return { shape, loops: nl, sides: total, area: area ? fmt(area, 2) + ' ' + u + '²' : '—', lesson, offset: fmt(d, 2) + ' ' + u };
  }

  /* ============================================================
   * 4) PARTS — tháo rời / lắp ráp: trực quan hoá công thức
   * ============================================================ */
  function parts(model) {
    const p = model.params || {}, u = unitOf(model);
    const mk = (name, sub, note, color) => ({ name, sub, note, color });
    if (model.kind === 'prism') {
      const n = Math.max(3, p.sides || 4), R = p.radius || 1, h = p.height || 2;
      return { list: [
        mk('2 đáy (đa giác đều)', { kind: 'polygon', params: { sides: n, radius: R }, category: model.category, name: 'Đáy lăng trụ', nameEn: 'Base', level: model.level, desc: 'Một đáy của lăng trụ đều.', id: model.id + '-day' }, `Mỗi đáy B = ${fmt(polyArea(n, R))} ${u}² ⇒ hai đáy = ${fmt(2 * polyArea(n, R))} ${u}²`, '#4a7fc1'),
        mk(`${n} mặt bên (chữ nhật)`, { kind: 'rect', params: { ratio: sideFromR(n, R) / h, scale: Math.max(sideFromR(n, R), h) }, category: model.category, name: 'Mặt bên', nameEn: 'Lateral face', level: model.level, desc: 'Một mặt bên của lăng trụ.', id: model.id + '-ben' }, `Mỗi mặt ${fmt(sideFromR(n, R))} × ${fmt(h)} ${u} ⇒ S_xq = ${fmt(polyPerim(n, R) * h)} ${u}²`, '#d9a05b'),
        mk('Toàn bộ lăng trụ', model, `S_tp = ${fmt(polyPerim(n, R) * h + 2 * polyArea(n, R))} ${u}²; V = ${fmt(polyArea(n, R) * h)} ${u}³`, '#3f9e7a')
      ], note: 'Dải chữ nhật cuộn lại thành mặt xung quanh, ghép hai đáy ta được lăng trụ — đây là cách sách giáo khoa dẫn ra công thức S_xq.' };
    }
    if (model.kind === 'pyramid') {
      const n = Math.max(3, p.sides || 4), R = p.radius || 1, h = p.height || 1.6, l = Math.hypot(h, apothem(n, R));
      return { list: [
        mk('1 đáy', { kind: 'polygon', params: { sides: n, radius: R }, category: model.category, name: 'Đáy chóp', nameEn: 'Base', level: model.level, desc: 'Đáy của hình chóp đều.', id: model.id + '-day' }, `B = ${fmt(polyArea(n, R))} ${u}²`, '#4a7fc1'),
        mk(`${n} mặt bên (tam giác cân)`, { kind: 'triangle', params: { type: 1, scale: sideFromR(n, R) }, category: model.category, name: 'Mặt bên chóp', nameEn: 'Lateral face', level: model.level, desc: 'Một mặt bên của chóp đều.', id: model.id + '-ben' }, `chiều cao tam giác = đường nghiêng l = ${fmt(l)} ${u} ⇒ S_xq = ${fmt(0.5 * polyPerim(n, R) * l)} ${u}²`, '#d9a05b'),
        mk('Hình chóp hoàn chỉnh', model, `V = ⅓B·h = ${fmt(polyArea(n, R) * h / 3)} ${u}³`, '#3f9e7a')
      ], note: 'Thí nghiệm kinh điển: đổ đầy nước vào chóp, cần đúng 3 lần để đầy lăng trụ cùng đáy và chiều cao ⇒ V = ⅓Bh.' };
    }
    if (model.kind === 'cylinder') {
      const r = p.r || 1, h = p.h || 2;
      return { list: [
        mk('2 đáy tròn', { kind: 'circlePart', params: { r }, category: model.category, name: 'Đáy trụ', nameEn: 'Disk', level: model.level, desc: 'Đáy hình trụ.', id: model.id + '-day' }, `hai đáy = 2πR² = ${fmt(2 * PI * sq(r))} ${u}²`, '#4a7fc1'),
        mk('Mặt xung quanh (chữ nhật cuộn)', { kind: 'rect', params: { ratio: TAU * r / h, scale: Math.max(TAU * r, h) }, category: model.category, name: 'Khai triển mặt trụ', nameEn: 'Cylinder band', level: model.level, desc: 'Mặt xung quanh展開 thành chữ nhật.', id: model.id + '-xq' }, `ngang = chu vi đáy ${fmt(TAU * r)} ${u}, dọc = h ⇒ S_xq = ${fmt(TAU * r * h)} ${u}²`, '#d9a05b'),
        mk('Hình trụ', model, `V = πR²h = ${fmt(PI * sq(r) * h)} ${u}³`, '#3f9e7a')
      ], note: 'Cắt dọc mặt trụ theo một đường sinh rồi trải ra được hình chữ nhật — nguồn gốc mọi công thức diện tích xung quanh.' };
    }
    if (model.kind === 'cone') {
      const r = p.r || 1, h = p.h || 2, l = Math.hypot(r, h);
      return { list: [
        mk('Đáy tròn', { kind: 'circlePart', params: { r }, category: model.category, name: 'Đáy nón', nameEn: 'Disk', level: model.level, desc: 'Đáy hình nón.', id: model.id + '-day' }, `B = πR² = ${fmt(PI * sq(r))} ${u}²`, '#4a7fc1'),
        mk('Mặt xung quanh (hình quạt)', { kind: 'fractionpie', params: { num: 1, den: Math.max(2, Math.round(l / r)), size: l }, category: model.category, name: 'Quạt khai triển nón', nameEn: 'Sector', level: model.level, desc: 'Khai triển mặt xung quanh của nón.', id: model.id + '-xq' }, `bán kính quạt = l = ${fmt(l)} ${u}, θ = ${fmt(TAU * r / l * 180 / PI, 1)}° ⇒ S_xq = ${fmt(PI * r * l)} ${u}²`, '#d9a05b'),
        mk('Hình nón', model, `V = ⅓πR²h = ${fmt(PI * sq(r) * h / 3)} ${u}³`, '#3f9e7a')
      ], note: 'Cung của hình quạt đúng bằng chu vi đáy — nhờ đó suy ra S_xq = πRl.' };
    }
    if (model.kind === 'sphere') {
      const r = p.r || 1;
      return { list: [
        mk('Bốn “múi cau” ghép gần đúng', { kind: 'fractionpie', params: { num: 4, den: 4, size: r }, category: model.category, name: 'Bốn hình tròn lớn', nameEn: 'Four disks', level: model.level, desc: 'Bốn hình tròn lớn bằng diện tích mặt cầu.', id: model.id + '-4' }, `S = 4πR² = ${fmt(4 * PI * sq(r))} ${u}² — đúng 4 lần diện tích hình tròn lớn`, '#4a7fc1'),
        mk('Nửa mặt cầu', { kind: 'hemisphere', params: { r }, category: model.category, name: 'Nửa mặt cầu', nameEn: 'Hemisphere', level: model.level, desc: 'Nửa mặt cầu.', id: model.id + '-half' }, `S nửa = 2πR² = ${fmt(2 * PI * sq(r))} ${u}²`, '#d9a05b'),
        mk('Quả cầu đặc', model, `V = (4/3)πR³ = ${fmt(4 / 3 * PI * Math.pow(r, 3))} ${u}³`, '#3f9e7a')
      ], note: 'Archimedes: diện tích mặt cầu bằng diện tích xung quanh của trụ bao ngoài (2πR·2R) — vì thế “trải” mặt cầu thành 4 hình tròn.' };
    }
    return null;
  }

  /* ============================================================
   * 5) QUIZ — câu hỏi trắc nghiệm tự sinh từ thông số mô hình
   * ============================================================ */
  function quiz(model, n) {
    n = n || 4;
    const M = metrics(model), Q = [], seen = {};
    const numOf = row => { const v = parseFloat(String(row.value).replace(/[^\d.\-]/g, '')); return isFinite(v) ? v : null; };
    const shuffle = arr => { const r = arr.slice(), rng = rngFrom(hashStr(JSON.stringify(arr) + model.id));
      for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; } return r; };
    const wrongOptions = (correct, key) => {
      const rng = rngFrom(hashStr(key + model.id)), out = [];
      const FACT = [1.5, 0.5, 2, 0.25, 3, 1 / 3, 1.25, 0.75];
      let guard = 0;
      while (out.length < 3 && guard++ < 80) {
        const v = correct * FACT[Math.floor(rng() * FACT.length)];
        const s = fmt(v, 3);
        if (v > 0 && s !== fmt(correct, 3) && out.indexOf(s) < 0) out.push(s);
      }
      let add = 1;
      while (out.length < 3) { out.push(fmt(correct + add++, 3)); }
      return out;
    };
    const addNum = row => {
      if (!row || seen[row.label]) return;
      const c = numOf(row); if (c === null || !(c > 0)) return;
      seen[row.label] = 1;
      const opts = shuffle([fmt(c, 3)].concat(wrongOptions(c, row.label)));
      Q.push({ q: `${model.name}: ${row.label.toLowerCase()} bằng bao nhiêu${row.unit ? ' (' + row.unit + ')' : ''}?`,
               options: opts, answer: fmt(c, 3), explain: row.formula ? `Áp dụng: ${row.formula}.` : '' });
    };
    const PRI = ['thể tích', 'diện tích toàn phần', 'diện tích xung quanh', 'diện tích s', 'chu vi', 'đường chéo', 'đường sinh', 'xác suất', 'trung bình', 'phần trăm'];
    PRI.forEach(k => { if (Q.length < n) addNum(M.find(r => r.label.toLowerCase().indexOf(k) >= 0)); });
    for (const r of M) { if (Q.length >= n) break; if (/^[\d.,]+$/.test(String(r.value))) addNum(r); }
    const fRows = M.filter(r => r.formula && r.formula.indexOf('=') >= 0 && /[²³√π]/.test(r.formula)).slice(0, 2);
    fRows.forEach(r => {
      const pool = ['V = B·h', 'V = ⅓·B·h', 'S_xq = 2πR·h', 'S_xq = πR·l', 'V = πR²h', 'V = (4/3)πR³', 'S = 4πR²', 'P = 2(a + b)', 'S = a·b', 'S = ½(a + b)·h', 'S = ½·d₁·d₂', 'V = a³', 'S_tp = 6a²', 'S_xq = C·h'];
      const bad = pool.filter(x => x !== r.formula).slice(0, 3);
      Q.push({ q: `Công thức đúng cho “${r.label}” là?`, options: shuffle([r.formula].concat(bad)), answer: r.formula,
               explain: `Với mô hình này: ${r.label} = ${r.value}${r.unit}.` });
    });
    if (!Q.length) Q.push({ q: `Em hãy nêu hai đặc điểm của ${model.name}.`, options: ['Xem mục Công thức để đối chiếu', 'Không xác định'], answer: 'Xem mục Công thức để đối chiếu', explain: model.desc });
    return Q.slice(0, n + 2);
  }

  /* ============================================================
   * 6) LESSON PLAN — giáo án theo định hướng phát triển năng lực
   * ============================================================ */
  const STD = {
    'Khối đa diện': { pri: ['Nhận biết khối qua vật thật (hộp quà, viên xúc xắc)', 'Đếm số mặt – cạnh – đỉnh ngay trên mô hình', 'Cắt giấy theo khai triển rồi gấp thành hình'], sec: ['Lập công thức S_xq, S_tp, V rồi thay số', 'Xác định thiết diện bởi mặt phẳng song song đáy / qua trục', 'Bài toán thực tế: sơn thùng, làm hộp giấy, tính vật liệu'] },
    'Mặt tròn xoay': { pri: ['Nhận biết trụ – nón – cầu qua đồ dùng (lon sữa, nón lá, quả bóng)', 'Quan sát hình tạo thành khi quay một mặt phẳng', 'Ôn chu vi và diện tích hình tròn'], sec: ['Suy ra S_xq từ khai triển; tính V bằng công thức', 'Khám phá conic sections qua mặt cắt hình nón', 'Bài toán dung tích, vật liệu, chi phí sản xuất'] },
    'Hình phẳng': { pri: ['Phân loại hình theo cạnh và góc', 'Đếm ô vuông để đo diện tích, đo chu vi bằng dây', 'Cắt – ghép hình để phát hiện công thức'], sec: ['Chứng minh tính chất đường chéo, góc', 'Vận dụng Pythagoras và hệ thức lượng', 'Tính diện tích hình tổ hợp'] },
    'Số học': { pri: ['Cấu tạo số, giá trị theo hàng', 'So sánh và làm tròn số', 'Ôn bảng cửu chương bằng mô hình trực quan'], sec: ['Ước – bội, dấu hiệu chia hết', 'Căn thức và luỹ thừa'] },
    'Hàm số': { pri: ['Đại lượng tỉ lệ thuận / tỉ lệ nghịch', 'Đọc giá trị trên đồ thị đơn giản'], sec: ['Tìm tập xác định, GTLN – GTNN', 'Đạo hàm và tiếp tuyến', 'Bài toán tối ưu trong thực tế'] },
    'Giải tích': { pri: [], sec: ['Giới hạn và tính liên tục', 'Đạo hàm riêng, gradient', 'Tích phân và thể tích khối tròn xoay'] },
    'Hàm lượng giác': { pri: ['Nhận biết góc nhọn – vuông – tù', 'Đo góc bằng thước đo độ'], sec: ['Đường tròn lượng giác', 'Tuần hoàn, biên độ, chu kỳ của đồ thị', 'Phương trình lượng giác cơ bản'] },
    'Thống kê': { pri: ['Đọc biểu đồ cột, biểu đồ tranh', 'Thu thập số liệu từ chính lớp mình'], sec: ['Số trung bình, trung vị, mốt, khoảng biến thiên', 'Độ lệch chuẩn và so sánh hai dãy số liệu', 'Vẽ biểu đồ tần số'] },
    'Xác suất': { pri: ['Khả năng xảy ra của sự kiện', 'Gieo xúc xắc, rút thẻ và ghi lại kết quả'], sec: ['Không gian mẫu và biến cố', 'Biến cố đối, quy tắc cộng', 'Xác suất có điều kiện, tính độc lập'] },
    'Fractal': { pri: ['Vẽ tam giác Sierpinski bằng cách tô ô', 'Gấp bông tuyết Koch trên giấy'], sec: ['Dãy truy hồi và giới hạn', 'Kích thước Hausdorff, tính tự đồng dạng'] },
    'Vectơ': { pri: [], sec: ['Quy tắc tam giác, quy tắc hình bình hành', 'Tích vô hướng và hình chiếu', 'Toạ độ vectơ trong không gian Oxyz'] },
    'Hình học biến đổi': { pri: ['Gấp giấy tạo hình đối xứng', 'Tịnh tiến hình trên lưới ô vuông'], sec: ['Viết toạ độ của ảnh', 'Phép vị tự và sự đồng dạng'] },
    'Ứng dụng thực tế': { pri: ['Đo đạc các vật quanh em', 'Tìm hình dạng quen thuộc trong đời sống'], sec: ['Mô hình hoá bằng hàm số', 'Tối ưu diện tích – chi phí'] },
    'Nâng cao': { pri: [], sec: ['Đọc cấu trúc của mặt / trường dữ liệu', 'Liên hệ với vật lý, kinh tế, đồ hoạ máy tính'] },
    'Công nghệ 3D': { pri: ['Làm quen thao tác xoay – zoom mô hình 3D'], sec: ['Lưới tam giác, phối cảnh, ánh sáng'] }
  };
  function lessonPlan(model) {
    const s = STD[model.category] || { pri: [], sec: [] };
    const steps = model.level === 'Tiểu học' ? s.pri : s.sec;
    const M = metrics(model);
    const formulas = M.filter(r => r.formula && r.formula.indexOf('=') >= 0).slice(0, 2).map(r => r.formula);
    return {
      level: model.level,
      duration: model.level === 'Tiểu học' ? '35 phút' : '45 phút',
      objectives: [
        `Mô tả và nhận biết được ${model.name.toLowerCase()}${model.nameEn ? ' (' + model.nameEn + ')' : ''}.`,
        formulas.length ? `Vận dụng được công thức: ${formulas.join(' ; ')}.` : `Phát biểu được tính chất đặc trưng của chủ đề ${model.category.toLowerCase()}.`,
        'Đặt được ít nhất một liên hệ với thực tế và giải thích bằng ngôn ngữ hình học.'
      ],
      activities: [
        { name: '① Khởi động (5′)', content: 'Chiếu mô hình 3D, cho HS xoay bằng chuột: “Hình này giống đồ vật nào em đã gặp?”' },
        { name: '② Hình thành kiến thức (12′)', content: (steps.length ? steps.slice(0, 2).join(' → ') : 'Chỉ ra các yếu tố cơ bản ngay trên mô hình') + '. GV mở bảng Công thức để HS tự đọc số đo.' },
        { name: '③ Luyện tập (15′)', content: 'HS bật “Khai triển” để cắt – gấp giấy; bật “Mặt cắt” để DỰ ĐOÁN thiết diện trước khi kéo thanh trượt, sau đó kiểm chứng.' },
        { name: '④ Vận dụng – tìm tòi (8′)', content: 'Làm Quick Quiz (sinh từ chính thông số mô hình); nộp phiếu bài tập in từ nút “In phiếu”.' }
      ],
      boardSummary: M.slice(0, 5).map(r => `${r.label}: ${r.value}${r.unit}${r.formula ? ' — ' + r.formula : ''}`),
      differentiation: model.level === 'Tiểu học'
        ? 'HS cần hỗ trợ: đếm mặt/cạnh/đỉnh trực tiếp trên mô hình. HS hoàn thành sớm: đo chu vi bằng sợi dây rồi đối chiếu công thức.'
        : 'HS cần hỗ trợ: thay số vào công thức đã cho. HS hoàn thành sớm: tự đặt bài toán ngược (cho V, tìm h) và lời giải.',
      homework: `Với ${model.name.toLowerCase()}: đổi một thông số (ví dụ gấp đôi cạnh/bán kính), dự đoán thể tích thay đổi bao nhiêu lần, rồi kiểm chứng bằng mô hình và công thức.`
    };
  }

  /* ============================================================
   * 7) TEACH MODE — trình chiếu từng bước cho giáo viên
   * ============================================================ */
  function teachSteps(model) {
    const M = metrics(model), nt = net(model), pr = parts(model);
    const sc = sectionAt(model, 'horizontal', 0);
    const S = [];
    S.push({ title: '① Giới thiệu mô hình', body: `${model.name}${model.nameEn ? ' (' + model.nameEn + ')' : ''}\nCấp học: ${model.level} · Chủ đề: ${model.category}\n${model.desc}` });
    if (M.length) S.push({ title: '② Các yếu tố & công thức', body: M.slice(0, 7).map(r => `• ${r.label}: ${r.value}${r.unit}${r.formula ? '  —  ' + r.formula : ''}`).join('\n') });
    if (nt) S.push({ title: '③ Khai triển (mở hình ra)', body: `${nt.title}\n${nt.note || ''}\n→ Hoạt động: HS đếm số đa giác, dự đoán diện tích trước khi gấp lại thành hình 3D.` });
    if (pr) S.push({ title: '④ Tháo rời từng phần', body: pr.list.map(x => `• ${x.name}: ${x.note}`).join('\n') + '\n\n' + pr.note });
    if (sc.info.shape !== 'mặt phẳng không cắt khối') S.push({ title: '⑤ Mặt cắt', body: `Thiết diện: ${sc.info.shape} · diện tích ≈ ${sc.info.area}\n${sc.info.lesson}` });
    S.push({ title: '⑥ Kiểm tra nhanh', body: quiz(model, 3).map((q, i) => `${i + 1}. ${q.q}\n    Đáp án: ${q.answer}`).join('\n') });
    S.push({ title: '⑦ Giao việc về nhà', body: lessonPlan(model).homework });
    return S;
  }

  /* ============================================================
   * 8) WORKSHEET — phiếu bài tập in ra giấy (HTML tự chứa)
   * ============================================================ */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function worksheetHTML(models, title) {
    const cards = models.map(m => {
      const M = metrics(m);
      const key = M.slice(0, 4).map(r => `<div class="f"><b>${esc(r.label)}</b><span>${esc(r.value)} ${esc(r.unit)}</span><i>${esc(r.formula)}</i></div>`).join('');
      const qs = quiz(m, 3).map((q, i) => `<div class="qq"><p>${i + 1}. ${esc(q.q)}</p><div class="opts">${q.options.map(o => `<label><input type="checkbox">${esc(o)}</label>`).join('')}</div></div>`).join('');
      let thumb = '';
      try { if (CAT.buildPreviewCanvas) thumb = `<img src="${CAT.buildPreviewCanvas(m, 110).toDataURL()}" alt="">`; } catch (e) { thumb = ''; }
      return `<section class="card"><h3>${esc(m.name)} <small>#${m.id} · ${esc(m.level)} · ${esc(m.category)}</small></h3>
        <div class="head">${thumb}<div class="nets">${key}</div></div>
        <div class="qs">${qs}</div>
        <div class="fill"><p>Vẽ khai triển của hình này vào ô dưới:</p><div class="box"></div></div></section>`;
    }).join('\n');
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title || 'Phiếu bài tập Toán')}</title>
<style>*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#111;margin:18px;background:#fff}
h1{font-size:19px;border-bottom:3px solid #111;padding-bottom:6px}h1 small{font-weight:400;font-size:12px;color:#555}
.card{border:1.5px solid #111;border-radius:8px;padding:12px;margin:12px 0;break-inside:avoid}
.card h3{margin:0 0 8px;font-size:15px}.card h3 small{font-weight:400;color:#555;font-size:11px}
.head{display:flex;gap:10px;align-items:flex-start}.head img{width:92px;height:92px;border-radius:8px;border:1px solid #ccc}
.nets{display:flex;flex-wrap:wrap;gap:8px}.f{border:1px dashed #888;padding:4px 8px;border-radius:6px;font-size:11px;min-width:118px}
.f b{display:block}.f span{display:block;font-size:15px;font-weight:700}.f i{color:#444;font-style:normal;font-size:10px}
.qs{margin-top:8px}.qq p{margin:6px 0 2px;font-size:12px;font-weight:600}.opts{display:flex;gap:14px;flex-wrap:wrap;font-size:11px}
.fill{margin-top:10px;font-size:12px}.box{border:1px solid #999;height:130px;border-radius:6px;background:repeating-linear-gradient(0deg,#fff,#fff 19px,#eee 20px)}
footer{font-size:10px;color:#666;text-align:center;margin-top:16px}@media print{.card{page-break-inside:avoid}}</style></head><body>
<h1>${esc(title || 'PHIẾU BÀI TẬP TOÁN HỌC')} <small>Sinh từ thư viện ${CAT.models.length} mô hình 3D · Họ tên: ……… Lớp: ……… Điểm: …</small></h1>
${cards}<footer>In phiếu này để phát cho lớp — đáp án Quick Quiz nằm trong ứng dụng (nút Quiz).</footer></body></html>`;
  }

  /* ============================================================
   * 9) EXPORT OBJ + EMBED SNIPPET
   * ============================================================ */
  function exportOBJ(model) {
    const g = CAT.buildGeometry(model);
    let o = `# Math3D Catalog — ${model.name} (#${model.id})\n# ${model.desc}\no ${model.id}\n`;
    g.verts.forEach(v => { o += `v ${v[0].toFixed(5)} ${v[1].toFixed(5)} ${v[2].toFixed(5)}\n`; });
    g.tris.forEach(t => { o += `f ${t[0] + 1} ${t[1] + 1} ${t[2] + 1}\n`; });
    return o;
  }
  function embedCode(model) {
    const SC = '<' + 'script>', SCE = '<' + '/' + 'script>';
    return `<!-- Nhúng mô hình "${model.name}" (#${model.id}) vào trang khác -->
<div id="math3d-${model.id}" style="width:420px;height:320px"></div>
${SC}src="js/math3d.js"${SCE}
${SC}src="js/classroom.js"${SCE}
${SC}
Math3DCatalog.loadModels('js/models.json').then(() => {
  const m = Math3DCatalog.getModel('${model.id}');
  Math3DCatalog.createViewer(document.getElementById('math3d-${model.id}'), { model: m });
  console.table(Math3DClassroom.metrics(m)); // công thức + số liệu của mô hình
});
${SCE}`;
  }

  /* ---------- public API ---------- */
  const api = {
    version: '1.1.0',
    metrics, net, netToGeometry, folder, sectionAt, parts, quiz, lessonPlan, teachSteps,
    worksheetHTML, exportOBJ, embedCode, fmt, unitOf, statsData, probData,
    FORMULAS: { FN, SURF, POLAR, QUAD, REV, FRAC },
    // cross-section overlay for the viewer: {lines, fillLoops, color}
    sectionOverlay(model, mode, k) {
      const s = sectionAt(model, mode, k);
      if (!s.segs.length && !s.loops.length) return null;
      const loops = s.loops.filter(L => L.length >= 3);
      const lines = [];
      for (const L of loops) for (const seg of L) lines.push(seg);
      if (!loops.length) for (const seg of s.segs) lines.push(seg);
      return { lines, fillLoops: loops, color: '#ff5d8f', info: s.info };
    },
    enrich(model) {
      const out = Object.assign({}, model);
      out.metrics = metrics(model);
      out.net = net(model);
      out.parts = parts(model);
      out.quiz = quiz(model, 4);
      out.lesson = lessonPlan(model);
      out.teach = teachSteps(model);
      return out;
    },
    enrichAll(list) { return (list || CAT.models).map(enrich); }
  };
  global.Math3DClassroom = api;
})(typeof window !== 'undefined' ? window : globalThis);
