/* ── XSS helper ── */
function esc(s){ return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

/* ── Auth ── */
let cashierToken = localStorage.getItem('cashierToken') || '';
let cashierRole  = localStorage.getItem('cashierRole')  || 'cashier';
let _sseConn = null, _sseDelay = 2000;

/* ── Online order state ── */
if(!window.MK_DATA) window.MK_DATA = {};
if(!MK_DATA.ONLINE_ORDERS) MK_DATA.ONLINE_ORDERS = [];
const _selfOrderIds = new Set();

/* ── Web Audio beep (no asset dependency) ── */
let _audioCtx = null;
function _ensureAudio(){
  if(_audioCtx) return _audioCtx;
  try { _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(_){ _audioCtx=null; }
  return _audioCtx;
}
function playOrderBeep(){
  const ctx = _ensureAudio(); if(!ctx) return;
  if(ctx.state==='suspended'){ try{ ctx.resume(); }catch(_){} }
  const now = ctx.currentTime;
  [0, 0.18].forEach((offset)=>{
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(880, now+offset);
    osc.frequency.exponentialRampToValueAtTime(1320, now+offset+0.12);
    gain.gain.setValueAtTime(0.0001, now+offset);
    gain.gain.exponentialRampToValueAtTime(0.35, now+offset+0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now+offset+0.16);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now+offset); osc.stop(now+offset+0.18);
  });
}
// Resume audio on first interaction (browser autoplay policy)
window.addEventListener('click', ()=>{ _ensureAudio(); if(_audioCtx?.state==='suspended') _audioCtx.resume(); }, { once:true });

function cashierHeaders(extra = {}){ return { 'x-cashier-token': cashierToken, ...extra }; }

async function doLogin(){
  const name = document.getElementById('loginName').value.trim();
  const pw   = document.getElementById('loginPw').value.trim();
  if(!name || !pw) return;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = '…';
  try {
    const r = await fetch('/api/cashier/login',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name, password:pw})
    });
    const d = await r.json();
    if(!r.ok){ document.getElementById('loginErr').textContent = d.error||'Invalid credentials'; return; }
    cashierToken = d.token;
    cashierRole  = d.role || 'cashier';
    localStorage.setItem('cashierToken', cashierToken);
    localStorage.setItem('cashierRole',  cashierRole);
    if (d.must_change_pw) localStorage.setItem('must_change_pw', '1');
    else                  localStorage.removeItem('must_change_pw');
    document.getElementById('loginOverlay').classList.add('hidden');
    // Update user badge
    const uname = d.name || name;
    document.getElementById('tb-username').childNodes[0].textContent = uname;
    document.getElementById('tb-av').textContent = uname.charAt(0).toUpperCase();
    afterLogin();
  } catch(e){
    document.getElementById('loginErr').textContent = 'Network error';
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

function doLogout(){
  if(!confirm('Sign out?')) return;
  // best-effort server-side logout (writes audit_log entry); ignore failure.
  try {
    fetch('/api/cashier/logout', { method:'POST', headers:{ 'x-cashier-token': cashierToken } });
  } catch(_){}
  localStorage.removeItem('cashierToken');
  localStorage.removeItem('cashierRole');
  localStorage.removeItem('must_change_pw');
  cashierToken = '';
  cashierRole  = 'cashier';
  if(_sseConn){ try{_sseConn.close();}catch(_){} _sseConn=null; }
  location.reload();
}

async function checkAuth(){
  if(!cashierToken){ showLoginOverlay(); return false; }
  try {
    const r = await fetch('/api/orders?date=2000-01-01', {headers:cashierHeaders()});
    if(r.status===401){ localStorage.removeItem('cashierToken'); cashierToken=''; showLoginOverlay(); return false; }
    return true;
  } catch(_){ return false; }
}

function showLoginOverlay(){
  document.getElementById('loginOverlay').classList.remove('hidden');
}

/* ── SSE ── */
async function connectSSE(){
  if(_sseConn){ try{_sseConn.close();}catch(_){} _sseConn=null; }
  if(!cashierToken){ setOnlineStatus(false); return; }
  let ticket = '';
  try {
    const r = await fetch('/api/orders/stream-ticket', {
      method: 'POST',
      headers: { 'X-Cashier-Token': cashierToken }
    });
    if(!r.ok){ throw new Error('ticket failed'); }
    const j = await r.json();
    ticket = j.ticket || '';
  } catch(_) {
    setOnlineStatus(false);
    _sseDelay = Math.min(_sseDelay*1.5, 30000);
    setTimeout(connectSSE, _sseDelay);
    return;
  }
  const es = new EventSource('/api/orders/stream?ticket='+encodeURIComponent(ticket));
  _sseConn = es;
  es.onopen = () => { _sseDelay = 2000; setOnlineStatus(true); };
  es.onmessage = ev => {
    try {
      const data = JSON.parse(ev.data);
      if(data.type==='order_updated' && (data.order && data.order.status==='done')){
        scheduleInvRefresh();
      }
      if(data.type==='order_refunded'){
        scheduleInvRefresh();
      }
      if(data.type==='new_order'||data.type==='order_updated'){
        const o = data.order || data;
        // Push into KDS data
        const existing = MK_DATA.TXNS.find(t=>t.id===o.id);
        if(!existing && o.status==='new') {
          MK_DATA.TXNS.unshift({
            id:o.id, at:o.timestamp, type:o.type, status:'incoming',
            customerName: o.customer_name || null,
            customerPhone: o.customer_phone || null,
            orderNum: o.num || null,
            lines: (o.items||[]).map(i=>({sku:i.sku||'', name:i.name||'', q:i.qty||i.q||1, mods:i.size?String(i.size):''}))
          });
          if(MK.STATE.view==='kitchen') MKV.renderKDS();
          updateKdsBadge();
          // Online orders: not from this cashier and pickup/take/deli
          const isSelf = _selfOrderIds.has(o.id);
          if(!isSelf && data.type==='new_order'){
            const exOnline = MK_DATA.ONLINE_ORDERS.find(x=>x.id===o.id);
            if(!exOnline){
              MK_DATA.ONLINE_ORDERS.unshift({
                id: o.id, num: o.num, at: o.timestamp,
                items: o.items||[], type: o.type, status: 'new',
                arrival_time: o.arrival_time, customer_name: o.customer_name,
                customer_phone: o.customer_phone, total: o.total
              });
              try { playOrderBeep(); } catch(_){}
              try { showOnlineFlash(o); } catch(_){}
              if(MK.STATE.view==='online' && MKV.renderOnlineOrders) MKV.renderOnlineOrders();
              updateOnlineBadge();
            }
          }
        }
      }
      if(data.type==='new_reservation'){
        const res = data.reservation || {};
        MK_DATA.RESERVATIONS.unshift({
          id:res.id, name:res.name, phone:res.phone,
          date:res.date, time:res.time, party:res.party_size,
          notes:res.notes||'', table_num:res.table_num||'', status:'pending'
        });
        if(MK.STATE.view==='reservations') MKV.renderReservations();
        updateResBadge(1);
        showResFlash(res);
      }
      // Sprint 2.6: real-time sold-out broadcast for v2 menu items.
      // Updates the in-memory cache so any view pulling from MK_DATA.MENU_V2
      // sees the new state immediately. Also fires a brief toast so the
      // cashier currently looking at the order screen knows.
      if(data.type==='menu_item_sold_out'){
        if(!MK_DATA.MENU_V2) MK_DATA.MENU_V2 = [];
        const found = MK_DATA.MENU_V2.find(m => m.id === data.id);
        if(found) found.sold_out = !!data.sold_out;
        // also maintain a quick lookup set used by hot paths
        if(!MK_DATA.MENU_V2_SOLDOUT) MK_DATA.MENU_V2_SOLDOUT = new Set();
        if(data.sold_out) MK_DATA.MENU_V2_SOLDOUT.add(data.id);
        else              MK_DATA.MENU_V2_SOLDOUT.delete(data.id);
        // notify
        const lbl = found
          ? ((MK.STATE?.lang === 'ar' ? (found.name_ar || found.name_en) : found.name_en) || ('#' + data.id))
          : ('#' + data.id);
        const txt = data.sold_out
          ? ((MK.STATE?.lang === 'ar' ? '⊘ نفد ' : '⊘ Sold out: ') + lbl)
          : ((MK.STATE?.lang === 'ar' ? '✓ متوفر ' : '✓ Back in stock: ') + lbl);
        if(typeof MK.toast === 'function') MK.toast(txt, data.sold_out ? 'warn' : 'ok');
        // broadcast a DOM event so any active view can re-render. Sprint 2.7
        // wires the order screen to listen for this.
        try { window.dispatchEvent(new CustomEvent('menu:sold_out_changed', { detail: { id: data.id, sold_out: !!data.sold_out } })); } catch(_){}
      }
    } catch(e){ console.warn('[sse] reservation message failed', e); }
  };
  es.onerror = () => {
    es.close(); _sseConn=null; setOnlineStatus(false);
    _sseDelay = Math.min(_sseDelay*1.5, 30000);
    setTimeout(connectSSE, _sseDelay);
  };
}

function setOnlineStatus(online){
  const el = document.getElementById('tb-status');
  if(el) el.className = 'tb-chip' + (online ? ' online' : ' offline');
}

/* ── Res flash ── */
const RES_AREA_LABEL = { floor_1: 'Floor 1', floor_2: 'Floor 2', study_room: 'Study Room' };
function showResFlash(res){
  document.getElementById('res-flash-name').textContent = res.name||'';
  document.getElementById('res-flash-datetime').textContent = (res.date||'')+(res.time?' '+res.time:'');
  const areaEl = document.getElementById('res-flash-area');
  if(areaEl) areaEl.textContent = res.table_num ? `📍 ${RES_AREA_LABEL[res.table_num] || res.table_num}` : '';
  const f = document.getElementById('res-flash');
  f.style.display = 'block';
  requestAnimationFrame(()=>{ f.classList.add('show'); });
  setTimeout(hideResFlash, 8000);
}
function hideResFlash(){
  const f = document.getElementById('res-flash');
  f.classList.remove('show');
  setTimeout(()=>{ f.style.display='none'; }, 300);
}

/* ── Badge helpers ── */
function updateResBadge(delta){
  const b = document.getElementById('bdg-res');
  const n = Math.max(0,(parseInt(b.textContent)||0)+delta);
  b.textContent = n; b.style.display = n ? '' : 'none';
}
function updateKdsBadge(){
  const n = MK_DATA.TXNS.filter(t=>t.status==='incoming').length;
  const b = document.getElementById('bdg-kds');
  if(b){ b.textContent=n; b.style.display=n?'':'none'; }
}
function updateOnlineBadge(){
  const n = (MK_DATA.ONLINE_ORDERS||[]).filter(o=>o.status==='new').length;
  const b = document.getElementById('bdg-online');
  if(b){ b.textContent=n; b.style.display=n?'':'none'; }
  const c = document.getElementById('oo-ct');
  if(c) c.textContent = n;
}
function showOnlineFlash(o){
  let f = document.getElementById('online-flash');
  if(!f){
    f = document.createElement('div');
    f.id = 'online-flash';
    f.className = 'online-flash';
    document.body.appendChild(f);
  }
  const lang = MK?.STATE?.lang || 'ar';
  const labelMap = { ar:'طلب إنترنت جديد', en:'New online order' };
  const customer = o.customer_name || (lang==='ar'?'عميل':'Customer');
  f.innerHTML = '<div class="of-i">📱</div><div class="of-b"><div class="of-t">'+esc(labelMap[lang]||labelMap.en)+'</div><div class="of-s">'+esc(customer)+' · #'+esc(o.num||'')+'</div></div>';
  f.style.display='flex';
  requestAnimationFrame(()=>f.classList.add('show'));
  clearTimeout(f._timer);
  f._timer = setTimeout(()=>{
    f.classList.remove('show');
    setTimeout(()=>{ f.style.display='none'; }, 300);
  }, 6000);
}

/* ── Server menu sync ── */
async function syncMenuPrices(){
  try {
    const r = await fetch('/api/menu-prices', {headers:cashierHeaders()});
    if(!r.ok) return;
    const rows = await r.json();
    const map = {};
    rows.forEach(row=>{ map[row.menu_item]=row.selling_price; });
    MK_DATA.MENU.forEach(item=>{
      if(map[item.sku]) item.p = map[item.sku];
    });
  } catch(e){ console.warn('[syncMenuPrices] failed, prices may be stale', e); }
}

/* ── Server reservation sync ── */
async function syncReservations(){
  try {
    const r = await fetch('/api/reservations', {headers:cashierHeaders()});
    if(!r.ok) return;
    const rows = await r.json();
    MK_DATA.RESERVATIONS = rows.map(res=>({
      id:res.id, name:res.name, phone:res.phone||'',
      date:res.date, time:res.time, party:res.party_size||1,
      notes:res.notes||'', table_num:res.table_num||'', status:res.status||'pending'
    }));
    const pending = rows.filter(r=>r.status==='pending').length;
    const b = document.getElementById('bdg-res');
    if(b){ b.textContent=pending; b.style.display=pending?'':'none'; }
  } catch(e){ console.warn('[syncReservations] failed', e); }
}

/* ── Patch finishPay: POST /api/orders FIRST, then run local flow ── */
function patchFinishPay(){
  const _orig = MKO.finishPay.bind(MKO);
  let _busy = false;
  MKO.finishPay = async function(){
    if(_busy) return;
    _busy = true;
    // Snapshot before local state clears
    const tot = MK.cartTotals();
    const cart = MK.STATE.cart || [];
    if(!cart.length){ _busy = false; return _orig(); }
    const items = cart.map(c=>({
      key:c.sku||c.n||c.name, name:c.n||c.name, qty:c.q,
      price:c.p||c.price, sku:c.sku||'', note:c.note||'',
      opts:c.opts||null, modsLabel:c.modsLabel||[]
    }));
    const type = MK.STATE.order?.type || 'dine';
    const tableNum = MK.STATE.order?.table || null;
    const cust = MK.STATE.order?.customer;
    const payMethod = (MK.STATE.pay && MK.STATE.pay.method) || 'cash';

    // Sprint 1.5: discount permission gating. If a discount is on the cart,
    // include discount_kind/value so server can validate. On 403 we trigger
    // the manager-approval modal and retry inline.
    const discountKind  = MK.STATE.order?.discountKind  || null;
    const discountValue = (discountKind === 'fixed')
      ? Number(MK.STATE.order?.discountFixedAmt) || 0
      : Number(MK.STATE.order?.discountValue) || 0;
    const hasDiscount = discountKind && discountValue > 0;

    const submitOrder = async (managerOverride) => {
      return await fetch('/api/orders', {
        method:'POST',
        headers:cashierHeaders({'Content-Type':'application/json'}),
        body:JSON.stringify({
          type, items,
          tableNum,
          total: tot.total,
          subtotal: tot.sub,
          tax: tot.tax,
          discount: tot.disc || 0,
          discount_kind:  hasDiscount ? discountKind  : undefined,
          discount_value: hasDiscount ? discountValue : undefined,
          manager_override: managerOverride || undefined,
          payment: payMethod,
          customerPhone: cust?.phone || undefined,
          customerName: cust?.name_en || cust?.name_ar || cust?.name || undefined,
          source: 'cashier'
        })
      });
    };

    try {
      let res = await submitOrder(MK.STATE.order?.discountManagerOverride || null);
      if (res.status === 403 && hasDiscount) {
        const err = await res.json().catch(()=>({}));
        if (err.error === 'permission_denied') {
          if (!window.MKS?.requireManagerOverride) {
            if(typeof MK.toast === 'function') MK.toast('Manager approval required (module not loaded)', 'err');
            _busy = false; return;
          }
          let hint;
          if (err.reason === 'limit_exceeded')
            hint = `${err.kind === 'fixed' ? err.value+' IQD' : err.value+'%'} exceeds your limit (${err.actor_limit}${err.kind==='fixed'?' IQD':'%'})`;
          else if (err.reason === 'daily_count_exceeded')
            hint = `Daily discount count limit reached (${err.today_count}/${err.daily_limit})`;
          else
            hint = 'Discount requires manager approval';
          const ok = await window.MKS.requireManagerOverride(err.missing || 'discount_percent', hint);
          if (!ok) { _busy = false; return; }
          MK.STATE.order.discountManagerOverride = ok;
          res = await submitOrder(ok);
        }
      }
      if(!res.ok){
        const errBody = await res.json().catch(()=>({}));
        const msg = errBody.error
          ? '⚠️ ' + errBody.error
          : ((MK.STATE.lang==='ar') ? '⚠️ فشل تسجيل الطلب على الخادم. لم يتم إتمام الدفع.' : '⚠️ Server failed to record order. Payment NOT completed.');
        if(typeof MK.toast === 'function') MK.toast(msg, 'err'); else alert(msg);
        _busy = false;
        return;
      }
      try {
        const j = await res.json();
        if(j?.order?.id) _selfOrderIds.add(j.order.id);
      } catch(e){ console.warn('[finishPay] order JSON parse failed', e); }
    } catch(err){
      const msg = (MK.STATE.lang==='ar') ? '⚠️ خطأ في الشبكة. لم يتم تسجيل الطلب.' : '⚠️ Network error. Order NOT recorded. Try again.';
      if(typeof MK.toast === 'function') MK.toast(msg, 'err'); else alert(msg);
      _busy = false;
      return;
    }

    // Server confirmed — run local finish (prints receipt, clears cart)
    try { _orig(); } finally { _busy = false; }
  };
}

/* ── No-show auto-cancel (30 min past arrival_time on pickup) ── */
async function checkNoShowTimer(){
  const list = MK_DATA.ONLINE_ORDERS || [];
  const now = Date.now();
  const NS_MS = 30 * 60 * 1000;
  for(const o of list){
    if(o.status !== 'new') continue;
    if(o.type !== 'pickup') continue;
    if(!o.arrival_time) continue;
    const arrivalMs = new Date(o.arrival_time).getTime();
    if(isNaN(arrivalMs)) continue;
    if(now - arrivalMs <= NS_MS) continue;
    if(o._cancelling) continue;
    o._cancelling = true;
    try {
      const r = await fetch('/api/orders/'+encodeURIComponent(o.id)+'/status', {
        method:'PUT',
        headers: cashierHeaders({'Content-Type':'application/json'}),
        body: JSON.stringify({ status:'cancelled' })
      });
      if(r.ok){
        o.status = 'cancelled';
        const tx = MK_DATA.TXNS.find(t=>t.id===o.id);
        if(tx) tx.status = 'cancelled';
        const msg = (MK.STATE?.lang==='ar') ? '⏰ تم إلغاء طلب لم يحضر' : '⏰ No-show auto-cancelled';
        if(typeof MK.toast === 'function') MK.toast(msg, 'warn');
        if(MK.STATE?.view==='online' && MKV.renderOnlineOrders) MKV.renderOnlineOrders();
        if(MK.STATE?.view==='kitchen') MKV.renderKDS();
        updateOnlineBadge(); updateKdsBadge();
      } else {
        o._cancelling = false;
      }
    } catch(_){ o._cancelling = false; }
  }
}

/* ── Post-login init ── */
function applyRoleVisibility(){
  const isManager = cashierRole === 'manager' || cashierRole === 'owner';
  const isOwner   = cashierRole === 'owner';
  document.querySelectorAll('[data-v="inventory"],[data-v="reports"]').forEach(el => {
    el.style.display = isManager ? '' : 'none';
  });
  document.querySelectorAll('[data-v="settings"]').forEach(el => {
    el.style.display = isOwner ? '' : 'none';
  });
  const role = document.getElementById('tb-user-role');
  if(role) role.textContent = (cashierRole || 'cashier').toUpperCase();
}

async function syncOnlineOrders(){
  try {
    const today = new Date();
    const y = today.getFullYear(), m = String(today.getMonth()+1).padStart(2,'0'), d = String(today.getDate()).padStart(2,'0');
    const r = await fetch('/api/orders?date='+y+'-'+m+'-'+d+'&status=new', {headers:cashierHeaders()});
    if(!r.ok) return;
    const rows = await r.json();
    MK_DATA.ONLINE_ORDERS = rows
      .filter(o => o.type === 'pickup' || o.type === 'take' || o.type === 'deli')
      .map(o => ({
        id: o.id, num: o.num, at: o.timestamp,
        items: o.items||[], type: o.type, status: 'new',
        arrival_time: o.arrival_time, customer_name: o.customer_name,
        customer_phone: o.customer_phone, total: o.total
      }));
    updateOnlineBadge();
  } catch(e){ console.warn('[syncOnlineOrders] failed', e); }
}

async function afterLogin(){
  document.querySelector('.pos-root').classList.add('active');
  applyRoleVisibility();
  await syncMenuPrices();
  await syncReservations();
  await syncOnlineOrders();
  try { if (MK_DATA.loadInventory) await MK_DATA.loadInventory(cashierHeaders()); } catch(e){ console.warn('[afterLogin] loadInventory failed', e); }
  // Sprint 2.7: pull DB-backed menu (categories, items, modifier groups, sets).
  // Failure leaves V2 arrays empty → order view falls back to legacy hardcoded MENU.
  try { if (MK_DATA.loadPublicMenu) await MK_DATA.loadPublicMenu(cashierHeaders()); } catch(e){ console.warn('[afterLogin] loadPublicMenu failed', e); }
  connectSSE();
  MKApp.init();
  // Sprint 1: settings module init (gates settings tab + force-change-pw modal).
  if (window.MKS) { try { await MKS.init(); } catch(e){ console.warn('[afterLogin] MKS.init failed', e); } }
}

let _invRefreshTimer = null;
function scheduleInvRefresh(){
  if (_invRefreshTimer) return;
  _invRefreshTimer = setTimeout(async ()=>{
    _invRefreshTimer = null;
    try {
      if (MK_DATA.loadInventory) await MK_DATA.loadInventory(cashierHeaders());
      if (MK.STATE.view === 'inventory' && MKV.renderInv) MKV.renderInv();
    } catch(e){ console.warn('[invRefresh] loadInventory failed', e); }
  }, 400);
}

/* ── BOOTSTRAP ── */
window.MKApp = (function(){
  const {STATE, t, applyLang} = MK;

  function nav(view){
    STATE.view = view;
    document.querySelectorAll('.view').forEach(el=>el.classList.add('hidden'));
    const el = document.getElementById('v-'+view);
    if(el) el.classList.remove('hidden');
    document.querySelectorAll('.sbn').forEach(b=>b.classList.toggle('on', b.dataset.v===view));
    if(view==='tables')       MKV.renderTables();
    else if(view==='kitchen') MKV.renderKDS();
    else if(view==='online')  { if(MKV.renderOnlineOrders) MKV.renderOnlineOrders(); }
    else if(view==='inventory')   MKV.renderInv();
    else if(view==='reservations') MKV.renderReservations();
    else if(view==='customers')    MKV.renderCustomers();
    else if(view==='reports')      MKV.renderReports();
    else if(view==='settings')     { if(window.MKS) MKS.open(); }
    else if(view==='order')        {
      // Sprint 2.7: pull a fresh menu snapshot when entering the order view so
      // changes made in Settings (categories, items, modifier groups, sets,
      // sold-out toggles) appear without a page reload.
      (async () => {
        try { if (MK_DATA.loadPublicMenu) await MK_DATA.loadPublicMenu(cashierHeaders()); } catch(_){}
        MKO.refresh();
      })();
    }
  }

  function setLang(l){
    STATE.lang = l;
    applyLang();
    document.querySelectorAll('.tb-lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));
    applyI18n();
    MKO.refresh();
    MKV.renderTables(); MKV.renderKDS(); MKV.renderInv();
    MKV.renderReservations(); MKV.renderCustomers(); MKV.renderReports();
  }

  function applyI18n(){
    document.querySelectorAll('[data-i]').forEach(el=>{
      const k=el.dataset.i; const v=t(k); if(v!==k) el.textContent=v;
    });
    const si=document.getElementById('search-in');
    if(si) si.placeholder=t('search');
    const oi=document.getElementById('tb-online-lbl');
    if(oi) oi.textContent=t('online');
    const sy=document.getElementById('tb-sync-lbl');
    if(sy) sy.textContent=t('sync');
  }

  function tick(){
    const d=new Date();
    const el=document.getElementById('tb-clock');
    if(el) el.textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
    const tvt=document.getElementById('tv-time');
    if(tvt) tvt.textContent=MK.fmtDateTime?.(d.toISOString())||d.toLocaleTimeString();
  }

  function syncNow(){ MKO.toast('↻ '+t('sync')+' ✓','ok'); MK.audit?.('sync.manual',null); }

  function init(){
    patchFinishPay();
    MK.seedRuntime?.();
    applyLang();
    applyI18n();
    MKO.init();
    tick(); setInterval(tick, 1000);
    setInterval(()=>{ if(STATE.view==='kitchen') MKV.renderKDS(); }, 30000);
    // Online orders refresh + no-show auto-cancel (30 min past arrival)
    setInterval(()=>{
      if(STATE.view==='online' && MKV.renderOnlineOrders) MKV.renderOnlineOrders();
      checkNoShowTimer();
    }, 30000);
    MKO.toast('✓ Mr. Kim\'s POS · Ready','ok');
  }

  return { nav, setLang, syncNow, init };
})();

/* ── Startup ── */
document.addEventListener('DOMContentLoaded', async()=>{
  const ok = await checkAuth();
  if(ok) afterLogin();
});
