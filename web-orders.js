  /* ─── State ─── */
  let orders = [];
  let soundOn = true;
  let currentFilter = 'all';
  let currentTab = 'orders';

  /* ─── الحماية من XSS ─── */
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  /* ─── تاريخ اليوم بتوقيت بغداد (UTC+3) ─── */
  function localDateStr() {
    const now = new Date();
    const local = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }

  /* ─── Clock ─── */
  function updateClock() {
    const now = new Date();
    document.getElementById('header-time').textContent =
      now.toLocaleDateString('ar-IQ', { numberingSystem: 'latn' }) + '  ' + now.toLocaleTimeString('ar-IQ', { numberingSystem: 'latn' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  /* ─── Tab switching ─── */
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.page-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('pane-' + tab).classList.add('active');
    if (tab === 'history') {
      const dateInput = document.getElementById('history-date');
      if (!dateInput.value) dateInput.value = localDateStr();
      loadHistory();
    }
    if (tab === 'reservations') {
      const dateInput = document.getElementById('res-filter-date');
      if (!dateInput.value) dateInput.value = localDateStr();
      loadReservations();
      const meetingDateInput = document.getElementById('meeting-filter-date');
      if (!meetingDateInput.value) meetingDateInput.value = localDateStr();
      loadMeetingReservations();
    }
    if (tab === 'qr') loadTableQRs();
  }

  /* ─── Sound ─── */
  function playSound() {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1100, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.3);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.3);
      });
    } catch (_) {}
  }

  function toggleSound() {
    soundOn = !soundOn;
    refreshSoundLabel();
  }
  function refreshSoundLabel() {
    const btn = document.getElementById('sound-btn');
    if (!btn) return;
    const span = btn.querySelector('[data-i]');
    const onText  = I18N[currentLang].sound_on;
    const offText = I18N[currentLang].sound_off;
    btn.firstChild.textContent = soundOn ? '🔔 ' : '🔕 ';
    if (span) span.textContent = soundOn ? onText : offText;
  }

  /* ─── Theme toggle (light/dark) ─── */
  let currentTheme = localStorage.getItem('web_orders_theme') || 'light';
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('web_orders_theme', currentTheme);
    applyTheme();
  }

  /* ─── Language toggle (ar/en) ─── */
  const I18N = {
    ar: {
      live: 'مباشر',
      sound_on: 'الصوت: تشغيل',
      sound_off: 'الصوت: إيقاف',
      logout: 'خروج',
      tab_orders: '📋 الطلبات الحالية',
      tab_history: '🗂️ سجل الطلبات',
      tab_reservations: '📅 الحجوزات',
      tab_stamps: '☕ الطوابع',
      tab_qr: '🪑 QR الطاولات',
      filter_all: 'الكل',
      filter_new: '🟠 جديد',
      filter_making: '🟢 قيد التحضير',
      filter_done: '✅ مكتمل',
      stat_new: 'جديد',
      stat_making: 'قيد التحضير',
      stat_done: 'مكتمل اليوم',
      stat_total: 'إجمالي اليوم (IQD)',
      btn_start_making: '✓ بدء التحضير',
      btn_done: '✅ تم التسليم',
      btn_done_confirm: '⚠️ اضغط مرة أخرى للتأكيد',
      total_label: 'الإجمالي',
      pickup: 'استلام',
      table: 'طاولة',
      empty_orders: 'لا توجد طلبات حالياً',
    },
    en: {
      live: 'Live',
      sound_on: 'Sound: On',
      sound_off: 'Sound: Off',
      logout: 'Logout',
      tab_orders: '📋 Current Orders',
      tab_history: '🗂️ Order History',
      tab_reservations: '📅 Reservations',
      tab_stamps: '☕ Stamps',
      tab_qr: '🪑 Table QR',
      filter_all: 'All',
      filter_new: '🟠 New',
      filter_making: '🟢 Preparing',
      filter_done: '✅ Done',
      stat_new: 'New',
      stat_making: 'Preparing',
      stat_done: 'Done today',
      stat_total: 'Today total (IQD)',
      btn_start_making: '✓ Start preparing',
      btn_done: '✅ Mark done',
      btn_done_confirm: '⚠️ Tap again to confirm',
      total_label: 'Total',
      pickup: 'Pickup',
      table: 'Table',
      empty_orders: 'No orders right now',
    }
  };
  let currentLang = localStorage.getItem('web_orders_lang') || 'ar';
  function applyLang() {
    const dict = I18N[currentLang];
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    const btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = currentLang === 'ar' ? 'EN' : 'AR';
    // tabs
    const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = dict[key] || el.textContent; };
    setText('tab-orders', 'tab_orders');
    setText('tab-history', 'tab_history');
    setText('tab-reservations', 'tab_reservations');
    setText('tab-stamps', 'tab_stamps');
    setText('tab-qr', 'tab_qr');
    // filter buttons (by data-filter attribute, fallback to text match)
    document.querySelectorAll('.filter-btn').forEach(b => {
      const f = b.getAttribute('data-filter');
      if (f && dict['filter_' + f]) b.textContent = dict['filter_' + f];
    });
    // stat labels
    const statLabels = document.querySelectorAll('.stat-label');
    const statKeys = ['stat_new','stat_making','stat_done','stat_total'];
    statLabels.forEach((el, i) => { if (statKeys[i] && dict[statKeys[i]]) el.textContent = dict[statKeys[i]]; });
    // logout / live / sound
    document.querySelectorAll('[data-i]').forEach(el => {
      const k = el.getAttribute('data-i');
      if (dict[k]) el.textContent = dict[k];
    });
    refreshSoundLabel();
    if (typeof renderOrders === 'function') renderOrders();
  }
  function toggleLang() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('web_orders_lang', currentLang);
    applyLang();
  }
  const t = (key) => (I18N[currentLang][key] || key);

  /* ─── Stats ─── */
  function updateStats() {
    document.getElementById('stat-new').textContent    = orders.filter(o => o.status === 'new').length;
    document.getElementById('stat-making').textContent = orders.filter(o => o.status === 'making').length;
    document.getElementById('stat-done').textContent   = orders.filter(o => o.status === 'done').length;
    const totalRevenue = orders.filter(o => o.status === 'done').reduce((s,o) => s + o.total, 0);
    document.getElementById('stat-total').textContent  = totalRevenue.toLocaleString();
  }

  /* ─── Render current orders ─── */
  // 픽업 카운트다운 — arrival_time(HH:MM) 기준 남은/지난 분 표시
  function pickupCountdown(arrivalTime) {
    if (!arrivalTime) return '';
    const m = String(arrivalTime).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return '';
    const now = new Date();
    const baghdadNow = new Date(now.getTime() + 3*3600*1000);
    const arrivalMs = Date.UTC(
      baghdadNow.getUTCFullYear(),
      baghdadNow.getUTCMonth(),
      baghdadNow.getUTCDate(),
      parseInt(m[1], 10), parseInt(m[2], 10), 0
    );
    const nowMs = baghdadNow.getTime();
    const diffMin = Math.round((arrivalMs - nowMs) / 60000);
    let cls, label;
    if (diffMin > 15)        { cls = 'later'; label = `+${diffMin}m`; }
    else if (diffMin > 5)    { cls = 'soon';  label = `${diffMin}m`; }
    else if (diffMin > -2)   { cls = 'now';   label = diffMin === 0 ? 'NOW' : (diffMin > 0 ? `${diffMin}m` : `-${-diffMin}m`); }
    else                     { cls = 'late';  label = `LATE ${-diffMin}m`; }
    return `<span class="pickup-countdown ${cls}" title="${esc(arrivalTime)}">⏱ ${label}</span>`;
  }

  function renderOrders() {
    const grid = document.getElementById('orders-grid');
    const filtered = currentFilter === 'all' ? orders : orders.filter(o => o.status === currentFilter);
    const sorted = [...filtered].sort((a,b) => b.timestamp - a.timestamp);

    if (sorted.length === 0) {
      grid.innerHTML = `<div class="empty-state">
        <div class="empty-icon">☕</div>
        <div>${esc(t('empty_orders'))}</div>
      </div>`;
      updateStats();
      return;
    }

    const locale = currentLang === 'ar' ? 'ar-IQ' : 'en-GB';
    grid.innerHTML = sorted.map(order => {
      const time = new Date(order.timestamp).toLocaleTimeString(locale, {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, numberingSystem: 'latn'});
      const typeBadge = order.type === 'dine'
        ? `<span class="order-type-badge badge-dine">🪑 ${esc(t('table'))} ${esc(order.table_num)}</span>`
        : `<span class="order-type-badge badge-pickup">🏃 ${esc(t('pickup'))}</span>`;
      const countdown = order.type !== 'dine' ? pickupCountdown(order.arrival_time) : '';
      const arrivalText = order.arrival_time
        ? `&nbsp; ⏱ <span dir="ltr" style="unicode-bidi:plaintext;">${esc(order.arrival_time)}</span>`
        : '';
      const info = order.customer_name
        ? `<div class="order-info">👤 <strong>${esc(order.customer_name)}</strong>${order.customer_phone ? ` &nbsp; 📞 <span dir="ltr" style="unicode-bidi:plaintext;">${esc(order.customer_phone)}</span>` : ''}${arrivalText}</div>`
        : '';
      const itemsHtml = order.items.map(i => {
        const name = currentLang === 'ar' ? (i.nameAr || i.name) : (i.name || i.nameAr);
        return `<div class="order-item-row"><span>${esc(i.emoji)} <span class="item-name">${esc(name)}</span>${i.size ? ` <span class="item-size-badge">${esc(String(i.size))}</span>` : ''}</span><span class="item-qty">×${esc(String(i.qty))}</span></div>`;
      }).join('');

      const safeId = esc(order.id);
      const actionBtns = order.status === 'new'
        ? `<button class="btn-action btn-making" id="btn-${safeId}" onclick="setStatus('${safeId}','making')">${esc(t('btn_start_making'))}</button>`
        : order.status === 'making'
        ? `<button class="btn-action btn-done" id="btn-${safeId}" data-confirm-state="0" onclick="confirmDone('${safeId}', this)">${esc(t('btn_done'))}</button>`
        : order.status === 'cancelled'
        ? `<span style="color:#e53e3e;font-size:0.85rem;font-weight:700;">❌ ${currentLang === 'ar' ? 'ملغي' : 'Cancelled'}</span>`
        : `<span style="color:#aaa;font-size:0.85rem;font-weight:700;">✅ ${currentLang === 'ar' ? 'مكتمل' : 'Done'}</span>`;

      const cancelBtn = (order.status === 'new' || order.status === 'making')
        ? `<button class="btn-cancel" id="cancel-${safeId}" onclick="cancelOrder('${safeId}')" title="${currentLang === 'ar' ? 'إلغاء الطلب' : 'Cancel order'}">✕</button>`
        : '';

      return `<div class="order-card status-${order.status}" id="card-${safeId}">
        <div class="order-card-header">
          <span class="order-num">#${order.num}</span>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
            ${typeBadge}
            ${countdown}
            <span class="order-time">${time}</span>
          </div>
        </div>
        ${info}
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total-row">
          <span>${esc(t('total_label'))}</span>
          <span class="order-total-amount">${order.total.toLocaleString()} IQD</span>
        </div>
        <div class="order-actions">
          ${actionBtns}
          <button class="btn-action btn-print" onclick="printReceipt('${safeId}')" title="${currentLang === 'ar' ? 'طباعة' : 'Print'}">🖨️</button>
          ${cancelBtn}
        </div>
      </div>`;
    }).join('');

    updateStats();
  }

  // 1초마다 카드 시간/카운트다운 갱신 (전체 재렌더는 비싸서 분/초만 갱신)
  let _liveTickHandle = null;
  function startLiveTick() {
    if (_liveTickHandle) clearInterval(_liveTickHandle);
    _liveTickHandle = setInterval(() => {
      if (currentTab !== 'orders') return;
      // 픽업 카운트다운 갱신만 — 더 가벼운 부분 업데이트
      document.querySelectorAll('.order-card').forEach(card => {
        const id = card.id.replace(/^card-/, '');
        const o = orders.find(x => x.id === id);
        if (!o || o.type === 'dine') return;
        const old = card.querySelector('.pickup-countdown');
        const fresh = pickupCountdown(o.arrival_time);
        if (!fresh) return;
        if (old) old.outerHTML = fresh;
      });
    }, 1000);
  }

  // Double-tap-to-confirm guard for "Done"
  function confirmDone(id, btn) {
    const state = btn.getAttribute('data-confirm-state') || '0';
    if (state === '0') {
      btn.setAttribute('data-confirm-state', '1');
      btn.classList.add('confirm-pending');
      const original = btn.textContent;
      btn.dataset.original = original;
      btn.textContent = t('btn_done_confirm');
      // 5초 안에 다시 안 누르면 원상 복귀
      setTimeout(() => {
        if (btn.getAttribute('data-confirm-state') === '1') {
          btn.setAttribute('data-confirm-state', '0');
          btn.classList.remove('confirm-pending');
          btn.textContent = btn.dataset.original || t('btn_done');
        }
      }, 5000);
      return;
    }
    btn.classList.remove('confirm-pending');
    btn.setAttribute('data-confirm-state', '0');
    setStatus(id, 'done');
  }

  /* ─── API: إلغاء الطلب ─── */
  async function cancelOrder(id) {
    if (!confirm('هل تريد إلغاء هذا الطلب؟')) return;
    const btn = document.getElementById(`cancel-${id}`);
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const idx = orders.findIndex(o => o.id === id);
      if (idx !== -1) { orders[idx] = data.order; renderOrders(); }
    } catch (e) {
      alert('فشل الإلغاء. حاول مرة أخرى.');
      if (btn) { btn.disabled = false; btn.textContent = '✕'; }
    }
  }

  /* ─── API: تغيير حالة الطلب ─── */
  async function setStatus(id, status) {
    const btn = document.getElementById(`btn-${id}`);
    if (btn) { btn.disabled = true; }
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const idx = orders.findIndex(o => o.id === id);
      if (idx !== -1) { orders[idx] = data.order; renderOrders(); }
    } catch (e) {
      alert('فشل تغيير الحالة. حاول مرة أخرى.');
      if (btn) { btn.disabled = false; }
    }
  }

  function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrders();
  }

  /* ─── New order notification ─── */
  function showNewOrderFlash() {
    playSound();
    const flash = document.getElementById('new-flash');
    flash.classList.add('show');
    setTimeout(() => flash.classList.remove('show'), 3000);
  }

  /* ─── New reservation notification ─── */
  function playReservationSound() {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // نغمة صاعدة ثلاثية صافية (للحجز فقط)
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.25);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.25);
      });
    } catch (_) {}
  }

  const AREA_LABEL_EN = { floor_1: 'Floor 1', floor_2: 'Floor 2', study_room: 'Study Room' };

  let _resFlashHideTimer = null;
  let _resFlashShownAt = 0;
  const RES_FLASH_DURATION_MS = 10000;
  function dismissReservationFlash() {
    const flash = document.getElementById('res-flash');
    if (flash) flash.classList.remove('show');
    if (_resFlashHideTimer) { clearTimeout(_resFlashHideTimer); _resFlashHideTimer = null; }
    _resFlashShownAt = 0;
  }
  function showNewReservationFlash(r) {
    playReservationSound();
    document.getElementById('res-flash-name').textContent    = `👤 ${r.name}`;
    document.getElementById('res-flash-phone').textContent   = `📱 ${r.phone}`;
    document.getElementById('res-flash-datetime').textContent = `🗓 ${r.date}  ${r.time}`;
    document.getElementById('res-flash-party').textContent   = `👥 ${r.party_size} guests`;
    document.getElementById('res-flash-table').textContent   = r.table_num ? `📍 Area: ${AREA_LABEL_EN[r.table_num] || r.table_num}` : '';
    const flash = document.getElementById('res-flash');
    flash.classList.add('show');
    _resFlashShownAt = Date.now();
    if (_resFlashHideTimer) clearTimeout(_resFlashHideTimer);
    _resFlashHideTimer = setTimeout(dismissReservationFlash, RES_FLASH_DURATION_MS);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const flash = document.getElementById('res-flash');
    const closeBtn = document.getElementById('res-flash-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        dismissReservationFlash();
      });
    }
    if (flash) {
      flash.title = 'Click to dismiss';
      flash.addEventListener('click', dismissReservationFlash);
    }
  });
  // 페이지가 백그라운드 탭이었다가 돌아오면 setTimeout이 throttled 되어 늦게 fire될 수 있음.
  // visible 복귀 시 경과 시간을 확인해서 만료된 알림은 즉시 닫는다.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!_resFlashShownAt) return;
    if (Date.now() - _resFlashShownAt >= RES_FLASH_DURATION_MS) {
      dismissReservationFlash();
    }
  });

  /* ─── Print receipt ─── */
  function printReceipt(id) {
    const allOrders = [...orders, ...(window._historyOrders || [])];
    const o = allOrders.find(x => x.id === id);
    if (!o) return;
    const time = new Date(o.timestamp).toLocaleString('ar-IQ', { numberingSystem: 'latn' });
    const typeStr = o.type === 'dine'
      ? `داخل المحل — طاولة ${esc(o.table_num)}`
      : `استلام — ${esc(o.customer_name)}`;
    let html = `<div style="text-align:center;font-weight:bold;font-size:16px;">مستر كيمز</div>
<div style="text-align:center;font-size:12px;">Mr. Kim&#39;s CAFE</div>
<div style="border-top:1px dashed #000;margin:8px 0;"></div>
<div>رقم الطلب: #${esc(String(o.num))}</div>
<div>الوقت: ${esc(time)}</div>
<div>النوع: ${typeStr}</div>
<div style="border-top:1px dashed #000;margin:8px 0;"></div>`;
    o.items.forEach(i => {
      html += `<div style="display:flex;justify-content:space-between;"><span>${esc(i.emoji)} ${esc(i.nameAr || i.name)}${i.size ? ` (${esc(String(i.size))})` : ''} ×${esc(String(i.qty))}</span><span>${(i.price*i.qty).toLocaleString()} IQD</span></div>`;
    });
    html += `<div style="border-top:1px dashed #000;margin:8px 0;"></div>
<div style="display:flex;justify-content:space-between;font-weight:bold;"><span>الإجمالي</span><span>${o.total.toLocaleString()} IQD</span></div>
<div style="text-align:center;margin-top:12px;font-size:11px;">شكراً لزيارتكم!</div>`;
    document.getElementById('print-area').innerHTML = html;
    window.print();
  }

  /* ─── API: تحميل طلبات اليوم (+ استطلاع احتياطي) ─── */
  async function loadOrders() {
    const today = localDateStr();
    try {
      const res = await fetch(`/api/orders?date=${today}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      orders = await res.json();
      renderOrders();
    } catch (e) {
      console.warn('فشل تحميل الطلبات، سيُعاد المحاولة');
    }
  }

  /* ─── Reservations tab ─── */
  async function loadReservations() {
    const date = document.getElementById('res-filter-date').value;
    if (!date) return;
    const listEl = document.getElementById('reservations-list');
    listEl.innerHTML = '<div style="color:#aaa;padding:32px;text-align:center;grid-column:1/-1;">جارٍ التحميل…</div>';
    try {
      const res = await fetch(`/api/reservations?date=${date}`, { headers: cashierHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const badge = document.getElementById('res-count-badge');
      badge.textContent = `${data.length} حجز`;
      if (data.length === 0) {
        listEl.innerHTML = '<div style="color:#aaa;padding:32px;text-align:center;grid-column:1/-1;">لا توجد حجوزات في هذا التاريخ</div>';
        return;
      }
      const statusColor = { pending:'#f59e0b', confirmed:'#367d4d', cancelled:'#e53e3e', completed:'#888', no_show:'#b91c1c' };
      const statusLabelAr = { pending:'قيد الانتظار', confirmed:'مؤكد', cancelled:'ملغي', completed:'اكتمل', no_show:'لم يحضر' };
      const statusLabelEn = { pending:'Pending',     confirmed:'Confirmed', cancelled:'Cancelled', completed:'Arrived', no_show:'No-show' };
      const statusLabel = currentLang === 'ar' ? statusLabelAr : statusLabelEn;
      const labels = currentLang === 'ar'
        ? { confirm:'✅ تأكيد', cancel:'✕ إلغاء', arrived:'☑ وصل', noShow:'🚷 لم يحضر', guests:'ضيوف' }
        : { confirm:'✅ Confirm', cancel:'✕ Cancel', arrived:'☑ Arrived', noShow:'🚷 No-show', guests:'guests' };
      // 현지 시간(Baghdad) 기준 분 차이
      function resCountdown(timeStr) {
        const m = String(timeStr || '').match(/^(\d{1,2}):(\d{2})/);
        if (!m) return '';
        const baghdadNow = new Date(Date.now() + 3*3600*1000);
        const [hh, mm] = [parseInt(m[1],10), parseInt(m[2],10)];
        const targetMs = Date.UTC(baghdadNow.getUTCFullYear(), baghdadNow.getUTCMonth(), baghdadNow.getUTCDate(), hh, mm, 0);
        const diffMin = Math.round((targetMs - baghdadNow.getTime()) / 60000);
        if (diffMin > 60)        return `<span class="pickup-countdown later">+${Math.round(diffMin/60)}h</span>`;
        if (diffMin > 15)        return `<span class="pickup-countdown later">${diffMin}m</span>`;
        if (diffMin > 5)         return `<span class="pickup-countdown soon">${diffMin}m</span>`;
        if (diffMin > -5)        return `<span class="pickup-countdown now">${diffMin >= 0 ? `${diffMin}m` : `-${-diffMin}m`}</span>`;
        return `<span class="pickup-countdown late">${currentLang==='ar'?'متأخر':'LATE'} ${-diffMin}m</span>`;
      }
      // 정렬: pending/confirmed 우선 + 시간 오름차순
      const sortKey = s => s === 'pending' ? 0 : s === 'confirmed' ? 1 : 2;
      data.sort((a,b) => sortKey(a.status) - sortKey(b.status) || String(a.time||'').localeCompare(String(b.time||'')));

      listEl.innerHTML = data.map(r => {
        const cd = (r.status === 'pending' || r.status === 'confirmed') ? resCountdown(r.time) : '';
        return `
        <div style="background:var(--white,#fff);border-radius:12px;padding:18px 20px;box-shadow:var(--shadow-sm,0 2px 10px rgba(0,0,0,0.07));">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
            <span dir="ltr" style="font-weight:900;font-size:1rem;unicode-bidi:plaintext;">${esc(r.time)} ${cd}</span>
            <span style="background:${statusColor[r.status]||'#888'}22;color:${statusColor[r.status]||'#888'};
              border-radius:20px;padding:3px 12px;font-size:0.78rem;font-weight:800;">${statusLabel[r.status]||r.status}</span>
          </div>
          <div style="font-size:0.88rem;color:var(--text-dark,#333);margin-bottom:4px;">👤 <strong>${esc(r.name)}</strong></div>
          <div style="font-size:0.85rem;color:var(--text-mid,#666);margin-bottom:4px;">📱 <span dir="ltr" style="unicode-bidi:plaintext;">${esc(r.phone)}</span></div>
          <div style="font-size:0.85rem;color:var(--text-mid,#666);margin-bottom:${r.notes?'8px':'4px'};">👥 <span dir="ltr" style="unicode-bidi:plaintext;">${esc(String(r.party_size))}</span> ${labels.guests}</div>
          ${r.notes ? `<div style="font-size:0.82rem;color:var(--text-soft,#888);background:var(--off-white,#f9f9f9);padding:6px 10px;border-radius:6px;margin-bottom:8px;">📝 ${esc(r.notes)}</div>` : ''}
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
            ${r.status==='pending' ? `
              <button onclick="updateReservationStatus(${r.id},'confirmed')"
                style="flex:1;min-width:100px;background:#367d4d;color:#fff;border:none;border-radius:8px;padding:10px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;min-height:40px;">${labels.confirm}</button>
              <button onclick="updateReservationStatus(${r.id},'cancelled')"
                style="flex:1;min-width:100px;background:#fff5f5;color:#e53e3e;border:1px solid #fecaca;border-radius:8px;padding:10px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;min-height:40px;">${labels.cancel}</button>
            ` : r.status==='confirmed' ? `
              <button onclick="updateReservationStatus(${r.id},'completed')"
                style="flex:1;min-width:100px;background:#e8f5ee;color:#367d4d;border:1.5px solid #d4e8d8;border-radius:8px;padding:10px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;min-height:40px;">${labels.arrived}</button>
              <button onclick="markNoShow(${r.id})"
                style="flex:1;min-width:100px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:10px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;min-height:40px;">${labels.noShow}</button>
              <button onclick="updateReservationStatus(${r.id},'cancelled')"
                style="flex:0 0 auto;background:#fff5f5;color:#e53e3e;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;min-height:40px;">${labels.cancel}</button>
            ` : ''}
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      document.getElementById('reservations-list').innerHTML = '<div style="color:#e53e3e;padding:32px;text-align:center;grid-column:1/-1;">فشل تحميل البيانات</div>';
    }
  }

  async function updateReservationStatus(id, status) {
    try {
      const res = await fetch(`/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      loadReservations();
    } catch (e) {
      alert(currentLang === 'ar' ? 'فشل تحديث الحجز' : 'Failed to update reservation');
    }
  }

  // 노쇼 처리: 서버는 'no_show' 상태가 없을 수 있어서 'cancelled'로 보내되,
  // 우선 'no_show'로 시도하고 실패 시 'cancelled' 폴백.
  async function markNoShow(id) {
    const confirmMsg = currentLang === 'ar'
      ? 'تأكيد عدم الحضور؟'
      : 'Mark as no-show?';
    if (!confirm(confirmMsg)) return;
    try {
      let res = await fetch(`/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: 'no_show' })
      });
      if (!res.ok) {
        // 서버가 no_show 미지원이면 cancelled 로 폴백
        res = await fetch(`/api/reservations/${id}/status`, {
          method: 'PUT',
          headers: cashierHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status: 'cancelled' })
        });
      }
      if (!res.ok) throw new Error();
      loadReservations();
    } catch (e) {
      alert(currentLang === 'ar' ? 'فشل تحديث الحجز' : 'Failed to update reservation');
    }
  }

  /* ─── Reservation sub-tabs ─── */
  function switchResSubtab(sub) {
    const isTable = sub === 'table';
    document.getElementById('res-pane-table').style.display = isTable ? '' : 'none';
    document.getElementById('res-pane-meeting').style.display = isTable ? 'none' : '';
    const btnTable = document.getElementById('res-subtab-table');
    const btnMeeting = document.getElementById('res-subtab-meeting');
    btnTable.style.borderBottomColor = isTable ? '#367d4d' : 'transparent';
    btnTable.style.color = isTable ? '#367d4d' : '#888';
    btnMeeting.style.borderBottomColor = isTable ? 'transparent' : '#367d4d';
    btnMeeting.style.color = isTable ? '#888' : '#367d4d';
    if (!isTable) {
      const meetingDateInput = document.getElementById('meeting-filter-date');
      if (!meetingDateInput.value) meetingDateInput.value = localDateStr();
      loadMeetingReservations();
    }
  }

  /* ─── Meeting Room Reservations ─── */
  async function loadMeetingReservations() {
    const date = document.getElementById('meeting-filter-date').value;
    if (!date) return;
    const listEl = document.getElementById('meeting-reservations-list');
    listEl.innerHTML = '<div style="color:#aaa;padding:32px;text-align:center;grid-column:1/-1;">جارٍ التحميل…</div>';
    try {
      const res = await fetch(`/api/meeting-reservations?date=${date}`, { headers: cashierHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const badge = document.getElementById('meeting-count-badge');
      badge.textContent = `${data.length} حجز`;
      if (data.length === 0) {
        listEl.innerHTML = '<div style="color:#aaa;padding:32px;text-align:center;grid-column:1/-1;">لا توجد حجوزات في هذا التاريخ</div>';
        return;
      }
      const statusColor = { pending:'#f59e0b', confirmed:'#367d4d', cancelled:'#e53e3e', completed:'#888' };
      const statusLabel = { pending:'قيد الانتظار', confirmed:'مؤكد', cancelled:'ملغي', completed:'اكتمل' };
      listEl.innerHTML = data.map(r => `
        <div style="background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 10px rgba(0,0,0,0.07);border-top:3px solid #6366f1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span dir="ltr" style="font-weight:900;font-size:1rem;unicode-bidi:plaintext;">⏰ ${esc(r.slot)}</span>
            <span style="background:${statusColor[r.status]||'#888'}22;color:${statusColor[r.status]||'#888'};
              border-radius:20px;padding:3px 12px;font-size:0.78rem;font-weight:800;">${statusLabel[r.status]||r.status}</span>
          </div>
          <div style="font-size:0.88rem;color:#333;margin-bottom:4px;">👤 <strong>${esc(r.name)}</strong></div>
          <div style="font-size:0.85rem;color:#666;margin-bottom:4px;">📱 <span dir="ltr" style="unicode-bidi:plaintext;">${esc(r.phone)}</span></div>
          ${r.notes ? `<div style="font-size:0.82rem;color:#888;background:#f9f9f9;padding:6px 10px;border-radius:6px;margin-bottom:8px;">📝 ${esc(r.notes)}</div>` : ''}
          <div style="font-size:0.78rem;color:#aaa;margin-bottom:8px;">💰 25,000 IQD — paid on arrival</div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            ${r.status==='pending' ? `
              <button onclick="updateMeetingStatus(${r.id},'confirmed')"
                style="flex:1;background:#367d4d;color:#fff;border:none;border-radius:8px;padding:8px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;">✅ تأكيد</button>
              <button onclick="updateMeetingStatus(${r.id},'cancelled')"
                style="flex:1;background:#fff5f5;color:#e53e3e;border:1px solid #fecaca;border-radius:8px;padding:8px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;">✕ إلغاء</button>
            ` : r.status==='confirmed' ? `
              <button onclick="updateMeetingStatus(${r.id},'completed')"
                style="flex:1;background:#e8f5ee;color:#367d4d;border:1.5px solid #d4e8d8;border-radius:8px;padding:8px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;">☑ وصل</button>
              <button onclick="updateMeetingStatus(${r.id},'cancelled')"
                style="flex:1;background:#fff5f5;color:#e53e3e;border:1px solid #fecaca;border-radius:8px;padding:8px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;">✕ إلغاء</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (e) {
      document.getElementById('meeting-reservations-list').innerHTML = '<div style="color:#e53e3e;padding:32px;text-align:center;grid-column:1/-1;">فشل تحميل البيانات</div>';
    }
  }

  async function updateMeetingStatus(id, status) {
    try {
      const res = await fetch(`/api/meeting-reservations/${id}/status`, {
        method: 'PUT',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      loadMeetingReservations();
    } catch (e) {
      alert('فشل تحديث الحجز');
    }
  }

  /* ─── Stamps tab ─── */
  async function earnStamp() {
    const phone = document.getElementById('stamp-earn-phone').value.trim();
    const orderId = document.getElementById('stamp-earn-order').value.trim();
    const msgEl = document.getElementById('stamp-earn-msg');
    msgEl.style.color = '#e53e3e';
    msgEl.textContent = '';
    if (!phone) { msgEl.textContent = 'أدخل رقم الهاتف'; return; }
    try {
      const res = await fetch('/api/stamps/earn', {
        method: 'POST',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phone, order_id: orderId || undefined })
      });
      const data = await res.json();
      if (!res.ok) { msgEl.textContent = data.error || 'فشل منح الطابع'; return; }
      msgEl.style.color = '#367d4d';
      msgEl.textContent = currentLang === 'ar'
        ? `✅ تم منح الطابع! متاح للاستخدام: ${data.available} طابع`
        : `✅ Stamp granted! Available: ${data.available}`;
      document.getElementById('stamp-earn-phone').value = '';
      document.getElementById('stamp-earn-order').value = '';
    } catch (e) {
      msgEl.textContent = 'خطأ في الاتصال';
    }
  }

  async function lookupStamps() {
    const phone = document.getElementById('stamp-redeem-phone').value.trim();
    const infoEl = document.getElementById('stamp-redeem-info');
    const msgEl = document.getElementById('stamp-redeem-msg');
    msgEl.textContent = '';
    if (!phone) { infoEl.textContent = 'أدخل رقم الهاتف أولاً'; return; }
    try {
      const res = await fetch(`/api/stamps/lookup?phone=${encodeURIComponent(phone)}`, { headers: cashierHeaders() });
      const data = await res.json();
      if (!res.ok) { infoEl.style.color = '#e53e3e'; infoEl.textContent = data.error || 'لم يُعثر على العميل'; return; }
      infoEl.style.color = '#333';
      const free = Math.floor(data.available / 9);
      infoEl.innerHTML = `👤 <strong>${esc(data.name)}</strong><br>
        طوابع متاحة: <strong style="color:#367d4d">${data.available}</strong>
        ${free > 0 ? `<br>🎁 مشروب مجاني: <strong style="color:#f59e0b">${free}</strong>` : ''}`;
    } catch (e) {
      infoEl.textContent = 'خطأ في الاتصال';
    }
  }

  async function redeemStamp() {
    const phone = document.getElementById('stamp-redeem-phone').value.trim();
    const msgEl = document.getElementById('stamp-redeem-msg');
    msgEl.style.color = '#e53e3e';
    msgEl.textContent = '';
    if (!phone) { msgEl.textContent = 'أدخل رقم الهاتف أولاً'; return; }
    if (!confirm('هل تريد استرداد 9 طوابع مقابل مشروب مجاني؟')) return;
    try {
      const res = await fetch('/api/stamps/redeem', {
        method: 'POST',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) { msgEl.textContent = data.error || 'فشل الاسترداد'; return; }
      msgEl.style.color = '#367d4d';
      msgEl.textContent = `🎉 تم الاسترداد! الطوابع المتبقية: ${data.available}`;
      document.getElementById('stamp-redeem-info').innerHTML = `المتبقي: <strong>${data.available}</strong> طابع`;
    } catch (e) {
      msgEl.textContent = 'خطأ في الاتصال';
    }
  }

  /* ─── History tab ─── */
  window._historyOrders = [];

  function renderHistoryTable(data) {
    const listEl = document.getElementById('history-list');
    const summaryEl = document.getElementById('history-summary');

    const done = data.filter(o => o.status === 'done').length;
    const rev  = data.filter(o => o.status === 'done').reduce((s,o) => s + o.total, 0);
    summaryEl.innerHTML = `
      <div class="history-stat"><strong>${data.length}</strong>إجمالي الطلبات</div>
      <div class="history-stat"><strong>${done}</strong>مكتمل</div>
      <div class="history-stat"><strong>${data.filter(o=>o.status==='cancelled').length}</strong>ملغي</div>
      <div class="history-stat"><strong>${rev.toLocaleString()} IQD</strong>الإيرادات المؤكدة</div>
    `;

    if (data.length === 0) {
      listEl.innerHTML = `<div class="history-empty">لا توجد طلبات</div>`;
      return;
    }

    const statusLabel = { new:'جديد', making:'قيد التحضير', done:'مكتمل', cancelled:'ملغي' };
    const rows = [...data].sort((a,b) => b.timestamp - a.timestamp).map(o => {
      const time = new Date(o.timestamp).toLocaleTimeString('ar-IQ', {hour:'2-digit', minute:'2-digit', numberingSystem: 'latn'});
      const typeStr = o.type === 'dine' ? `🪑 طاولة ${esc(o.table_num)}` : `🏃 ${esc(o.customer_name||'')}`;
      const itemsList = o.items.map(i => `${esc(i.emoji)} ${esc(i.nameAr||i.name)}${i.size ? ` (${esc(String(i.size))})` : ''} ×${i.qty}`).join('<br>');
      return `<tr>
        <td style="font-weight:900;">#${o.num}</td>
        <td>${time}</td>
        <td>${typeStr}</td>
        <td><div class="history-items-list">${itemsList}</div></td>
        <td style="font-weight:900;color:var(--green);">${o.total.toLocaleString()}</td>
        <td><span class="status-badge ${o.status}">${statusLabel[o.status]||o.status}</span></td>
        <td style="font-size:0.8em;color:#888;">${esc(o.cashier_name||'-')}</td>
        <td><button class="btn-action btn-print" style="padding:6px 10px;" onclick="printReceipt('${esc(o.id)}')" title="طباعة">🖨️</button></td>
      </tr>`;
    }).join('');

    listEl.innerHTML = `<table class="history-table">
      <thead><tr>
        <th>رقم</th><th>الوقت</th><th>النوع</th><th>الطلبات</th><th>IQD</th><th>الحالة</th><th>كاشير</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function filterHistory() {
    const search = (document.getElementById('history-search')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('history-type-filter')?.value || '';
    let data = window._historyOrders;
    if (typeFilter) data = data.filter(o => o.type === typeFilter);
    if (search) {
      data = data.filter(o =>
        (o.customer_name || '').toLowerCase().includes(search) ||
        (o.customer_phone || '').includes(search)
      );
    }
    renderHistoryTable(data);
  }

  async function loadHistory() {
    const date = document.getElementById('history-date').value;
    if (!date) return;
    const summaryEl = document.getElementById('history-summary');
    const listEl = document.getElementById('history-list');
    listEl.innerHTML = `<div class="history-empty">جارٍ التحميل…</div>`;
    summaryEl.innerHTML = '';
    try {
      const res = await fetch(`/api/orders?date=${date}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window._historyOrders = data;

      // Reset filters before rendering
      const typeFilter = document.getElementById('history-type-filter');
      const searchInput = document.getElementById('history-search');
      if (typeFilter) typeFilter.value = '';
      if (searchInput) searchInput.value = '';

      if (data.length === 0) {
        summaryEl.innerHTML = '';
        listEl.innerHTML = `<div class="history-empty">لا توجد طلبات في هذا التاريخ</div>`;
        return;
      }
      renderHistoryTable(data);
    } catch (e) {
      listEl.innerHTML = `<div class="history-empty">فشل تحميل البيانات</div>`;
    }
  }

  /* ─── SSE: استقبال الطلبات الجديدة في الوقت الفعلي ─── */
  function setConnDot(state) {
    const dot = document.getElementById('conn-dot');
    if (!dot) return;
    dot.className = 'conn-dot ' + state;
  }

  let _sseConn = null;
  let _sseDelay = 2000;

  async function connectSSE() {
    if (_sseConn) { try { _sseConn.close(); } catch (_) {} _sseConn = null; }
    if (!cashierToken) { setConnDot('offline'); return; }

    // 현재 서버는 ticket 발급 절차를 요구함 (POST /api/orders/stream-ticket)
    let ticket = '';
    try {
      const r = await fetch('/api/orders/stream-ticket', {
        method: 'POST',
        headers: { 'X-Cashier-Token': cashierToken }
      });
      if (!r.ok) throw new Error('ticket failed');
      const j = await r.json();
      ticket = j.ticket || '';
    } catch (_) {
      setConnDot('offline');
      _sseDelay = Math.min(_sseDelay * 1.5, 30000);
      setTimeout(connectSSE, _sseDelay);
      return;
    }

    const es = new EventSource('/api/orders/stream?ticket=' + encodeURIComponent(ticket));
    _sseConn = es;
    es.onopen = () => { _sseDelay = 2000; setConnDot('online'); };
    es.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch (_) { return; }
      if (msg.type === 'connected') { setConnDot('online'); return; }
      if (msg.type === 'new_order') {
        const todayStr = localDateStr();
        const orderDate = new Date(msg.order.timestamp + 3*3600*1000).toISOString().slice(0,10);
        if (!orders.find(o => o.id === msg.order.id)) {
          if (orderDate === todayStr) orders.unshift(msg.order);
        }
        renderOrders();
        showNewOrderFlash();
        try { playSound(); } catch (_) {}
      } else if (msg.type === 'order_updated') {
        const idx = orders.findIndex(o => o.id === msg.order.id);
        if (idx !== -1) { orders[idx] = msg.order; renderOrders(); }
      } else if (msg.type === 'new_reservation') {
        showNewReservationFlash(msg.reservation);
        if (currentTab === 'reservations') loadReservations();
      } else if (msg.type === 'reservation_updated') {
        if (currentTab === 'reservations') loadReservations();
      } else if (msg.type === 'new_meeting_reservation') {
        if (currentTab === 'reservations') loadMeetingReservations();
      } else if (msg.type === 'meeting_reservation_updated') {
        if (currentTab === 'reservations') loadMeetingReservations();
      }
    };
    es.onerror = () => {
      setConnDot('offline');
      try { es.close(); } catch (_) {}
      _sseConn = null;
      _sseDelay = Math.min(_sseDelay * 1.5, 30000);
      setTimeout(connectSSE, _sseDelay);
    };
  }

  /* ─── تسجيل دخول الكاشير ─── */
  let cashierToken = sessionStorage.getItem('cashier_token') || '';
  let cashierName  = sessionStorage.getItem('cashier_name')  || '';

  function cashierHeaders(extra) {
    return Object.assign({ 'x-cashier-token': cashierToken }, extra || {});
  }

  function updateCashierBadge() {
    const badge = document.getElementById('cashier-badge');
    if (cashierName) badge.textContent = '👤 ' + cashierName;
    else badge.textContent = '';
  }

  async function doCashierLogin() {
    const name = document.getElementById('loginName').value.trim();
    const pw   = document.getElementById('loginPw').value;
    const err  = document.getElementById('loginErr');
    const btn  = document.getElementById('loginBtn');
    err.textContent = '';
    if (!name || !pw) { err.textContent = 'Enter name and password / أدخل الاسم وكلمة المرور'; return; }
    btn.disabled = true; btn.textContent = 'Logging in... / جاري الدخول';
    try {
      const res = await fetch('/api/cashier/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password: pw })
      });
      const d = await res.json();
      if (res.ok) {
        cashierToken = d.token;
        cashierName  = d.name;
        sessionStorage.setItem('cashier_token', cashierToken);
        sessionStorage.setItem('cashier_name', cashierName);
        document.getElementById('loginOverlay').style.display = 'none';
        updateCashierBadge();
        // 로그인 직후 데이터 동기화 + SSE 재연결 (페이지 로드 시점엔 토큰이 없어서 실패했었음)
        try { await loadOrders(); } catch (e) { console.warn('[wo-login] loadOrders failed', e); }
        try { connectSSE(); } catch (e) { console.warn('[wo-login] connectSSE failed', e); }
      } else {
        err.textContent = d.error || 'Login failed / فشل تسجيل الدخول';
      }
    } catch (e) {
      err.textContent = 'Cannot connect to server / لا يمكن الاتصال بالخادم';
    }
    btn.disabled = false; btn.textContent = 'Login / دخول';
  }

  async function doCashierLogout() {
    await fetch('/api/cashier/logout', { method: 'POST', headers: cashierHeaders() });
    sessionStorage.removeItem('cashier_token');
    sessionStorage.removeItem('cashier_name');
    cashierToken = ''; cashierName = '';
    location.reload();
  }

  // التحقق من الجلسة عند تحميل الصفحة
  if (!cashierToken) {
    document.getElementById('loginOverlay').style.display = 'flex';
  } else {
    document.getElementById('loginOverlay').style.display = 'none';
    updateCashierBadge();
  }

  /* ─── Table QR Codes ─── */
  const BASE_URL = 'https://mrkimscafe.com';

  async function loadTableQRs() {
    const list = document.getElementById('qr-list');
    list.innerHTML = '<div style="color:#888;padding:20px">جاري التحميل...</div>';
    try {
      const r = await fetch('/api/table-tokens', { headers: cashierHeaders() });
      if (r.status === 401) { list.innerHTML = '<div style="color:#e53e3e;padding:20px">⚠️ يجب تسجيل الدخول أولاً</div>'; return; }
      const tokens = await r.json();
      if (!tokens.length) { list.innerHTML = '<div style="color:#888;padding:20px">No tables yet. Generate a QR code. / لا توجد طاولات. أنشئ رمز QR.</div>'; return; }
      list.innerHTML = '';
      for (const t of tokens) {
        const url = `${BASE_URL}/?table=${t.table_num}&t=${t.token}`;
        const encodedUrl = encodeURIComponent(url);
        // جلب صورة QR من الخادم
        const qrRes = await fetch(`/api/qr-image?url=${encodedUrl}`, { headers: cashierHeaders() });
        const qrData = qrRes.ok ? await qrRes.json() : null;
        const imgSrc = qrData?.dataUrl || '';
        const card = document.createElement('div');
        card.style.cssText = 'background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);text-align:center';
        card.innerHTML = `
          <div style="font-weight:900;font-size:1.1rem;margin-bottom:12px">🪑 طاولة ${esc(t.table_num)} / Table ${esc(t.table_num)}</div>
          ${imgSrc
            ? `<img id="qr-img-${esc(t.table_num)}" src="${imgSrc}" style="border-radius:8px;width:180px;height:180px" alt="QR Table ${esc(t.table_num)}">`
            : `<div style="font-size:0.7rem;color:#888;word-break:break-all;padding:8px">${esc(url)}</div>`
          }
          <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            <button onclick="printTableQR('${esc(t.table_num)}','${esc(url)}')"
              style="background:#367d4d;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:0.85rem;font-weight:800;cursor:pointer;font-family:inherit">
              🖨️ طباعة / Print
            </button>
            <button onclick="regenToken('${esc(t.table_num)}')"
              style="background:#f0f4f1;color:#4a4a4a;border:1px solid #d4e8d8;border-radius:8px;padding:8px 16px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">
              🔄 تجديد
            </button>
            <button onclick="extendDineSession('${esc(t.table_num)}')"
              style="background:#fff8e1;color:#d97706;border:1px solid #fde68a;border-radius:8px;padding:8px 16px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">
              ⏱ تمديد
            </button>
            <button onclick="deleteTableToken('${esc(t.table_num)}')"
              style="background:#fff5f5;color:#e53e3e;border:1px solid #fecaca;border-radius:8px;padding:8px 16px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">
              🗑️
            </button>
          </div>`;
        list.appendChild(card);
      }
    } catch(e) {
      list.innerHTML = `<div style="color:#e53e3e;padding:20px">Load failed: ${e.message}</div>`;
    }
  }

  async function generateTableQR() {
    const tableNum = document.getElementById('qr-table-input').value.trim();
    if (!tableNum || isNaN(tableNum) || tableNum < 1) {
      alert('أدخل رقم الطاولة / Enter table number');
      return;
    }
    const btn = document.querySelector('[onclick="generateTableQR()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating... / جاري الإنشاء'; }
    try {
      const r = await fetch('/api/table-tokens', {
        method: 'POST',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ tableNum: String(tableNum) })
      });
      if (r.status === 401) { alert('Session expired. Please log in again. / انتهت الجلسة. سجّل الدخول مجدداً.'); location.reload(); return; }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert('Failed to create: ' + (d.error || r.status));
        return;
      }
      document.getElementById('qr-table-input').value = '';
      await loadTableQRs();
    } catch (e) {
      alert('Network error. Check server connection.\nخطأ في الشبكة. تحقق من الاتصال.\n' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '➕ إنشاء QR / Generate QR'; }
    }
  }

  async function regenToken(tableNum) {
    if (!confirm(`تجديد رمز الطاولة ${tableNum}؟\nRegenerate token for Table ${tableNum}?\n\n⚠️ The old QR code will stop working!`)) return;
    await fetch('/api/table-tokens', {
      method: 'POST',
      headers: cashierHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ tableNum })
    });
    loadTableQRs();
  }

  async function deleteTableToken(tableNum) {
    if (!confirm(`حذف QR الطاولة ${tableNum}؟\nDelete QR for Table ${tableNum}?`)) return;
    await fetch(`/api/table-tokens/${tableNum}`, {
      method: 'DELETE', headers: cashierHeaders()
    });
    loadTableQRs();
  }

  async function extendDineSession(tableNum) {
    try {
      const res = await fetch('/api/dine-sessions/extend', {
        method: 'POST',
        headers: cashierHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ tableNum: String(tableNum) })
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'فشل تمديد الجلسة / Extend failed');
        return;
      }
      const expiry = new Date(d.expiresAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' });
      alert(`✅ تم تمديد جلسة الطاولة ${tableNum}\nتنتهي في: ${expiry}\n\nTable ${tableNum} session extended until ${expiry}`);
    } catch (e) {
      alert('خطأ في الاتصال / Network error');
    }
  }

  async function printTableQR(tableNum, url) {
    const encodedUrl = encodeURIComponent(url);
    const qrRes = await fetch(`/api/qr-image?url=${encodedUrl}`, { headers: cashierHeaders() });
    if (!qrRes.ok) { alert('Failed to generate QR image / فشل إنشاء رمز QR'); return; }
    const { dataUrl } = await qrRes.json();
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 2rem; margin-bottom: 8px; }
        p { color: #555; margin-bottom: 20px; font-size: 1rem; }
        img { display: block; margin: 0 auto; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>🪑 Mr. Kim's Cafe</h1>
      <p>Table ${tableNum} — Scan to order / امسح للطلب</p>
      <img src="${dataUrl}" width="300" height="300" alt="QR Code">
      <br><button onclick="window.print()" style="margin-top:20px;padding:10px 24px;font-size:1rem;cursor:pointer">🖨️ Print</button>
      </body></html>`);
    win.document.close();
  }

  /* ─── الاستطلاع الاحتياطي: إعادة مزامنة طلبات اليوم كل 30 ثانية ─── */
  setInterval(loadOrders, 30000);

  /* ─── Init ─── */
  applyTheme();
  applyLang();
  startLiveTick();
  document.getElementById('history-date').value = localDateStr();
  loadOrders();
  connectSSE();
