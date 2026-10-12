/* ════════════════════════════════════════════
   P-INV  application script
   ════════════════════════════════════════════ */
(() => {
'use strict';

// ─────────────────────────────────────────────
// SVG icon set (stroke = currentColor, weight 1.4)
// ─────────────────────────────────────────────
const ICONS = {
  'arrow-right': '<path d="M5 12h14M13 5l7 7-7 7"/>',
  'arrow-left':  '<path d="M19 12H5M11 19l-7-7 7-7"/>',
  'arrow-down':  '<path d="M12 5v14M5 13l7 7 7-7"/>',
  'plus':        '<path d="M12 5v14M5 12h14"/>',
  'close':       '<path d="M18 6 6 18M6 6l12 12"/>',
  'check':       '<path d="m5 12 5 5L20 7"/>',
  'check-circle':'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  'document':    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  'download':    '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  'upload':      '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  'info':        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  'warning':     '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/>',
  'search':      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  'sun':         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  'moon':        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
  'spinner':     '<path d="M12 3a9 9 0 1 0 9 9" stroke-linecap="round"/>',
  'user':        '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'bank':        '<path d="M3 10h18M5 10v9M19 10v9M9 10v9M15 10v9M2 21h20M3 7l9-4 9 4"/>',
  'calendar':    '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  'list':        '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  'refresh':     '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>',
};

function svgIcon(name, size = 18) {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    if (el.dataset.painted === '1') return;
    const name = el.dataset.icon;
    const size = parseInt(el.dataset.size || '18', 10);
    el.innerHTML = svgIcon(name, size);
    el.dataset.painted = '1';
  });
}

// ─────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────
const THEME_KEY = 'pinv-theme';

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}
function initTheme() {
  let t = null;
  try { t = localStorage.getItem(THEME_KEY); } catch {}
  if (!t) {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }
  applyTheme(t);
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CLIENT = {
  yago: 'Purukichi',
  name: '肥山 優志',
  addr: '京都府宇治市広野町成田１－８０',
  tel:  '080-7735-7590',
  mail: 'musiccattle@gmail.com',
};

const PCLOUD_CODE = 'Gy9XZfFigWG3uSrXkSCzklLTnDXHr5hh7';
const PCLOUD_LINK = 'https://u.pcloud.com/#/puplink?code=' + PCLOUD_CODE;

const WORK_TYPES = [
  'デザイン','作曲','作編曲','作詞','歌唱',
  'ミックス','イラスト制作','楽器演奏','ライブ出演','動画制作',
];
const TAX_FREE_WORKS = new Set(['作曲','作編曲','作詞','歌唱','イラスト制作','動画制作']);
const TAXABLE_WORKS  = new Set(['デザイン','ミックス','楽器演奏','ライブ出演']);

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let rows = [];
let invNo = '';
let maxStep = 1;
let lastPdfBlob = null;
let lastPdfName = '';

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────
const $  = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtN = (n) => Math.round(n).toLocaleString('ja-JP');

function fmtDate(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function toJP(s){
  if(!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
function genNo(){
  const s = $('issueDate').value;
  const d = s ? new Date(s) : new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${yy}${mm}-${String(Math.floor(Math.random()*9000)+1000)}`;
}
function showAle(id, msg, fields = []){
  const e = $(id);
  e.innerHTML = `${svgIcon('warning',16)}<span>${esc(msg)}</span>`;
  e.classList.add('show');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove('show'), 6000);
  fields.forEach(f => {
    const el = $(f); if (!el) return;
    el.classList.add('invalid');
    el.addEventListener('input', () => el.classList.remove('invalid'), { once:true });
  });
  if (fields.length && $(fields[0])) $(fields[0]).focus({ preventScroll:true });
  e.scrollIntoView({ behavior:'smooth', block:'center' });
}
function fname(){
  const s = ($('senderName').value || $('senderYago').value || 'unknown').replace(/\s/g,'');
  const dt = $('issueDate').value || fmtDate(new Date());
  const clean = (x) => x.replace(/[\\/:*?"<>|\s]/g,'');
  const valid = rows.filter(r => r.name.trim());
  let summary = '';
  if (valid.length === 0) summary = '品目不明';
  else if (valid.length === 1) summary = valid[0].name.trim().slice(0,20);
  else {
    const allWorks = [...new Set(valid.flatMap(r => r.works.length ? r.works : []))];
    if (allWorks.length) summary = allWorks.slice(0,3).join('・') + (allWorks.length > 3 ? '他' : '');
    else summary = valid.slice(0,2).map(r => r.name.trim().slice(0,8)).join('_')
                  + (valid.length > 2 ? `_他${valid.length-2}件` : '');
  }
  return `請求書_${clean(s)}_${clean(summary)}_${dt}.pdf`;
}
function updateDueDate(){
  const s = $('issueDate').value;
  if (!s) return;
  const d = new Date(s);
  const eom = new Date(d.getFullYear(), d.getMonth() + 2, 0);
  $('dueDate').value = fmtDate(eom);
}

// ─────────────────────────────────────────────
// Postal code lookup (Zipcloud)
// ─────────────────────────────────────────────
async function searchZip(){
  const zip = $('senderZip').value.replace(/-/g,'').trim();
  const msg = $('zipMsg');
  if (zip.length !== 7){
    msg.textContent = '7桁の数字で入力してください';
    msg.style.color = 'var(--text)';
    return;
  }
  msg.textContent = '検索中...';
  msg.style.color = 'var(--muted)';
  try {
    const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const j = await r.json();
    if (j.results && j.results.length){
      const a = j.results[0];
      const addr = a.address1 + a.address2 + a.address3;
      $('senderAddr').value = addr;
      msg.textContent = addr;
      msg.style.color = 'var(--text)';
    } else {
      msg.textContent = '住所が見つかりませんでした';
      msg.style.color = 'var(--text)';
    }
  } catch {
    msg.textContent = '検索に失敗しました（ネットワークを確認）';
    msg.style.color = 'var(--text)';
  }
}

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────
function jumpTo(n){
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s => {
    const k = +s.dataset.go;
    s.classList.toggle('active', k === n);
    s.classList.toggle('done', k < n || (k !== n && k <= maxStep));
    if (k === n) s.setAttribute('aria-current','step'); else s.removeAttribute('aria-current');
  });
  const se = $('section' + n);
  if (se) se.classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });
  if (n === 3) requestAnimationFrame(fitPreview);
}
function goTo(n){
  if (n > maxStep){
    if (maxStep === 1) showAle('ale1', '先にSTEP 1を完了してください。');
    else if (maxStep === 2) showAle('ale2', '先にSTEP 2を完了してください。');
    return;
  }
  if (n === 3){ buildInvArea(); buildPreview(); }
  jumpTo(n);
}
function val1(){
  const missing = ['senderName','senderAddr','bankName','bankNum','bankHolder','issueDate','dueDate']
    .filter(id => !$(id).value.trim());
  if (missing.length){
    const labels = { senderName:'氏名', senderAddr:'住所', bankName:'銀行名', bankNum:'口座番号',
                     bankHolder:'口座名義', issueDate:'発行日', dueDate:'支払期限' };
    showAle('ale1', `未入力の必須項目があります：${missing.map(k => labels[k]).join('・')}`, missing);
    return;
  }
  maxStep = Math.max(maxStep, 2);
  jumpTo(2);
}
function val2(){
  if (!rows.filter(r => r.name.trim() && r.price > 0).length){
    showAle('ale2','品目名と単価を少なくとも1行入力してください。'); return;
  }
  invNo = invNo || genNo();
  buildInvArea();
  buildPreview();
  maxStep = Math.max(maxStep, 3);
  jumpTo(3);
}

// ─────────────────────────────────────────────
// Item rows
// ─────────────────────────────────────────────
function addRow(){
  rows.push({
    id: Math.floor(Date.now() * 1000 + Math.random() * 1000),
    name:'', tax:'0', qty:1, price:0, song:'', works:[],
  });
  renderRows();
}
function removeRow(id){
  if (rows.length <= 1) return;
  rows = rows.filter(r => r.id !== id);
  renderRows();
}
function setName(id, v){
  const r = rows.find(r => r.id === id); if (!r) return;
  r.name = v; renderTots();
}
function setSong(id, v){
  const r = rows.find(r => r.id === id); if (!r) return;
  r.song = v;
}
function suggestTax(works){
  if (!works.length) return null;
  const hasFree = works.some(w => TAX_FREE_WORKS.has(w));
  const hasTax  = works.some(w => TAXABLE_WORKS.has(w));
  if (hasFree && !hasTax) return { tax:'0',  label:'非課税',  reason:'著作権の譲渡・利用許諾に該当' };
  if (!hasFree && hasTax) return { tax:'10', label:'10%課税', reason:'技術的役務に該当する可能性' };
  return { tax:'mixed', label:'要確認', reason:'著作物と役務が混在しています' };
}
function toggleWork(id, work){
  const r = rows.find(r => r.id === id); if (!r) return;
  if (r.works.includes(work)) r.works = r.works.filter(w => w !== work);
  else r.works.push(work);
  const btn = document.querySelector(`[data-wbtn="${id}_${work}"]`);
  if (btn){ btn.classList.toggle('on', r.works.includes(work)); btn.setAttribute('aria-pressed', r.works.includes(work)); }
  const sug = suggestTax(r.works);
  if (sug && sug.tax !== 'mixed') r.tax = sug.tax;
  const badge = document.querySelector(`[data-taxbadge="${id}"]`);
  if (badge){
    badge.innerHTML = badgeHTML(r);
    badge.dataset.show = sug ? '1' : '0';
  }
  if (sug && sug.tax !== 'mixed'){
    const sel = document.querySelector(`[data-taxsel="${id}"]`);
    if (sel) sel.value = sug.tax;
  }
  renderTots();
  renderInvRegWarnings();
}
function reflectToName(id){
  const r = rows.find(r => r.id === id); if (!r) return;
  const parts = [];
  if (r.song.trim()) parts.push(r.song.trim());
  if (r.works.length) parts.push(r.works.join('・'));
  if (!parts.length) return;
  r.name = parts.join(' ');
  const inp = document.querySelector(`[data-nameinp="${id}"]`);
  if (inp) inp.value = r.name;
  renderTots();
  renderInvRegWarnings();
}
function setField(id, f, v){
  const r = rows.find(r => r.id === id); if (!r) return;
  if (f === 'qty')   { const n = parseInt(v,10); r.qty   = (!isNaN(n) && n >= 1) ? n : 1; }
  else if (f === 'price') { const n = parseInt(v,10); r.price = (!isNaN(n) && n >= 0) ? n : 0; }
  else r[f] = v;
  const amt = document.querySelector(`[data-amt="${id}"]`);
  if (amt) amt.textContent = '¥' + fmtN(r.qty * r.price);
  renderTots();
}
function setTax(id, v){
  const r = rows.find(r => r.id === id); if (!r) return;
  r.tax = v;
  renderTots();
  renderInvRegWarnings();
}
function renderInvRegWarnings(){
  const hasReg = $('invReg') && $('invReg').value.trim();
  rows.forEach(r => {
    const el = document.querySelector(`[data-invwarn="${r.id}"]`);
    if (!el) return;
    el.dataset.show = (hasReg && r.tax === '0') ? '1' : '0';
  });
}
function badgeHTML(r){
  const sug = suggestTax(r.works);
  if (!sug) return '';
  if (sug.tax === 'mixed')
    return `${svgIcon('warning',14)}<span><strong>${sug.label}</strong>　${sug.reason}。税率を手動で選択してください。</span>`;
  return `${svgIcon('info',14)}<span><strong>${sug.label}を推奨</strong>　${sug.reason}</span>`;
}
function renderRows(){
  const cont = $('rowsContainer');
  cont.innerHTML = rows.map((r, i) => `
    <div class="row-card" data-row="${r.id}">
      <div class="row-head">
        <span class="row-idx">ITEM ${String(i+1).padStart(2,'0')}</span>
        ${rows.length > 1
          ? `<button class="rm" data-act="remove" data-id="${r.id}" type="button" aria-label="この明細を削除" title="削除">${svgIcon('close',14)}</button>`
          : ''}
      </div>
      <div class="row-helper">
        <div class="rh-f">
          <label>作業内容<span class="lopt">複数選択可</span></label>
          <div class="rh-tags">
            ${WORK_TYPES.map(w => `<button class="rh-tag${r.works.includes(w)?' on':''}" data-wbtn="${r.id}_${w}" data-act="work" data-id="${r.id}" data-work="${w}" type="button" aria-pressed="${r.works.includes(w)}">${w}</button>`).join('')}
          </div>
        </div>
        <div class="rh-f">
          <label for="song_${r.id}">楽曲名・案件名<span class="lopt">任意</span></label>
          <input class="ci" id="song_${r.id}" type="text" value="${esc(r.song)}" placeholder="例：OP曲タイトル"
            data-act="song" data-id="${r.id}">
        </div>
      </div>
      <div class="suggest-badge" data-taxbadge="${r.id}" data-show="${r.works.length ? 1 : 0}">${badgeHTML(r)}</div>
      <div class="row-body">
        <div class="row-grid">
          <div class="f name">
            <label for="name_${r.id}">品名 <span class="req">*</span></label>
            <div class="name-row">
              <input class="ci" id="name_${r.id}" type="text" value="${esc(r.name)}" placeholder="請求書に記載する品目名"
                data-nameinp="${r.id}" data-act="name" data-id="${r.id}">
              <button class="rh-reflect" data-act="reflect" data-id="${r.id}" type="button" title="楽曲名・作業内容から品名を作成">
                ${svgIcon('arrow-down',14)}<span>自動入力</span>
              </button>
            </div>
          </div>
          <div class="f tax">
            <label for="tax_${r.id}">税率</label>
            <select class="ci" id="tax_${r.id}" data-taxsel="${r.id}" data-act="tax" data-id="${r.id}">
              <option value="0"  ${r.tax==='0' ?'selected':''}>非課税</option>
              <option value="10" ${r.tax==='10'?'selected':''}>10%</option>
              <option value="8"  ${r.tax==='8' ?'selected':''}>8%</option>
            </select>
          </div>
          <div class="f">
            <label for="qty_${r.id}">数量</label>
            <input class="ci ci-r" id="qty_${r.id}" type="number" inputmode="numeric" value="${r.qty}" min="1" step="1"
              data-act="qty" data-id="${r.id}">
          </div>
          <div class="f">
            <label for="price_${r.id}">単価（円）</label>
            <input class="ci ci-r" id="price_${r.id}" type="number" inputmode="numeric" value="${r.price || ''}" min="0" step="1" placeholder="0"
              data-act="price" data-id="${r.id}">
          </div>
        </div>
        <div class="row-amt">
          <span class="cl">小計</span>
          <span class="av" data-amt="${r.id}">¥${fmtN(r.qty * r.price)}</span>
        </div>
      </div>
      <div class="invreg-warn" data-invwarn="${r.id}">
        ${svgIcon('warning',14)}
        <span>インボイス登録番号が入力されています。登録事業者への支払いには消費税が発生するため、税率を10%に設定してください。</span>
      </div>
    </div>`).join('');
  paintIcons(cont);
  renderTots();
  renderInvRegWarnings();
}

function calcTots(){
  let b10=0,b8=0,ex=0;
  for (const r of rows){
    const l = r.qty * r.price;
    if (r.tax === '10') b10 += l;
    else if (r.tax === '8') b8 += l;
    else ex += l;
  }
  const t10 = Math.floor(b10 * 0.1);
  const t8  = Math.floor(b8  * 0.08);
  return { b10, b8, ex, t10, t8, total: b10 + b8 + ex + t10 + t8 };
}
function renderTots(){
  const t = calcTots(); let h='';
  if (t.b10) h += `<div class="tr"><span class="tl">小計（10%対象）</span><span class="tv">¥${fmtN(t.b10)}</span></div>`;
  if (t.b8)  h += `<div class="tr"><span class="tl">小計（8%対象）</span><span class="tv">¥${fmtN(t.b8)}</span></div>`;
  if (t.ex)  h += `<div class="tr"><span class="tl">非課税小計</span><span class="tv">¥${fmtN(t.ex)}</span></div>`;
  if (t.t10) h += `<div class="tr"><span class="tl">消費税（10%）</span><span class="tv">¥${fmtN(t.t10)}</span></div>`;
  if (t.t8)  h += `<div class="tr"><span class="tl">消費税（8%）</span><span class="tv">¥${fmtN(t.t8)}</span></div>`;
  h += `<div class="tr gd"><span class="tl">合計（税込）</span><span class="tv">¥${fmtN(t.total)}</span></div>`;
  $('tots').innerHTML = h;
  if ($('barTotal')) $('barTotal').textContent = '¥' + fmtN(t.total);
}

// ─────────────────────────────────────────────
// Invoice HTML build
// ─────────────────────────────────────────────
function buildInvHTML(){
  const t = calcTots();
  const reg  = $('invReg').value.trim();
  const yago = $('senderYago').value.trim();
  const name = $('senderName').value.trim();
  const branch = $('bankBranch').value.trim();
  const bank = [
    $('bankName').value.trim(),
    branch ? (/(支店|出張所|営業部)$/.test(branch) ? branch : branch + '支店') : '',
    `${$('bankType').value}　${$('bankNum').value.trim()}`,
    `口座名義　${$('bankHolder').value.trim()}`,
  ].filter(Boolean).map(esc).join('<span class="sep">/</span>');
  const notes = $('notes').value.trim();
  const due = toJP($('dueDate').value);

  const irows = rows.filter(r => r.name.trim()).map((r, i) => `
    <tr>
      <td class="no">${i + 1}</td>
      <td>${esc(r.name)}</td>
      <td class="rt">${r.tax==='0' ? '非課税' : r.tax + '%'}</td>
      <td class="rt">${r.qty}</td>
      <td class="rt">¥${fmtN(r.price)}</td>
      <td class="rt">¥${fmtN(r.qty * r.price)}</td>
    </tr>`).join('');

  let trows = '';
  if (t.b10) trows += `<tr><td class="tl">小計（10%対象）</td><td class="tv">¥${fmtN(t.b10)}</td></tr>`;
  if (t.b8)  trows += `<tr><td class="tl">小計（8%対象）</td><td class="tv">¥${fmtN(t.b8)}</td></tr>`;
  if (t.ex)  trows += `<tr><td class="tl">非課税小計</td><td class="tv">¥${fmtN(t.ex)}</td></tr>`;
  if (t.t10) trows += `<tr><td class="tl">消費税（10%）</td><td class="tv">¥${fmtN(t.t10)}</td></tr>`;
  if (t.t8)  trows += `<tr><td class="tl">消費税（8%）</td><td class="tv">¥${fmtN(t.t8)}</td></tr>`;
  trows += `<tr class="gd"><td class="tl">合計（税込）</td><td class="tv">¥${fmtN(t.total)}</td></tr>`;

  const senderLines = [
    $('senderAddr').value.trim(),
    $('senderPhone').value.trim() ? 'TEL　' + $('senderPhone').value.trim() : '',
    $('senderEmail').value.trim(),
  ].filter(Boolean).map(esc).join('<br>');

  return `
  <div class="i-hdr">
    <div>
      <div class="i-ttl">請求書</div>
    </div>
    <table class="i-meta">
      <tr><td class="k">請求書番号</td><td class="v">${invNo}</td></tr>
      <tr><td class="k">発行日</td><td class="v">${toJP($('issueDate').value)}</td></tr>
    </table>
  </div>
  <div class="i-par">
    <div class="i-to">
      <div class="i-ptl">請求先</div>
      <div class="i-pn">${esc(CLIENT.yago)}　${esc(CLIENT.name)}<span class="sama">様</span></div>
      <div class="i-pd">${esc(CLIENT.addr)}<br>TEL　${esc(CLIENT.tel)}<br>${esc(CLIENT.mail)}</div>
    </div>
    <div class="i-from">
      <div class="i-ptl">請求元</div>
      ${yago ? `<div class="i-pd">${esc(yago)}</div>` : ''}
      <div class="i-pn">${esc(name)}</div>
      <div class="i-pd">${senderLines}</div>
      ${reg ? `<div class="i-reg">登録番号　${esc(reg)}</div>` : ''}
    </div>
  </div>
  <div class="i-ban">
    <div>
      <div class="lb">ご請求金額（税込）</div>
      <div class="am"><small>¥</small>${fmtN(t.total)}</div>
    </div>
    <div class="rr">
      <div class="lb">お支払期限</div>
      <div class="vl">${due}</div>
    </div>
  </div>
  <table class="i-tbl">
    <thead><tr>
      <th style="text-align:left;">No.</th>
      <th style="text-align:left;">品目・作業内容</th>
      <th style="width:11%;text-align:right;">税率</th>
      <th style="width:9%;text-align:right;">数量</th>
      <th style="width:16%;text-align:right;">単価</th>
      <th style="width:18%;text-align:right;">金額</th>
    </tr></thead>
    <tbody>${irows}</tbody>
  </table>
  <div class="i-tot-w"><table class="i-tot">${trows}</table></div>
  <div class="i-bnk">
    <div class="i-bnkt">お振込先</div>
    <div class="i-bnkb">${bank}</div>
  </div>
  ${notes ? `<div class="i-note"><div class="i-bnkt">備考</div>${esc(notes)}</div>` : ''}
  <div class="i-ftr">本請求書は正式な会計書類です。発行日より5年間の保存を推奨します。</div>`;
}

function buildInvArea(){
  $('inv-area').innerHTML = buildInvHTML();
}
function buildPreview(){
  const pw = $('prevWrap');
  pw.innerHTML = '';
  const clone = $('inv-area').cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.add('inv-doc');
  const paper = document.createElement('div');
  paper.className = 'prev-paper';
  const inner = document.createElement('div');
  inner.style.cssText = 'transform-origin:top left;width:794px;';
  inner.appendChild(clone);
  paper.appendChild(inner);
  pw.appendChild(paper);
  fitPreview();
}
function fitPreview(){
  const pw = $('prevWrap');
  const paper = pw.querySelector('.prev-paper');
  if (!paper || !pw.offsetParent) return;
  const inner = paper.firstChild;
  const sc = Math.min(1, pw.clientWidth / 794);
  inner.style.transform = `scale(${sc})`;
  paper.style.height = Math.ceil(inner.scrollHeight * sc) + 'px';
}

// ─────────────────────────────────────────────
// PDF generation (returns Blob, also auto-downloads)
// ─────────────────────────────────────────────
async function generatePDF({ download = true } = {}){
  await document.fonts.ready;
  const el = $('inv-area');
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 794,
    windowWidth: 794,
  });
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:'p', unit:'mm', format:'a4' });
  const pW = 210, pH = 297;
  const ratio = pW / canvas.width;
  const imgH = canvas.height * ratio;
  const imgData = canvas.toDataURL('image/jpeg', 0.97);
  if (imgH <= pH){
    pdf.addImage(imgData, 'JPEG', 0, 0, pW, imgH);
  } else {
    const pxPerPage = pH / ratio;
    let srcY = 0;
    while (srcY < canvas.height){
      const sliceH = Math.min(pxPerPage, canvas.height - srcY);
      const pc = document.createElement('canvas');
      pc.width = canvas.width; pc.height = sliceH;
      pc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (srcY > 0) pdf.addPage();
      pdf.addImage(pc.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, pW, sliceH * ratio);
      srcY += sliceH;
    }
  }
  const blob = pdf.output('blob');
  const filename = fname();
  lastPdfBlob = blob;
  lastPdfName = filename;
  if (download) triggerDownload(blob, filename);
  return { blob, filename };
}

function triggerDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ─────────────────────────────────────────────
// pCloud upload (uploadtolink endpoint, public file request)
//
// pCloud の API は応答に CORS ヘッダを付けないため、ブラウザから
// fetch しても応答を読めずエラーになる。そのため二段構えにする：
//   1) 通常 fetch（成功すれば確認済みとして返す）
//   2) no-cors fetch（応答は不透明だが、ブラウザは送信自体は実行する）
//   3) 両方失敗したら error
// 送信は届いていても応答を読めないだけ、というケースが多いので、
// no-cors で送れた場合は「送信を試行した（未確認）」として扱う。
// ─────────────────────────────────────────────
async function uploadToPCloud(blob, filename){
  const url = `https://api.pcloud.com/uploadtolink?code=${encodeURIComponent(PCLOUD_CODE)}&names=${encodeURIComponent(filename)}&nopartial=1`;
  const makeFD = () => { const fd = new FormData(); fd.append('file', blob, filename); return fd; };

  // 1) CORS 経由（応答を読める場合のみ）
  try {
    const r = await fetch(url, { method:'POST', body: makeFD() });
    if (r.ok){
      const j = await r.json();
      if (j.result === 0) return { ok:true, verified:true };
      return { ok:false, verified:false, error:'pCloud: ' + (j.error || j.result) };
    }
  } catch (e) {
    // 大半は CORS で response opaque を読み取れないためここに入る
    console.warn('pCloud CORS fetch failed; trying no-cors:', e.message);
  }

  // 2) no-cors（fire-and-forget。response は opaque で中身は読めないが、
  //    送信自体はブラウザが完了させる）
  try {
    await fetch(url, { method:'POST', body: makeFD(), mode:'no-cors' });
    return { ok:true, verified:false };
  } catch (e) {
    return { ok:false, verified:false, error: e.message || String(e) };
  }
}

// ─────────────────────────────────────────────
// Issue (download + upload + show success)
// ─────────────────────────────────────────────
async function dlPDF(){
  if (!invNo){ alert('先にプレビューを表示してください。'); return null; }
  const ov = $('pdfo');
  const msg = $('pmsg');
  ov.classList.add('show');
  msg.textContent = 'PDFを作成中…';
  try {
    const out = await generatePDF({ download: true });
    return out;
  } catch (e) {
    alert('PDF生成エラー: ' + e.message);
    console.error(e);
    return null;
  } finally {
    ov.classList.remove('show');
  }
}

async function issueInvoice(){
  if (!invNo){ alert('先にプレビューを表示してください。'); return; }
  const ov = $('pdfo');
  const msg = $('pmsg');
  ov.classList.add('show');
  msg.textContent = 'PDFを作成中…';

  let pdfOut = null;
  let uploadResult = { ok:false, verified:false, error:null };

  try {
    pdfOut = await generatePDF({ download: true });
  } catch (e) {
    ov.classList.remove('show');
    alert('PDF生成エラー: ' + e.message);
    console.error(e);
    return;
  }

  if (pdfOut) {
    msg.textContent = 'Purukichiへ送信中…';
    uploadResult = await uploadToPCloud(pdfOut.blob, pdfOut.filename);
  }

  ov.classList.remove('show');
  showSuccess(uploadResult);
}

function showSuccess(uploadResult){
  $('sNo').textContent = invNo;
  const us = $('upStatus');
  const linkLine = `<br><a class="lk" href="${PCLOUD_LINK}" target="_blank" rel="noopener">${PCLOUD_LINK}</a>`;
  const sentMsg = `<span>送信が完了しました ＞ ⇀ ＜<br>請求書PDFも保管お願いいたします！</span>`;
  if (uploadResult.ok && uploadResult.verified){
    us.innerHTML = `${svgIcon('check',16)}${sentMsg}`;
  } else if (uploadResult.ok){
    us.innerHTML = `${svgIcon('check',16)}${sentMsg}`;
  } else {
    us.innerHTML = `${svgIcon('warning',16)}<span>自動送信できませんでした。PDFはダウンロード済みです。下記リンクから手動でアップロードしてください。${linkLine}</span>`;
  }
  paintIcons(us);
  us.classList.add('show');

  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
  $('section-success').classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────
function resetTool(){
  rows = []; invNo = ''; maxStep = 1;
  lastPdfBlob = null; lastPdfName = '';
  ['senderYago','senderName','senderZip','senderAddr','senderPhone','senderEmail','invReg',
   'bankName','bankBranch','bankNum','bankHolder','notes'].forEach(id => $(id).value = '');
  $('bankType').value = '普通';
  $('zipMsg').textContent = '';
  $('upStatus').classList.remove('show');
  $('upStatus').innerHTML = '';
  const t = new Date();
  $('issueDate').value = fmtDate(t);
  updateDueDate();
  addRow();
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active','done'));
  $('section1').classList.add('active');
  $('step1').classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ─────────────────────────────────────────────
// Wiring
// ─────────────────────────────────────────────
function bindRowDelegation(){
  const cont = $('rowsContainer');
  cont.addEventListener('input', (e) => {
    const t = e.target;
    const act = t.dataset.act, id = +t.dataset.id;
    if (!act || !id) return;
    if (act === 'name')  setName(id, t.value);
    else if (act === 'song')  setSong(id, t.value);
    else if (act === 'qty' || act === 'price') setField(id, act, t.value);
  });
  cont.addEventListener('change', (e) => {
    const t = e.target;
    const act = t.dataset.act, id = +t.dataset.id;
    if (!act || !id) return;
    if (act === 'tax')   setTax(id, t.value);
    else if (act === 'qty' || act === 'price'){
      setField(id, act, t.value);
      const r = rows.find(r => r.id === id);
      if (r) t.value = act === 'qty' ? r.qty : (r.price || '');
    }
  });
  cont.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act, id = +t.dataset.id;
    if (act === 'remove')  removeRow(id);
    else if (act === 'reflect') reflectToName(id);
    else if (act === 'work')    toggleWork(id, t.dataset.work);
  });
}

function bindUI(){
  // Theme
  initTheme();
  $('themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // Step buttons
  document.querySelectorAll('.step[data-go]').forEach(b => {
    b.addEventListener('click', () => goTo(+b.dataset.go));
  });

  // Buttons
  $('btnZip').addEventListener('click', searchZip);
  $('senderZip').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g,''); });
  $('senderZip').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchZip(); });
  $('issueDate').addEventListener('change', updateDueDate);
  $('invReg').addEventListener('input', renderInvRegWarnings);

  $('btnVal1').addEventListener('click', val1);
  $('btnBack2').addEventListener('click', () => goTo(1));
  $('btnVal2').addEventListener('click', val2);
  $('btnBack3').addEventListener('click', () => goTo(2));
  $('btnIssue').addEventListener('click', issueInvoice);
  $('btnAddRow').addEventListener('click', addRow);
  $('btnRedl').addEventListener('click', dlPDF);
  $('btnReset').addEventListener('click', resetTool);
  let rz;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(fitPreview); });
}

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  paintIcons();
  const t = new Date();
  $('issueDate').value = fmtDate(t);
  updateDueDate();
  addRow();
  bindRowDelegation();
  bindUI();
});

})();
