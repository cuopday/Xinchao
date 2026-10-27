/* =====================================================================
 * Math 3D Catalog — CURRICULUM MODULE (js/curriculum.js) v1.0
 * ---------------------------------------------------------------------
 * Tổ chức 1370 mô hình thành CHỦ ĐỀ (theme) → BÀI HỌC (lesson) theo
 * Chương trình GDPT 2018, khối lớp 1–12, tái sử dụng được trong app khác.
 *
 * Dữ liệu: js/curriculum.json (sinh bởi js/curriculum-gen.py).
 * Nguyên tắc mở rộng: thêm bài học mới = thêm object vào curriculum.json
 * (không cần sửa code). Model khớp với bài học theo `modelKinds`
 * (kind của model) + `grade` (blockAlias để linh hoạt).
 *
 * API (global Math3DCurriculum):
 *   await Math3DCurriculum.load(url='js/curriculum.json')
 *   Math3DCurriculum.themes            -> [{...theme, lessonObjs}]
 *   Math3DCurriculum.lessons           -> [{...lesson, models:[ids], stats}]
 *   Math3DCurriculum.getLesson(code)
 *   Math3DCurriculum.getTheme(code)
 *   Math3DCurriculum.lessonModels(code, limit)   -> [modelObj]
 *   Math3DCurriculum.gradeBand(grade)  -> 'TH'|'CS'|'HS'
 *   Math3DCurriculum.lessonsByGrade(g) -> [lesson]
 *   Math3DCurriculum.matchModel(model) -> {themes:[], lessons:[]} (ngược: model thuộc bài nào)
 *   Math3DCurriculum.progress          -> {done:Set, toggle(id), isDone(id), save(), load()}
 *   Math3DCurriculum.setFilter({level,cat,kind,q}) -> áp bộ lọc hiện tại của app (tuỳ chọn)
 *   Math3DCurriculum.applyToUI(opts)   -> tích hợp nhanh vào index.html (grid+viewer)
 *   Math3DCurriculum.lessonHTML(code)  -> HTML tự chứa cho một bài (nhúng app khác)
 *   Math3DCurriculum.exportJSON()      -> toàn bộ cây chủ đề+bài+mô hình (để app khác dùng)
 * ===================================================================== */
(function (global) {
  'use strict';

  const CAT = () => global.Math3DCatalog;

  let DATA = null;               // curriculum.json
  let LESSONS = [];              // đã nối với models
  let THEMES = [];
  let matchCache = new Map();    // modelId -> {lessons:Set, themes:Set}
  let uiHooks = null;            // {setFilter, openModel, gridEl,...}

  /* ---------- helpers ---------- */
  function gradeBand(g) { return g <= 5 ? 'TH' : (g <= 9 ? 'CS' : 'HS'); }
  function bandName(b) { return b === 'TH' ? 'Tiểu học' : b === 'CS' ? 'THCS' : 'THPT'; }

  function buildMatchIndex() {
    matchCache.clear();
    for (const ls of LESSONS) {
      for (const id of ls.modelIds) {
        if (!matchCache.has(id)) matchCache.set(id, { lessons: new Set(), themes: new Set() });
        matchCache.get(id).lessons.add(ls.code);
      }
    }
    // theme từ lesson
    for (const t of THEMES) for (const c of t.lessons) {
      const ls = LESSONS.find(x => x.code === c); if (!ls) continue;
      for (const id of ls.modelIds) {
        const e = matchCache.get(id); if (e) e.themes.add(t.code);
      }
    }
  }

  function pickModelsForLesson(ls, cap) {
    const cat = CAT(); if (!cat) return [];
    const kinds = ls.modelKinds || [];
    const alias = (DATA.blockAlias) || {};
    const cats = new Set();
    kinds.forEach(k => (alias[k] || []).forEach(c => cats.add(c)));
    const levelWanted = gradeBand(ls.grade) === 'TH' ? 'Tiểu học' : 'Trung học';
    // ưu tiên: đúng kind + đúng cấp; nếu thiếu thì nới cấp
    const pool = cat.models.filter(m => kinds.includes(m.kind));
    let sel = pool.filter(m => m.level === levelWanted);
    if (sel.length < 6) sel = pool.slice();
    // xen kẽ category để đa dạng, và luôn lấy các "đại diện" (size nhỏ nhất mỗi nhóm giống)
    const seenKind = new Set();
    const reps = [];
    for (const m of sel) {
      const key = m.kind + '|' + (m.params && m.params.type != null ? m.params.type : '') + '|' + (m.params && m.params.n != null ? m.params.n : '');
      if (!seenKind.has(key)) { seenKind.add(key); reps.push(m); }
    }
    const out = reps.length >= 4 ? reps : sel;
    return out.slice(0, cap || 24).map(m => m.id);
  }

  async function load(url) {
    url = url || 'js/curriculum.json';
    const res = await fetch(url);
    DATA = await res.json();
    THEMES = DATA.themes.map(t => Object.assign({}, t));
    LESSONS = DATA.lessons.map(ls => Object.assign({}, ls));
    for (const ls of LESSONS) {
      ls.band = gradeBand(ls.grade);
      ls.modelIds = pickModelsForLesson(ls, 24);
      ls.stats = { count: ls.modelIds.length };
    }
    for (const t of THEMES) {
      t.lessonObjs = t.lessons.map(c => LESSONS.find(l => l.code === c)).filter(Boolean);
      t.modelCount = new Set([].concat(...t.lessonObjs.map(l => l.modelIds))).size;
    }
    buildMatchIndex();
    return DATA;
  }

  const getLesson = code => LESSONS.find(l => l.code === code);
  const getTheme = code => THEMES.find(t => t.code === code);

  function lessonModels(code, limit) {
    const ls = getLesson(code); if (!ls) return [];
    const cat = CAT();
    return ls.modelIds.slice(0, limit || 999).map(id => cat.getModel(id)).filter(Boolean);
  }

  function lessonsByGrade(g) { return LESSONS.filter(l => l.grade === g); }

  function matchModel(model) {
    const e = matchCache.get(model.id) || { lessons: new Set(), themes: new Set() };
    return { lessons: [...e.lessons], themes: [...e.themes] };
  }

  /* ---------- progress (localStorage) ---------- */
  const PKEY = 'math3d-cur-progress-v1';
  const progress = {
    done: new Set(),
    load() { try { this.done = new Set(JSON.parse(localStorage.getItem(PKEY) || '[]')); } catch (e) {} return this; },
    save() { try { localStorage.setItem(PKEY, JSON.stringify([...this.done])); } catch (e) {} },
    toggle(id) { this.done.has(id) ? this.done.delete(id) : this.done.add(id); this.save(); return this.done.has(id); },
    isDone(id) { return this.done.has(id); },
    lessonProgress(code) {
      const ls = getLesson(code); if (!ls) return { done: 0, total: 0 };
      const d = ls.modelIds.filter(id => this.done.has(id)).length;
      return { done: d, total: ls.modelIds.length };
    }
  };
  progress.load();

  /* ---------- UI integration ----------
   * applyToUI({themeBar, lessonList, onOpen}) — render sidebar chủ đề/bài học,
   * khi chọn bài: gọi hooks.onSetFilter + hiển thị danh sách model của bài.
   */
  function applyToUI(hooks) {
    uiHooks = hooks || {};
    const bar = uiHooks.themeBar, list = uiHooks.lessonList;
    if (!bar || !list) return;
    bar.innerHTML = '';
    const mkChip = (label, sub, on, fn) => {
      const b = document.createElement('button');
      b.className = 'crChip' + (on ? ' on' : '');
      b.innerHTML = `${label}${sub ? `<small>${sub}</small>` : ''}`;
      b.onclick = fn; return b;
    };
    bar.appendChild(mkChip('🗂 Tất cả', '', true, () => { selectTheme(null); }));
    THEMES.forEach(t => bar.appendChild(mkChip(`📚 ${t.name}`, `${t.modelCount} mô hình`, false, () => selectTheme(t.code))));
    renderLessons(list, null);
  }

  function selectTheme(code) {
    if (uiHooks.onTheme) uiHooks.onTheme(code);
    renderLessons(uiHooks.lessonList, code);
    if (code == null && uiHooks.onClearLesson) uiHooks.onClearLesson();
  }

  function renderLessons(el, themeCode) {
    if (!el) return;
    const ls = themeCode == null ? LESSONS : (getTheme(themeCode) || { lessons: [] }).lessons.map(getLesson).filter(Boolean);
    el.innerHTML = '';
    ls.forEach(l => {
      const p = progress.lessonProgress(l.code);
      const d = document.createElement('div');
      d.className = 'crLesson';
      d.dataset.code = l.code;
      d.innerHTML = `<div class="clTop"><b>${l.title}</b><span class="clBadge">${bandName(l.band)} · Lớp ${l.grade}</span></div>
        <div class="clMeta">${l.block}</div>
        <div class="clBar"><i style="width:${p.total ? Math.round(p.done / p.total * 100) : 0}%"></i><span>${p.done}/${p.total} mô hình đã học</span></div>`;
      d.onclick = () => openLesson(l.code);
      el.appendChild(d);
    });
  }

  function openLesson(code) {
    const ls = getLesson(code); if (!ls) return;
    if (document.querySelectorAll('.crLesson')) {
      document.querySelectorAll('.crLesson').forEach(d => d.classList.toggle('on', d.dataset.code === code));
    }
    if (uiHooks.onOpenLesson) uiHooks.onOpenLesson(ls);
  }

  /* ---------- export a lesson as self-contained HTML ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function lessonHTML(code, opts) {
    opts = opts || {};
    const ls = getLesson(code); if (!ls) return '';
    const ms = lessonModels(code, opts.limit || 12);
    const cards = ms.map(m => `<a class="lc" href="${opts.baseHref || './'}?model=${m.id}" title="${esc(m.desc)}">
        <img loading="lazy" src="${previewDataURL(m)}" alt=""><span>${esc(m.name)}</span></a>`).join('');
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${esc(ls.title)}</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#e8f0ff;margin:0;padding:20px}
h1{font-size:20px}.blk{color:#7cc4ff;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
ul{line-height:1.6}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:14px}
.lc{background:#111a2e;border:1px solid #1f2f4f;border-radius:10px;overflow:hidden;text-decoration:none;color:#cfe3ff;display:flex;flex-direction:column}
.lc:hover{border-color:#4f8ee0}.lc img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}.lc span{font-size:11px;padding:7px}
</style></head><body>
<h1>📚 ${esc(ls.title)}</h1><div class="blk">${esc(ls.block)}</div>
<h3>Mục tiêu</h3><ul>${(ls.objectives || []).map(o => `<li>${esc(o)}</li>`).join('')}</ul>
<h3>Hoạt động với mô hình 3D</h3><ol>${(ls.activities || []).map(o => `<li>${esc(o)}</li>`).join('')}</ol>
<h3>Bài tập về nhà</h3><p>${esc(ls.homework || '—')}</p>
<div class="grid">${cards}</div>
<p style="color:#5f7599;font-size:11px;margin-top:16px">Mở mô hình bằng viewer tương tác: liên kết dẫn tới ${esc(opts.baseHref || 'thư viện gốc')}#model-id</p>
</body></html>`;
  }

  function previewDataURL(m) {
    try {
      const cv = CAT().buildPreviewCanvas(m, 140);
      return cv.toDataURL('image/png');
    } catch (e) { return ''; }
  }

  function exportJSON() {
    return {
      version: DATA.version, updated: DATA.updated, source: DATA.source,
      themes: THEMES.map(t => ({ code: t.code, name: t.name, desc: t.desc, lessons: t.lessons })),
      lessons: LESSONS.map(l => ({
        code: l.code, title: l.title, block: l.block, grade: l.grade, band: l.band,
        objectives: l.objectives, activities: l.activities, homework: l.homework,
        modelIds: l.modelIds
      }))
    };
  }

  const api = {
    version: '1.0.0',
    load, getLesson, getTheme, lessonModels, lessonsByGrade, matchModel,
    gradeBand, bandName,
    get themes() { return THEMES; },
    get lessons() { return LESSONS; },
    get data() { return DATA; },
    progress, applyToUI, selectTheme, openLesson, renderLessons,
    lessonHTML, exportJSON,
    setUIHooks(h) { uiHooks = Object.assign(uiHooks || {}, h); }
  };
  global.Math3DCurriculum = api;
})(typeof window !== 'undefined' ? window : globalThis);
