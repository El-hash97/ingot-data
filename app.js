/* ============================================================
   INGOT MONITOR — app.js
   Core application logic
   ============================================================ */

'use strict';

// ---- CONSTANTS ---------------------------------------------
const LS_DATA_KEY   = 'ingot_data';
const LS_PREF_KEY   = 'ingot_prefs';
const PAGE_SIZE      = 10;

// ---- STATE --------------------------------------------------
let allData      = [];
let filteredData = [];
let currentPage  = 1;
let modalAction  = null;
let sidebarOpen  = true;

// ---- INIT ---------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initSidebar();
  initForm();
  updateClock();
  setInterval(updateClock, 1000);
  updateTopbarDate();
  updateDashboard();
});

// ---- SIDEBAR ------------------------------------------------
function initSidebar() {
  const isSmall = window.innerWidth <= 768;
  if (isSmall) {
    sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const wrapper = document.querySelector('.main-wrapper');
  const isSmall  = window.innerWidth <= 768;

  if (isSmall) {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('mobile-open', sidebarOpen);
  } else {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('collapsed', !sidebarOpen);
    wrapper.classList.toggle('expanded', !sidebarOpen);
  }
}

// ---- CLOCK --------------------------------------------------
function updateClock() {
  const now = new Date();
  const formatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.getElementById('sidebar-time');
  if (el) el.textContent = formatted;
}

function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const todayEl = document.getElementById('dash-today-date');
  if (todayEl) todayEl.textContent = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ---- PAGE NAVIGATION ----------------------------------------
function showPage(name, linkEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  if (linkEl) linkEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', input: 'Input Data', history: 'Riwayat' };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[name] || name;

  if (name === 'dashboard') updateDashboard();
  if (name === 'history') { filterHistory(); }
  if (name === 'input') { loadPrefs(); }

  // Close sidebar on mobile after nav
  if (window.innerWidth <= 768 && sidebarOpen) toggleSidebar();

  return false;
}

// ---- LOCAL STORAGE ------------------------------------------
function loadData() {
  try {
    allData = JSON.parse(localStorage.getItem(LS_DATA_KEY)) || [];
  } catch {
    allData = [];
  }
}

function saveData() {
  localStorage.setItem(LS_DATA_KEY, JSON.stringify(allData));
}

function loadPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem(LS_PREF_KEY)) || {};
    if (prefs.operator) document.getElementById('f-operator').value = prefs.operator;
    if (prefs.shift) {
      const radio = document.querySelector(`input[name="shift"][value="${prefs.shift}"]`);
      if (radio) radio.checked = true;
    }
  } catch { /* no prefs */ }
}

function savePrefs(operator, shift) {
  localStorage.setItem(LS_PREF_KEY, JSON.stringify({ operator, shift }));
}

// ---- FORM ---------------------------------------------------
function initForm() {
  // Set today as default date
  const dateInput = document.getElementById('f-date');
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

  // Load saved prefs
  loadPrefs();

  // Form submit
  const form = document.getElementById('ingot-form');
  if (form) form.addEventListener('submit', handleSubmit);

  // Initial calc
  autoCalc();
}

function autoCalc() {
  const masuk  = parseFloat(document.getElementById('f-masuk').value)  || 0;
  const pakai  = parseFloat(document.getElementById('f-pakai').value)  || 0;
  const buang  = parseFloat(document.getElementById('f-buang').value)  || 0;
  const akhir  = masuk - pakai - buang;

  const display = document.getElementById('stock-akhir-display');
  const box     = document.getElementById('stock-result-box');

  if (display) display.textContent = formatNumber(akhir);
  if (box) {
    box.classList.toggle('negative', akhir < 0);
  }
}

function resetForm() {
  const form = document.getElementById('ingot-form');
  if (!form) return;

  // Reset all inputs except preserved ones
  form.reset();

  // Restore date to today
  const dateInput = document.getElementById('f-date');
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

  // Re-load prefs (operator + shift)
  loadPrefs();
  autoCalc();

  // Remove invalid states
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;

  // Validate
  const errors = validateForm();
  if (errors.length > 0) {
    showToast(errors[0], 'error');
    return;
  }

  const operator = document.getElementById('f-operator').value.trim();
  const shift    = document.querySelector('input[name="shift"]:checked')?.value;
  const timeVal  = document.querySelector('input[name="time"]:checked')?.value;
  const date     = document.getElementById('f-date').value;
  const masuk    = parseFloat(document.getElementById('f-masuk').value)  || 0;
  const pakai    = parseFloat(document.getElementById('f-pakai').value)  || 0;
  const buang    = parseFloat(document.getElementById('f-buang').value)  || 0;
  const akhir    = masuk - pakai - buang;

  const entry = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    date,
    time:      timeVal,
    shift,
    operator,
    masuk,
    pakai,
    buang,
    akhir
  };

  allData.push(entry);
  saveData();
  savePrefs(operator, shift);
  showToast('Data berhasil disimpan!', 'success');
  resetForm();
  updateDashboard();
}

function validateForm() {
  const errors = [];

  const operator = document.getElementById('f-operator');
  if (!operator.value.trim()) {
    operator.classList.add('invalid');
    errors.push('Nama operator wajib diisi.');
  } else {
    operator.classList.remove('invalid');
  }

  const shift = document.querySelector('input[name="shift"]:checked');
  if (!shift) errors.push('Pilih shift terlebih dahulu.');

  const date = document.getElementById('f-date');
  if (!date.value) {
    date.classList.add('invalid');
    errors.push('Tanggal wajib diisi.');
  } else {
    date.classList.remove('invalid');
  }

  const time = document.querySelector('input[name="time"]:checked');
  if (!time) errors.push('Pilih waktu (Day / Night) terlebih dahulu.');

  return errors;
}

// ---- DASHBOARD ----------------------------------------------
function updateDashboard() {
  loadData();

  if (allData.length === 0) {
    document.getElementById('dash-stock').textContent = '—';
    document.getElementById('dash-masuk').textContent = '—';
    document.getElementById('dash-pakai').textContent = '—';
    document.getElementById('dash-buang').textContent = '—';
    document.getElementById('dash-latest-shift').textContent = '—';
    document.getElementById('dash-latest-shift').className = 'badge';

    document.getElementById('dash-latest-grid').innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-1M8 12h8" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/></svg>
        <p>Belum ada data.</p>
        <button class="btn btn-primary btn-sm" onclick="showPage('input', document.getElementById('nav-input'))">Input Data Pertama</button>
      </div>`;

    document.getElementById('dash-today-content').innerHTML = `<div class="empty-state"><p>Tidak ada input hari ini.</p></div>`;
    return;
  }

  // Stat totals
  const totalMasuk = allData.reduce((s, d) => s + d.masuk, 0);
  const totalPakai = allData.reduce((s, d) => s + d.pakai, 0);
  const totalBuang = allData.reduce((s, d) => s + d.buang, 0);

  // Latest entry (by id/timestamp)
  const sorted = [...allData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latest  = sorted[0];
  const latestAkhir = latest.masuk - latest.pakai - latest.buang;

  document.getElementById('dash-stock').textContent = formatNumber(latestAkhir);
  document.getElementById('dash-masuk').textContent = formatNumber(totalMasuk);
  document.getElementById('dash-pakai').textContent = formatNumber(totalPakai);
  document.getElementById('dash-buang').textContent = formatNumber(totalBuang);

  // Latest shift badge
  const shiftBadge = document.getElementById('dash-latest-shift');
  shiftBadge.textContent = `Shift ${latest.shift}`;
  shiftBadge.className = `badge ${latest.shift === 'Red' ? 'badge-red' : 'badge-white'}`;

  // Latest grid
  document.getElementById('dash-latest-grid').innerHTML = `
    <div class="latest-item">
      <div class="latest-item-label">Operator</div>
      <div class="latest-item-value">${escHtml(latest.operator)}</div>
    </div>
    <div class="latest-item">
      <div class="latest-item-label">Tanggal</div>
      <div class="latest-item-value">${formatDate(latest.date)}</div>
    </div>
    <div class="latest-item">
      <div class="latest-item-label">Waktu</div>
      <div class="latest-item-value">${latest.time || '—'}</div>
    </div>
    <div class="latest-item">
      <div class="latest-item-label">Masuk</div>
      <div class="latest-item-value">${formatNumber(latest.masuk)}</div>
    </div>
    <div class="latest-item">
      <div class="latest-item-label">Pakai</div>
      <div class="latest-item-value">${formatNumber(latest.pakai)}</div>
    </div>
    <div class="latest-item">
      <div class="latest-item-label">Buang</div>
      <div class="latest-item-value">${formatNumber(latest.buang)}</div>
    </div>
    <div class="latest-item">
      <div class="latest-item-label">Stok Akhir</div>
      <div class="latest-item-value highlight">${formatNumber(latestAkhir)}</div>
    </div>
  `;

  // Today's entries
  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = sorted.filter(d => d.date === todayStr);

  if (todayData.length === 0) {
    document.getElementById('dash-today-content').innerHTML = `<div class="empty-state"><p>Tidak ada input hari ini.</p></div>`;
  } else {
    const rows = todayData.map(d => `
      <tr>
        <td>${d.time || '—'}</td>
        <td><span class="badge ${d.shift === 'Red' ? 'badge-red' : 'badge-white'}">${d.shift}</span></td>
        <td>${escHtml(d.operator)}</td>
        <td class="text-right">${formatNumber(d.masuk)}</td>
        <td class="text-right">${formatNumber(d.pakai)}</td>
        <td class="text-right">${formatNumber(d.buang)}</td>
        <td class="text-right ${d.akhir < 0 ? 'stock-negative' : 'stock-positive'}">${formatNumber(d.akhir)}</td>
      </tr>
    `).join('');

    document.getElementById('dash-today-content').innerHTML = `
      <table class="today-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Shift</th>
            <th>Operator</th>
            <th class="text-right">Masuk</th>
            <th class="text-right">Pakai</th>
            <th class="text-right">Buang</th>
            <th class="text-right">Stok Akhir</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
}

// ---- HISTORY ------------------------------------------------
function filterHistory() {
  loadData();

  const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const sort  = document.getElementById('sort-select')?.value || 'newest';

  filteredData = allData.filter(d => {
    if (!query) return true;
    return (
      d.operator.toLowerCase().includes(query) ||
      d.shift.toLowerCase().includes(query) ||
      d.date.includes(query) ||
      (d.time || '').toLowerCase().includes(query)
    );
  });

  filteredData.sort((a, b) => {
    const da = new Date(a.timestamp), db = new Date(b.timestamp);
    return sort === 'newest' ? db - da : da - db;
  });

  currentPage = 1;
  renderHistory();
}

function renderHistory() {
  const tbody     = document.getElementById('history-body');
  const emptyEl   = document.getElementById('history-empty');
  const countEl   = document.getElementById('history-count');
  const clearBtn  = document.getElementById('clear-all-btn');
  const exportBtn = document.getElementById('export-btn');

  // Update counts
  if (countEl) countEl.textContent = `${filteredData.length} entri`;
  if (clearBtn) clearBtn.style.display = allData.length > 0 ? '' : 'none';
  if (exportBtn) exportBtn.style.display = allData.length > 0 ? '' : 'none';

  if (!tbody) return;

  if (filteredData.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = '';
    renderPagination(0);
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  // Paginate
  const total  = filteredData.length;
  const pages  = Math.ceil(total / PAGE_SIZE);
  if (currentPage > pages) currentPage = pages;

  const start  = (currentPage - 1) * PAGE_SIZE;
  const end    = Math.min(start + PAGE_SIZE, total);
  const pageData = filteredData.slice(start, end);

  tbody.innerHTML = pageData.map((d, i) => {
    const no = start + i + 1;
    const stockClass = d.akhir < 0 ? 'stock-negative' : (d.akhir > 0 ? 'stock-positive' : '');
    return `
      <tr>
        <td>${no}</td>
        <td>${formatDate(d.date)}</td>
        <td><span class="badge ${d.time === 'Night' ? 'badge-night' : 'badge-day'}">${d.time || '—'}</span></td>
        <td><span class="badge ${d.shift === 'Red' ? 'badge-red' : 'badge-white'}">${d.shift}</span></td>
        <td>${escHtml(d.operator)}</td>
        <td class="text-right">${formatNumber(d.masuk)}</td>
        <td class="text-right">${formatNumber(d.pakai)}</td>
        <td class="text-right">${formatNumber(d.buang)}</td>
        <td class="text-right ${stockClass}">${formatNumber(d.akhir)}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon" onclick="confirmDelete(${d.id})" title="Hapus">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination(pages);
}

function renderPagination(totalPages) {
  const info     = document.getElementById('pagination-info');
  const controls = document.getElementById('pagination-controls');
  if (!info || !controls) return;

  if (totalPages <= 0) {
    info.textContent = '';
    controls.innerHTML = '';
    return;
  }

  const total = filteredData.length;
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end   = Math.min(currentPage * PAGE_SIZE, total);
  info.textContent = `Menampilkan ${start}–${end} dari ${total} entri`;

  let html = '';
  // Prev
  html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>`;

  // Page numbers
  const range = pageRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '…') {
      html += `<span style="padding: 0 4px; color: var(--text-muted);">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    }
  });

  // Next
  html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>›</button>`;

  controls.innerHTML = html;
}

function pageRange(current, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  const range = [];
  range.push(1);
  if (current > 3) range.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) range.push(i);
  if (current < total - 2) range.push('…');
  range.push(total);
  return range;
}

function goToPage(p) {
  const total = Math.ceil(filteredData.length / PAGE_SIZE);
  if (p < 1 || p > total) return;
  currentPage = p;
  renderHistory();
}

// ---- DELETE ------------------------------------------------
function confirmDelete(id) {
  openModal(
    'Hapus Data',
    'Data ini akan dihapus secara permanen. Lanjutkan?',
    () => deleteEntry(id)
  );
}

function deleteEntry(id) {
  allData = allData.filter(d => d.id !== id);
  saveData();
  filterHistory();
  updateDashboard();
  showToast('Data berhasil dihapus.', 'success');
}

function confirmClearAll() {
  openModal(
    'Hapus Semua Data',
    `Seluruh ${allData.length} entri akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
    () => {
      allData = [];
      saveData();
      filterHistory();
      updateDashboard();
      showToast('Semua data telah dihapus.', 'success');
    }
  );
}

// ---- MODAL --------------------------------------------------
function openModal(title, message, onConfirm) {
  document.getElementById('modal-title').textContent   = title;
  document.getElementById('modal-message').textContent = message;
  const btn = document.getElementById('modal-confirm-btn');
  btn.onclick = () => { closeModal(); onConfirm(); };
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ---- EXPORT CSV ---------------------------------------------
function exportCSV() {
  if (allData.length === 0) { showToast('Tidak ada data untuk diexport.', 'error'); return; }

  const sorted = [...allData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const header = ['No', 'Tanggal', 'Waktu', 'Shift', 'Operator', 'Masuk', 'Pakai', 'Buang', 'Stok Akhir'];
  const rows   = sorted.map((d, i) => [
    i + 1,
    d.date,
    d.time || '',
    d.shift,
    `"${d.operator}"`,
    d.masuk,
    d.pakai,
    d.buang,
    d.akhir
  ]);

  const csv = [header, ...rows].map(r => r.join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ingot-data-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV berhasil!', 'success');
}

// ---- TOAST --------------------------------------------------
let toastTimer = null;

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.className = `toast ${type} show`;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ---- HELPERS ------------------------------------------------
function formatNumber(n) {
  if (n === undefined || n === null) return '—';
  return Number(n).toLocaleString('id-ID');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
