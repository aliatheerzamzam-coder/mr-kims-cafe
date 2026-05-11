/* ============================================================
   Mr. Kim's CAFE — Profile + Stamps + Order History
   Public globals: openProfileModal, closeProfileModal, switchProfileTab,
                   loadHeroStats, loadProfileData, loadStamps,
                   loadMyReservations, renderStamps, renderOrderHistory
   Depends on globals:
     window.authState, authHeader (index-auth.js),
     renderFavsList (index-favorites.js)
   ============================================================ */
(function () {

  /* ─── PROFILE MODAL ─── */
  function openProfileModal() {
    document.getElementById('profile-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.authState.customer) {
      const name = window.authState.customer.name || '';
      document.getElementById('profile-full-name').textContent = name;
      document.getElementById('profile-meta').innerHTML = `<span dir="ltr" style="unicode-bidi:plaintext;">${window.authState.customer.phone}</span> · ${window.authState.customer.email}`;
      const initials = name.trim().split(/\s+/).slice(0,2).map(s => s[0] || '').join('').toUpperCase() || '☕';
      document.getElementById('profile-avatar').textContent = initials;
    }
    switchProfileTab('orders');
    loadProfileData();
    loadHeroStats();
  }

  async function loadHeroStats() {
    if (!window.authState.token) return;
    try {
      const res = await fetch('/api/customers/stamps', { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      const isAr = document.getElementById('html-root').lang === 'ar';
      const { total_earned = 0, total_redeemed = 0, available = 0 } = data;
      const freeDrinks = Math.floor(available / 9);
      const totalFreeEver = Math.floor(total_redeemed / 9);
      const visits = total_earned + totalFreeEver;
      const levels = [
        { min: 5, icon: '👑', en: 'Legend',   ar: 'أسطوري' },
        { min: 3, icon: '💎', en: 'Platinum', ar: 'بلاتيني' },
        { min: 2, icon: '⭐', en: 'Gold',     ar: 'ذهبي' },
        { min: 1, icon: '🥈', en: 'Silver',   ar: 'فضي' },
        { min: 0, icon: '🥉', en: 'Bronze',   ar: 'برونزي' },
      ];
      const lv = levels.find(l => totalFreeEver >= l.min);
      document.getElementById('hero-stat-stamps').textContent = available;
      document.getElementById('hero-stat-free').textContent = freeDrinks;
      document.getElementById('hero-stat-visits').textContent = visits;
      const chip = document.getElementById('profile-tier-chip');
      document.getElementById('profile-tier-icon').textContent = lv.icon;
      document.getElementById('profile-tier-name').textContent = isAr ? lv.ar : lv.en;
      chip.style.display = 'inline-flex';
    } catch (e) { console.warn('[hero-stats] stamps fetch failed', e); }
    try {
      const r2 = await fetch('/api/customers/me', { headers: authHeader() });
      if (!r2.ok) return;
      const me = await r2.json();
      document.getElementById('hero-stat-orders').textContent = (me.orders || []).length;
    } catch (e) { console.warn('[hero-stats] me fetch failed', e); }
  }

  function closeProfileModal(e) {
    if (e && e.target !== document.getElementById('profile-overlay')) return;
    document.getElementById('profile-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function switchProfileTab(tab) {
    ['orders','stamps','favs','reservations'].forEach(t => {
      document.getElementById('ptab-'+t).classList.toggle('active', t === tab);
      document.getElementById('ppane-'+t).classList.toggle('active', t === tab);
    });
    if (tab === 'stamps') loadStamps();
    if (tab === 'reservations') loadMyReservations();
  }

  async function loadMyReservations() {
    if (!window.authState.token) return;
    const el = document.getElementById('my-reservations-list');
    const isAr = document.getElementById('html-root').lang === 'ar';
    el.innerHTML = `<div style="color:var(--text-soft);font-size:0.85rem;text-align:center;padding:32px 0;">
      <span class="en">Loading…</span><span class="ar">جارٍ التحميل…</span>
    </div>`;
    try {
      const res = await fetch('/api/customers/reservations', { headers: authHeader() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.length) {
        el.innerHTML = `<div style="color:var(--text-soft);font-size:0.85rem;text-align:center;padding:32px 0;">
          <span class="en">No reservations yet</span><span class="ar">لا توجد حجوزات بعد</span>
        </div>`;
        return;
      }
      const statusEn = { pending:'Pending', confirmed:'Confirmed', cancelled:'Cancelled', completed:'Completed' };
      const statusAr = { pending:'قيد الانتظار', confirmed:'مؤكد', cancelled:'ملغي', completed:'اكتمل' };
      const statusColor = { pending:'#f59e0b', confirmed:'#367d4d', cancelled:'#e53e3e', completed:'#27ae60' };
      const areaEn = { floor_1:'Floor 1', floor_2:'Floor 2', study_room:'Study Room' };
      const areaAr = { floor_1:'الطابق الأول', floor_2:'الطابق الثاني', study_room:'غرفة الدراسة' };
      el.innerHTML = data.map(r => {
        const color = statusColor[r.status] || '#888';
        const label = isAr ? (statusAr[r.status] || r.status) : (statusEn[r.status] || r.status);
        const dateStr = new Date(r.date).toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric', numberingSystem: 'latn' });
        return `<div style="background:var(--card-bg,#fff);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span dir="ltr" style="font-weight:800;font-size:0.95rem;unicode-bidi:plaintext;">${dateStr} — ${r.time}</span>
            <span style="background:${color}22;color:${color};border-radius:20px;padding:2px 10px;font-size:0.75rem;font-weight:800;">${label}</span>
          </div>
          <div style="font-size:0.83rem;color:var(--text-soft);">
            👥 <span dir="ltr" style="unicode-bidi:plaintext;">${r.party_size}</span> <span class="en">guests</span><span class="ar">أشخاص</span>
            ${r.table_num ? ` · 📍 ${isAr ? (areaAr[r.table_num] || r.table_num) : (areaEn[r.table_num] || r.table_num)}` : ''}
            ${r.notes ? `<br>📝 ${r.notes}` : ''}
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      console.warn('[my-reservations] fetch failed', e);
      el.innerHTML = `<div style="color:var(--red);font-size:0.85rem;text-align:center;padding:16px 0;">
        <span class="en">Failed to load</span><span class="ar">فشل التحميل</span>
      </div>`;
    }
  }

  async function loadProfileData() {
    if (!window.authState.token) return;
    try {
      const res = await fetch('/api/customers/me', { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      renderOrderHistory(data.orders);
    } catch (e) { console.warn('[profile] me fetch failed', e); }
    if (typeof renderFavsList === 'function') renderFavsList();
  }

  async function loadStamps() {
    if (!window.authState.token) return;
    try {
      const res = await fetch('/api/customers/stamps', { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      renderStamps(data);
    } catch (e) { console.warn('[stamps] fetch failed', e); }
  }

  function renderStamps(data) {
    const el = document.getElementById('stamps-content');
    const l = document.getElementById('html-root').lang;
    const isAr = l === 'ar';
    const { total_earned, total_redeemed, available, history } = data;

    // Progress within current set of 9
    const progress = available % 9;
    const freeDrinks = Math.floor(available / 9);

    // All-time stats (never reset)
    const totalFreeEver = Math.floor(total_redeemed / 9);
    const levels = [
      { min: 5,  icon: '👑', en: 'Legend',   ar: 'أسطوري' },
      { min: 3,  icon: '💎', en: 'Platinum', ar: 'بلاتيني' },
      { min: 2,  icon: '⭐', en: 'Gold',     ar: 'ذهبي' },
      { min: 1,  icon: '🥈', en: 'Silver',   ar: 'فضي' },
      { min: 0,  icon: '🥉', en: 'Bronze',   ar: 'برونزي' },
    ];
    const lv = levels.find(l => totalFreeEver >= l.min);
    const lvName = isAr ? lv.ar : lv.en;
    const nextLv = levels.slice().reverse().find(l => l.min > totalFreeEver);
    const nextMsg = nextLv
      ? (isAr ? `${nextLv.min - totalFreeEver} أكواب حتى ${nextLv.ar} ${nextLv.icon}` : `${nextLv.min - totalFreeEver} more to ${nextLv.en} ${nextLv.icon}`)
      : (isAr ? 'أعلى مستوى! 🎉' : 'Max level reached! 🎉');

    // Build 9 stamp dots + 1 free slot (10 total)
    let dots = '';
    for (let i = 0; i < 9; i++) {
      if (i < progress) {
        dots += `<div class="stamp-dot filled">☕</div>`;
      } else {
        dots += `<div class="stamp-dot"></div>`;
      }
    }
    // 10th slot: Free!
    if (progress === 0 && freeDrinks > 0) {
      dots += `<div class="stamp-dot free">🎁</div>`;
    } else {
      dots += `<div class="stamp-dot free" style="opacity:${progress === 0 ? 0.3 : Math.min(progress/9*0.7+0.3, 1)}">Free!</div>`;
    }

    const histHtml = (history && history.length) ? history.map(h => {
      const d = new Date(h.created_at).toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { numberingSystem: 'latn' });
      let icon, label, cls;
      if (h.type === 'earn') {
        icon = '☕'; cls = 'earn';
        label = isAr ? `+${h.amount} طابع` : `+${h.amount} stamp`;
      } else if (h.type === 'birthday') {
        icon = '🎂'; cls = 'earn';
        label = isAr ? `🎂 +${h.amount} طابع عيد الميلاد` : `🎂 +${h.amount} Birthday bonus`;
      } else {
        icon = '🎁'; cls = 'redeem';
        label = isAr ? `استُخدم مشروب مجاني` : `Free drink redeemed`;
      }
      return `<div class="stamp-history-item">
        <div class="stamp-history-icon ${cls}">${icon}</div>
        <div style="flex:1"><div style="font-weight:700">${label}</div><div style="color:var(--text-soft);font-size:0.75rem">${d}</div></div>
      </div>`;
    }).join('') : `<div style="color:var(--text-soft);text-align:center;padding:16px 0;font-size:0.82rem">${isAr ? 'لا سجل بعد' : 'No history yet'}</div>`;

    el.innerHTML = `
      <div class="stamp-card">
        <div class="stamp-card-title">${isAr ? 'بطاقة المكافآت' : 'Loyalty Stamps'}</div>
        <div class="stamp-level-badge">
          <span class="stamp-level-icon">${lv.icon}</span>
          <span>${lvName}</span>
        </div>
        <div class="stamp-card-sub" style="margin-bottom:14px">${isAr ? '9 طوابع = مشروب مجاني' : '9 stamps = 1 free drink'}</div>
        <div class="stamp-grid">${dots}</div>
        <div class="stamp-progress-bar">
          <div class="stamp-progress-fill" style="width:${Math.round(progress / 9 * 100)}%"></div>
        </div>
        <div class="stamp-count-row">
          <span>${progress}/9</span>
          ${freeDrinks > 0 ? `<span style="font-weight:800;color:#ffe57f">🎁 ${freeDrinks} ${isAr ? 'مشروب مجاني!' : 'free drink!'}</span>` : ''}
          <span style="opacity:0.6;font-size:0.7rem">${nextMsg}</span>
        </div>
        <div class="stamp-stats-row">
          <div class="stamp-stat-item">
            <div class="stamp-stat-num">${total_earned}</div>
            <div class="stamp-stat-label">${isAr ? 'إجمالي الطوابع' : 'Total Stamps'}</div>
          </div>
          <div class="stamp-stat-item">
            <div class="stamp-stat-num">${totalFreeEver}</div>
            <div class="stamp-stat-label">${isAr ? 'مشروبات مجانية' : 'Free Drinks'}</div>
          </div>
          <div class="stamp-stat-item">
            <div class="stamp-stat-num">${total_earned + totalFreeEver}</div>
            <div class="stamp-stat-label">${isAr ? 'إجمالي الزيارات' : 'Total Visits'}</div>
          </div>
        </div>
      </div>
      ${freeDrinks > 0 ? `<div style="background:#fff3cd;border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;font-size:0.85rem;font-weight:700;color:#856404;text-align:center;">
        🎁 ${isAr ? `لديك ${freeDrinks} مشروب مجاني! أخبر الكاشير عند طلبك` : `You have ${freeDrinks} free drink! Tell the cashier when ordering`}
      </div>` : ''}
      <div style="font-size:0.78rem;font-weight:800;color:var(--text-soft);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">${isAr ? 'السجل' : 'History'}</div>
      ${histHtml}
    `;
  }

  function renderOrderHistory(orders) {
    const el = document.getElementById('order-history-list');
    const l = document.getElementById('html-root').lang;
    if (!orders || orders.length === 0) {
      el.innerHTML = `<div style="text-align:center;padding:32px 0;color:var(--text-soft);font-size:0.85rem;">
        ${l==='ar' ? 'لا طلبات بعد' : 'No orders yet'}
      </div>`;
      return;
    }
    const statusLabel = { new: l==='ar'?'جديد':'New', making: l==='ar'?'يُحضَّر':'Preparing', done: l==='ar'?'جاهز':'Done', cancelled: l==='ar'?'ملغي':'Cancelled' };
    el.innerHTML = orders.map(o => {
      const date = new Date(o.timestamp).toLocaleDateString(l==='ar'?'ar-IQ':'en-GB', { numberingSystem: 'latn' });
      const items = o.items.map(i => `${i.emoji} ${l==='ar'?(i.nameAr||i.name):i.name} ×${i.qty}`).join(', ');
      return `<div class="order-history-card ${o.status}">
        <div class="oh-header">
          <span class="oh-num">#${o.num}</span>
          <span class="oh-status ${o.status}">${statusLabel[o.status]||o.status}</span>
        </div>
        <div class="oh-items">${items}</div>
        <div class="oh-meta">
          <span>${date}</span>
          <span class="oh-total">${o.total.toLocaleString()} IQD</span>
        </div>
      </div>`;
    }).join('');
  }

  // Expose to global scope (inline onclick + cross-module callers)
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.switchProfileTab = switchProfileTab;
  window.loadHeroStats = loadHeroStats;
  window.loadProfileData = loadProfileData;
  window.loadStamps = loadStamps;
  window.loadMyReservations = loadMyReservations;
  window.renderStamps = renderStamps;
  window.renderOrderHistory = renderOrderHistory;
})();
