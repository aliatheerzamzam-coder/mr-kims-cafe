/* ============================================================
   Mr. Kim's POS — Order + Cart + Options + Payment
   ============================================================ */

(function(){
  const {STATE, t, itemName, fmtIQD, fmtNum, cartTotals, lineTotal,
         isOutOfStock, stockStatus, consumeIngredients, printReceipt, printKitchen, audit, fmtDateTime} = MK;
  const {CATS, OPTIONS, MENU, CUSTOMERS, applicableOptions} = MK_DATA;

  // ---------- RENDER ORDER VIEW ----------
  let activeCat = 'all';
  let searchQ = '';

  function renderCats(){
    const el = document.getElementById('cats-strip');
    const total = MENU.length;
    const html = [{k:'all',i:'⭐',ct:total}, ...CATS.map(c=>({...c,ct:MENU.filter(m=>m.c===c.k).length}))]
      .map(c=>{
        const nm = c.k==='all' ? t('all') : (c[STATE.lang]||c.en);
        return `<button class="cat-b ${c.k===activeCat?'on':''}" onclick="MKO.setCat('${c.k}')">
          <span>${c.i}</span>${nm}<span class="ct">${c.ct}</span></button>`;
      }).join('');
    el.innerHTML = html;
  }

  function renderGrid(){
    const el = document.getElementById('pgrid');
    let list = activeCat==='all' ? MENU : MENU.filter(m=>m.c===activeCat);
    if(searchQ){
      const q = searchQ.toLowerCase();
      list = list.filter(m=>
        m.en.toLowerCase().includes(q) ||
        m.ar.includes(q) ||
        (m.ko||'').includes(q) ||
        m.sku.toLowerCase().includes(q)
      );
    }
    el.innerHTML = list.map(it=>{
      const out = isOutOfStock(it);
      const classes = ['pc', it.low?'low':'', out?'out':''].filter(Boolean).join(' ');
      const flag = it.hot?'<span class="flg">🔥</span>':it.new?'<span class="flg new">NEW</span>':'';
      const click = out ? '' : `onclick="MKO.openOpts('${it.sku}')"`;
      return `<div class="${classes}" ${click} data-low="${t('low')}" data-out="${t('outStock')}">
        <span class="sku">${it.sku}</span>${flag}
        <div class="pic">${it.e}</div>
        <div class="pn">${itemName(it)}</div>
        <div class="pp">${fmtNum(it.p)}</div>
      </div>`;
    }).join('');
  }

  function setCat(k){ activeCat = k; renderCats(); renderGrid(); }
  function setSearch(v){ searchQ = v; renderGrid(); }

  // ---------- RENDER CART ----------
  function renderCart(){
    const L = document.getElementById('lines');
    if(!STATE.cart.length){
      L.innerHTML = `<div class="empty"><div class="eb">🧾</div><div class="et">${t('emptyCart')}</div><div class="es">${t('tapToAdd')}</div></div>`;
    } else {
      L.innerHTML = STATE.cart.map((c,i)=>{
        const mods = (c.modsLabel||[]).map(m=>`<span class="tag">${m}</span>`).join('');
        return `<div class="line">
          <div class="le">${c.e}</div>
          <div class="lm">
            <div class="ln">${c.name}</div>
            <div class="lo">${mods}<span>${fmtNum(c.price)} × ${c.q}</span></div>
          </div>
          <div class="lx">
            <div class="lp">${fmtNum(c.price*c.q)}</div>
            <div class="qstep">
              <button onclick="MKO.lineQ(${i},-1)">−</button>
              <span class="q">${c.q}</span>
              <button onclick="MKO.lineQ(${i},1)">＋</button>
              <button class="rm" onclick="MKO.removeLine(${i})" title="${t('remove')}">✕</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }
    updateTotals();
    renderCustomer();
    renderParked();
    // Order number + table in cart header
    document.getElementById('co-no').textContent = STATE.order.id;
  }

  function renderCustomer(){
    const c = STATE.order.customer;
    const el = document.getElementById('cust-slot');
    if(c){
      const nm = STATE.lang==='ar'?c.name_ar:c.name_en;
      el.classList.add('has');
      const init = nm.substring(0,1);
      el.innerHTML = `
        <div class="cav">${init}</div>
        <div class="cm">
          <div class="cn1">${nm}</div>
          <div class="cn2">${c.phone} · ${c.stamps}/10 🎁</div>
        </div>
        <span class="cst ${c.tier}">${t(c.tier.toLowerCase())}</span>`;
    } else {
      el.classList.remove('has');
      el.innerHTML = `
        <div class="cav">👤</div>
        <div class="cm">
          <div class="cn1">${t('guest')}</div>
          <div class="cn2">${t('addCustomer')}</div>
        </div>`;
    }
  }

  function renderParked(){
    const el = document.getElementById('parked-strip');
    if(!STATE.parked.length){ el.style.display='none'; return; }
    el.style.display='flex';
    el.innerHTML = `<span class="lbl">⏸ ${t('parkOrder')}:</span>` +
      STATE.parked.map(p=>`<span class="pk" onclick="MKO.resumeParked('${p.id}')">${p.id}·${p.table||'·'}·${p.cart.length}</span>`).join('');
  }

  function updateTotals(){
    const tot = cartTotals();
    document.getElementById('sub-v').textContent = fmtNum(tot.sub);
    document.getElementById('tax-v').textContent = fmtNum(tot.tax);
    document.getElementById('tot-v').textContent = fmtIQD(tot.total);
    document.getElementById('paybtn-amt').textContent = fmtIQD(tot.total);
    document.getElementById('paybtn').disabled = !STATE.cart.length;
    const dr = document.getElementById('disc-row');
    if(tot.disc){
      dr.style.display='flex';
      document.getElementById('disc-lbl').textContent = STATE.order.discountLabel || (STATE.order.discount*100+'%');
      document.getElementById('disc-v').textContent = '-'+fmtNum(tot.disc);
    } else dr.style.display='none';
  }

  // ---------- CART OPS ----------
  function lineQ(i,d){
    STATE.cart[i].q += d;
    if(STATE.cart[i].q<=0) STATE.cart.splice(i,1);
    renderCart(); MK.audit('cart.qty', {line:i, d});
  }
  function removeLine(i){ STATE.cart.splice(i,1); renderCart(); MK.audit('cart.remove',{line:i}); }

  // ---------- ORDER TYPE ----------
  function setOrderType(type){
    STATE.order.type = type;
    document.querySelectorAll('.otype button').forEach(b=>{
      b.classList.remove('on','dine','take','deli','pickup');
      if(b.dataset.t===type) b.classList.add('on', type);
    });
  }

  // ---------- OPTIONS MODAL ----------
  let editing = null;

  function openOpts(sku){
    const it = MENU.find(m=>m.sku===sku);
    if(!it) return;
    const apps = applicableOptions(it.c);
    // Build default opts
    const opts = {};
    apps.forEach(g=>{
      const def = OPTIONS[g].choices.find(c=>c.def);
      if(def) opts[g] = def.k;
    });
    if(it.c==='ice' && opts.temp) opts.temp = 'c';
    editing = {item:it, q:1, opts, apps};
    renderOptsModal();
    document.getElementById('opt-modal').classList.add('show');
  }

  function renderOptsModal(){
    const e = editing;
    const it = e.item;
    document.getElementById('opt-t').firstChild.textContent = itemName(it)+' ';
    document.getElementById('opt-s').textContent = it.sku+' · '+fmtIQD(it.p);
    const body = document.getElementById('opt-body');
    let html = '';
    e.apps.forEach(g=>{
      const grp = OPTIONS[g];
      html += `<div class="og"><div class="ol">${grp[STATE.lang]||grp.en}</div><div class="orow">${
        grp.choices.map(c=>{
          const label = c[STATE.lang]||c.en;
          const d = c.d>0?`+${fmtNum(c.d)}`:c.d<0?fmtNum(c.d):'';
          return `<button onclick="MKO.setOpt('${g}','${c.k}')" class="${e.opts[g]===c.k?'on':''}">${label}${d?'<small>'+d+'</small>':''}</button>`;
        }).join('')
      }</div></div>`;
    });
    if(!e.apps.length){
      html = `<div class="og"><div class="ol">${t('note')}</div>
        <textarea id="opt-note" placeholder="..." style="width:100%;padding:8px;border:1px solid #d7ded9;border-radius:6px;font-family:inherit;font-size:12px;min-height:60px;font-weight:600;resize:none"></textarea></div>`;
    }
    body.innerHTML = html;
    document.getElementById('opt-q').textContent = e.q;
    updateOptTotal();
  }

  function setOpt(g,k){
    editing.opts[g] = k;
    renderOptsModal();
  }
  function optQ(d){ editing.q = Math.max(1, editing.q+d); renderOptsModal(); }
  function calcOptPrice(){
    const e = editing;
    let p = e.item.p;
    Object.keys(e.opts).forEach(g=>{
      const c = OPTIONS[g]?.choices.find(x=>x.k===e.opts[g]);
      if(c) p += c.d;
    });
    return p;
  }
  function updateOptTotal(){
    document.getElementById('opt-tot').textContent = fmtIQD(calcOptPrice() * editing.q);
  }
  function closeOpts(){ document.getElementById('opt-modal').classList.remove('show'); editing=null; }
  function confirmOpts(){
    const e = editing;
    const price = calcOptPrice();
    // Build mods label
    const modsLabel = [];
    Object.keys(e.opts).forEach(g=>{
      const choice = OPTIONS[g].choices.find(c=>c.k===e.opts[g]);
      if(choice && !choice.def) modsLabel.push(choice[STATE.lang]||choice.en);
    });
    STATE.cart.push({
      sku: e.item.sku, e: e.item.e, name: itemName(e.item),
      price, q: e.q, opts:{...e.opts}, modsLabel
    });
    MK.audit('cart.add',{sku:e.item.sku, q:e.q});
    closeOpts();
    renderCart();
    toast('✓ '+itemName(e.item));
  }

  // ---------- CUSTOMER PICKER ----------
  function openCustomer(){
    const mb = document.getElementById('cust-modal');
    const body = document.getElementById('cust-modal-body');
    body.innerHTML = `
      <input type="text" id="cust-search" placeholder="${t('search')}"
        style="width:100%;height:34px;border:1px solid #c9d1cc;border-radius:6px;padding:0 10px;font-family:inherit;font-weight:700;margin-bottom:10px;outline:none" oninput="MKO.filterCust(this.value)"/>
      <div class="cust-list" id="cust-list"></div>
      <div style="margin-top:10px;text-align:center">
        <button class="ov-btn" onclick="MKO.clearCustomer()">✕ ${t('guest')}</button>
      </div>`;
    renderCustList(CUSTOMERS);
    mb.classList.add('show');
  }
  function renderCustList(list){
    const el = document.getElementById('cust-list');
    el.innerHTML = list.map(c=>{
      const nm = STATE.lang==='ar'?c.name_ar:c.name_en;
      return `<div class="cc-row" onclick="MKO.pickCustomer('${c.id}')">
        <div><div style="font-weight:800">${nm}</div><div class="phone">${c.phone}</div></div>
        <div><div style="font-weight:900;color:#367d4d;font-family:var(--mk-font-mono)">${c.stamps}/10</div>
        <span class="cst ${c.tier}" style="font-size:9px">${c.tier}</span></div>
      </div>`;
    }).join('');
  }
  function filterCust(q){
    q = q.toLowerCase();
    const f = CUSTOMERS.filter(c=>
      c.name_ar.includes(q) ||
      c.name_en.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.id.toLowerCase().includes(q));
    renderCustList(f);
  }
  function pickCustomer(id){
    STATE.order.customer = CUSTOMERS.find(c=>c.id===id);
    document.getElementById('cust-modal').classList.remove('show');
    renderCart();
    MK.audit('order.customer', {id});
  }
  function clearCustomer(){
    STATE.order.customer = null;
    document.getElementById('cust-modal').classList.remove('show');
    renderCart();
  }

  // ---------- ACTIONS ----------
  function newOrder(){
    STATE.cart = [];
    STATE.order.id = 'TX-'+String(parseInt(STATE.order.id.replace(/\D/g,''))+1).padStart(5,'0');
    STATE.order.customer = null;
    STATE.order.note = '';
    STATE.order.discount = 0;
    STATE.order.discountLabel = '';
    MK.audit('order.new', STATE.order.id);
    renderCart();
  }
  function parkOrder(){
    if(!STATE.cart.length){ toast(t('emptyCart'), 'warn'); return; }
    STATE.parked.push({
      id: STATE.order.id,
      table: STATE.order.table,
      customer: STATE.order.customer,
      cart:[...STATE.cart],
      parkedAt: new Date().toISOString()
    });
    MK.audit('order.park', STATE.order.id);
    toast('⏸ '+STATE.order.id);
    newOrder();
  }
  function resumeParked(id){
    const idx = STATE.parked.findIndex(p=>p.id===id);
    if(idx<0) return;
    const p = STATE.parked.splice(idx,1)[0];
    STATE.cart = [...p.cart];
    STATE.order.id = p.id;
    STATE.order.table = p.table;
    STATE.order.customer = p.customer;
    renderCart();
    MK.audit('order.resume', id);
  }
  function openDiscount(){
    const v = prompt(
      STATE.lang==='ar'?'نسبة الخصم % أو كود:\n• عدد → نسبة %\n• STUDENT → 15%\n• STAFF → 20%':
      'Discount % or code:\n• number → %\n• STUDENT → 15%\n• STAFF → 20%', '');
    if(!v) return;
    if(v.toUpperCase()==='STUDENT'){ STATE.order.discount=.15; STATE.order.discountLabel='STUDENT 15%'; }
    else if(v.toUpperCase()==='STAFF'){ STATE.order.discount=.20; STATE.order.discountLabel='STAFF 20%'; }
    else { const n = parseFloat(v); if(n>0&&n<=50){ STATE.order.discount=n/100; STATE.order.discountLabel=n+'%'; } }
    MK.audit('order.discount', STATE.order.discountLabel);
    renderCart();
  }
  function addNote(){
    const v = prompt(t('note'), STATE.order.note);
    if(v!==null){ STATE.order.note = v; toast('✓ '+t('note')); }
  }
  function splitBill(){
    toast(t('split')+' — 준비중', 'warn');
  }

  // ---------- PAYMENT ----------
  let pay = { method:'cash', received:0 };

  function openPay(){
    pay = { method:'cash', received:0 };
    const tot = cartTotals();
    document.getElementById('pay-due').textContent = fmtIQD(tot.total);
    document.getElementById('pay-received').textContent = '0 IQD';
    document.getElementById('pay-change').textContent = '0 IQD';
    document.getElementById('pay-change-row').classList.remove('warn');
    // Preselect cash
    document.querySelectorAll('.pay-opt').forEach(p=>{
      p.classList.toggle('on', p.dataset.p==='cash');
    });
    // Disable stamps if no customer or <10 stamps
    const stampOpt = document.querySelector('.pay-opt[data-p="stamp"]');
    const cust = STATE.order.customer;
    stampOpt.style.opacity = (cust && cust.stamps>=10) ? '1' : '.35';
    stampOpt.style.pointerEvents = (cust && cust.stamps>=10) ? 'auto' : 'none';
    document.getElementById('pay-modal').classList.add('show');
    updatePay();
  }
  function setPay(el){
    document.querySelectorAll('.pay-opt').forEach(p=>p.classList.remove('on'));
    el.classList.add('on');
    pay.method = el.dataset.p;
    // Card/ZainCash/Switch — auto-set received to exact due
    const due = cartTotals().total;
    if(['card','zain','switch'].includes(pay.method)){
      pay.received = due;
    } else if (pay.method==='stamp') {
      pay.received = due;
    } else {
      pay.received = 0;
    }
    updatePay();
  }
  function kpPress(k){
    if(pay.method!=='cash'){ toast(STATE.lang==='ar'?'اختر نقداً للكيباد':'Switch to cash to use keypad','warn'); return; }
    if(k==='c') pay.received = 0;
    else if(k==='bk') pay.received = Math.floor(pay.received/10);
    else if(k==='000') pay.received = parseInt((String(pay.received)+'000').slice(0,8))||0;
    else pay.received = parseInt((String(pay.received)+k).slice(0,8))||0;
    updatePay();
  }
  function kpQuick(amt){
    if(pay.method!=='cash'){ toast(STATE.lang==='ar'?'اختر نقداً للكيباد':'Switch to cash to use keypad','warn'); return; }
    pay.received += amt;
    updatePay();
  }
  function updatePay(){
    const due = cartTotals().total;
    const recv = pay.received;
    document.getElementById('pay-received').textContent = fmtIQD(recv);
    const change = recv - due;
    const cRow = document.getElementById('pay-change-row');
    const cEl = document.getElementById('pay-change');
    cEl.textContent = fmtIQD(Math.max(0,change));
    cRow.classList.toggle('warn', change<0 && pay.method==='cash');
    // Confirm button state
    const btn = document.getElementById('pay-confirm');
    btn.disabled = (pay.method==='cash' && recv<due);
  }
  function closePay(){ document.getElementById('pay-modal').classList.remove('show'); }
  function finishPay(){
    const tot = cartTotals();
    if(pay.method==='cash' && pay.received < tot.total){ toast(STATE.lang==='ar'?'المبلغ أقل':'Amount is less','err'); return; }
    // Consume inventory + collect low-stock items
    const lowItems = [];
    STATE.cart.forEach(l=>{
      consumeIngredients(l);
      const it = MK_DATA.MENU.find(m=>m.sku===l.sku);
      if(it && it.rec) Object.keys(it.rec).forEach(k=>{
        let key = k;
        if(l.opts && l.opts.milk==='oat' && k==='milk') key='oat_m';
        if(l.opts && l.opts.milk==='almond' && k==='milk') key='alm_m';
        if(l.opts && l.opts.milk==='no' && k==='milk') return;
        const inv = MK_DATA.INV.find(i=>i.k===key);
        if(inv && MK.stockStatus(inv)!=='good' && !lowItems.find(x=>x.k===key)) lowItems.push(inv);
      });
    });
    // Apply stamps
    if(STATE.order.customer){
      if(pay.method==='stamp'){
        STATE.order.customer.stamps = Math.max(0, STATE.order.customer.stamps-10);
      } else {
        STATE.order.customer.stamps = Math.min(10, STATE.order.customer.stamps + STATE.cart.reduce((s,l)=>s+l.q,0));
      }
      STATE.order.customer.visits += 1;
      STATE.order.customer.spent += tot.total;
    }
    // Build receipt object
    const PM = {cash:'CASH',card:'CARD',zain:'ZAINCASH',switch:'SWITCH',stamp:'STAMPS'}[pay.method];
    const rcpt = {
      id: STATE.order.id,
      at: new Date().toISOString(),
      type: STATE.order.type,
      table: STATE.order.table,
      cashier: STATE.user.name,
      customerId: STATE.order.customer?.id,
      customerPhone: STATE.order.customer?.phone,
      customerName: STATE.order.customer?.name_en || STATE.order.customer?.name_ar,
      lines: STATE.cart.map(l=>({name:l.name, mods:(l.modsLabel||[]).join(' · '), q:l.q, price:l.price, total:l.price*l.q, sku:l.sku, opts:l.opts})),
      sub: tot.sub, tax: tot.tax, total: tot.total, disc: tot.disc,
      payment: PM,
      totals: tot
    };
    // Append to txn history
    MK_DATA.TXNS.unshift({
      id: rcpt.id, at: rcpt.at, type: rcpt.type, table: rcpt.table, cashier: rcpt.cashier,
      lines: rcpt.lines.map(l=>({sku:l.sku||'', name:l.name, q:l.q, price:l.price, total:l.total, opts:l.opts})),
      sub: rcpt.sub, tax: rcpt.tax, total: rcpt.total, payment: PM.toLowerCase(),
      customerId: rcpt.customerId
    });
    // Kitchen ticket for prep items
    MK.audit('payment.complete', {id:rcpt.id, total:rcpt.total, method:PM});
    const prepLines = STATE.cart.filter(l=>l.sku.startsWith('C')||l.sku.startsWith('I')||l.sku.startsWith('T')||l.sku.startsWith('S')||l.sku.startsWith('F'));
    if(prepLines.length) printKitchen({...rcpt, lines: prepLines.map(l=>({name:l.name, mods:(l.modsLabel||[]).join(' · '), q:l.q}))});
    toast('✓ '+fmtIQD(tot.total)+' · '+PM, 'ok');
    closePay();
    newOrder();
    MK.bus.emit('orders.updated');
    // Show receipt share modal after state cleared
    showReceiptShare(rcpt);
    // Low-stock warning toast
    if(lowItems.length) setTimeout(()=>toast('⚠️ '+t('lowStockWarn')+': '+lowItems.map(i=>i.en||i.ar).join(', '),'warn'), 2500);
  }

  // ---------- RECEIPT SHARE ----------
  let lastRcpt = null;
  function showReceiptShare(rcpt){
    lastRcpt = rcpt;
    const body = document.getElementById('rcpt-share-body');
    const cust = rcpt.customerName ? `<div class="rs-cust">👤 ${esc(rcpt.customerName)}</div>` : '';
    body.innerHTML = `
      <div class="rs-total">${fmtIQD(rcpt.total)}</div>
      <div class="rs-id">${esc(rcpt.id)} · ${rcpt.payment}</div>
      ${cust}`;
    document.getElementById('rcpt-share-modal').classList.add('show');
  }
  function printReceiptNow(){
    if(lastRcpt) printReceipt(lastRcpt);
  }
  function shareReceiptWA(){
    if(!lastRcpt) return;
    const r = lastRcpt;
    const lines = r.lines.map(l=>`  ${l.q}× ${l.name}${l.mods?' ('+l.mods+')':''} — ${fmtNum(l.price*l.q)} IQD`).join('\n');
    const text = `*Mr. Kim's — ${r.id}*\n${fmtDateTime(r.at)}\n\n${lines}\n\n*Total: ${fmtNum(r.total)} IQD*\n${r.payment}\n\nThank you! ☕`;
    if(r.customerPhone){
      let ph = String(r.customerPhone).replace(/\D/g,'');
      if(ph.startsWith('0')) ph = '964'+ph.slice(1);
      else if(!ph.startsWith('964')) ph = '964'+ph;
      window.open('https://wa.me/'+ph+'?text='+encodeURIComponent(text), '_blank');
    } else {
      navigator.clipboard.writeText(text).then(()=>toast('📋 Copied!','ok')).catch(()=>toast('⚠️ Copy failed','warn'));
    }
  }

  // ---------- TOAST ----------
  let toastTimer;
  function toast(msg, kind){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (kind||'');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>t.classList.remove('show'), 2000);
  }

  // ---------- PUBLIC ----------
  window.MKO = {
    init(){ renderCats(); renderGrid(); renderCart(); },
    refresh(){ renderCats(); renderGrid(); renderCart(); },
    setCat, setSearch,
    openOpts, setOpt, optQ, closeOpts, confirmOpts,
    openCustomer, filterCust, pickCustomer, clearCustomer,
    lineQ, removeLine,
    setOrderType,
    newOrder, parkOrder, resumeParked, openDiscount, addNote, splitBill,
    openPay, setPay, kpPress, kpQuick, closePay, finishPay,
    printReceiptNow, shareReceiptWA,
    toast
  };
})();
