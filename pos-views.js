/* ============================================================
   Mr. Kim's POS — Tables, KDS, Inventory, Reservations, Customers, Reports
   ============================================================ */

(function(){
  const {STATE, t, itemName, fmtIQD, fmtNum, fmtTime, fmtDate, fmtDateTime,
         stockStatus, exportCSV, exportXLS, exportJSON, audit, restoreIngredients} = MK;
  const {INV, CUSTOMERS, RESERVATIONS, PICKUPS, MENU} = MK_DATA;

  // ================== TABLES VIEW ==================
  let selTable = null;
  let currentFloor = (MK_DATA.FLOORS&&MK_DATA.FLOORS[0]) ? MK_DATA.FLOORS[0].id : 'F1';

  function renderFloorTabs(){
    const tabs = document.getElementById('tv-tabs');
    if(!tabs) return;
    tabs.innerHTML = MK_DATA.FLOORS.map(f=>`<button class="tv-tab${currentFloor===f.id?' active':''}" onclick="MKV.setFloor('${f.id}')">${STATE.lang==='ar'?f.name_ar:f.name_en}</button>`).join('');
  }

  function setFloor(id){ currentFloor=id; selTable=null; closeMgmt(); renderFloorTabs(); renderTables(); }

  function renderTables(){
    renderFloorTabs();
    const L = T_();
    const map = document.getElementById('tv-map');
    const floorTbls = MK_DATA.TABLES.filter(t=>t.floor===currentFloor);
    map.innerHTML = floorTbls.map(tbl=>{
      const s = STATE.onlineTables[tbl.id] || {status:'free'};
      const cls = ['tbl-node', tbl.shape, s.status, selTable===tbl.id?'sel':''].filter(Boolean).join(' ');
      const style = `left:${tbl.x}px;top:${tbl.y}px`;
      const seatLbl = tbl.label || (tbl.seats+'');
      return `<div class="${cls}" style="${style}" onclick="MKV.selectTable('${tbl.id}')">
        <div>${tbl.id}</div>
        <div class="ts">${seatLbl==='Bar'||seatLbl==='Patio'?seatLbl:tbl.seats+' '+L.seats}</div>
      </div>`;
    }).join('');

    // Stats for current floor
    let free=0,occ=0,res=0,dirty=0;
    floorTbls.forEach(tbl=>{
      const s = STATE.onlineTables[tbl.id]||{status:'free'};
      if(s.status==='free')free++;
      else if(s.status==='occupied')occ++;
      else if(s.status==='reserved')res++;
      else if(s.status==='dirty')dirty++;
    });
    document.getElementById('tv-free').textContent = free;
    document.getElementById('tv-occ').textContent = occ;
    document.getElementById('tv-res').textContent = res;
    document.getElementById('tv-dirty').textContent = dirty;

    renderSelected();
  }

  function selectTable(id){ selTable=id; closeMgmt(); renderTables(); }

  function renderSelected(){
    const el = document.getElementById('tbl-selected');
    if(!selTable){ el.innerHTML = `<div style="text-align:center;color:#9aa5a0;font-weight:700;font-size:11.5px;padding:20px">${STATE.lang==='ar'?'اختر طاولة من الخريطة':'Select a table from the map'}</div>`; return; }
    const tbl = MK_DATA.TABLES.find(x=>x.id===selTable);
    if(!tbl){ el.innerHTML=''; return; }
    const s = STATE.onlineTables[selTable] || {status:'free'};
    const L = T_();
    el.innerHTML = `
      <div class="tbl-detail">
        <div class="id">${tbl.id} ${tbl.label?'· '+tbl.label:''}</div>
        <div class="meta">${tbl.seats} ${L.seats} · ${tbl.shape}</div>
        <span class="st ${s.status}">● ${L[s.status]||s.status}</span>
        ${s.orderId?`<div style="margin-top:6px;font-family:var(--mk-font-mono);font-size:11px;color:#367d4d;font-weight:900">${s.orderId}</div>`:''}
      </div>
      <div class="tbl-actions">
        ${s.status==='free'?`<button class="prim" onclick="MKV.seatTable('${tbl.id}')">➕ ${L.newOrder}</button>`:''}
        ${s.status==='occupied'?`<button class="prim" onclick="MKV.openTableOrder('${tbl.id}')">📝 ${L.order}</button>`:''}
        ${s.status==='occupied'?`<button onclick="MKV.clearTable('${tbl.id}')">✓ ${L.bump}</button>`:''}
        ${s.status==='reserved'?`<button class="prim" onclick="MKV.checkin('${tbl.id}')">➕ ${L.seat}</button>`:''}
        ${s.status==='dirty'?`<button class="prim" onclick="MKV.cleanTable('${tbl.id}')">✨ ${L.free}</button>`:''}
        <button onclick="MKV.actTransfer('${tbl.id}')">↔ ${L.transfer}</button>
        <button onclick="MKV.actMerge('${tbl.id}')">⤵ ${L.merge}</button>
        <button onclick="MKV.openEditTable('${tbl.id}')">✏ ${STATE.lang==='ar'?'تعديل':'Edit'}</button>
      </div>`;
  }

  function seatTable(id){ STATE.onlineTables[id]={status:'occupied',orderId:'TX-'+String(parseInt(STATE.order.id.replace(/\D/g,''))+100).padStart(5,'0')}; MK.audit('table.seat',id); MKO.toast(`✓ ${id}`); renderTables(); }
  function clearTable(id){ STATE.onlineTables[id]={status:'dirty'}; MK.audit('table.clear',id); MKO.toast(`🧹 ${id}`); renderTables(); }
  function cleanTable(id){ STATE.onlineTables[id]={status:'free'}; MK.audit('table.clean',id); renderTables(); }
  function checkin(id){ STATE.onlineTables[id]={status:'occupied',orderId:'TX-'+String(parseInt(STATE.order.id.replace(/\D/g,''))+101).padStart(5,'0')}; MK.audit('table.checkin',id); renderTables(); }
  function openTableOrder(id){ STATE.order.table=id; STATE.view='order'; MK.bus.emit('nav','order'); }
  function actTransfer(id){ const to = prompt(STATE.lang==='ar'?'انقل إلى (مثال: T02)':'Transfer to (e.g. T02)'); if(!to || !STATE.onlineTables[to]) return; STATE.onlineTables[to]=STATE.onlineTables[id]; STATE.onlineTables[id]={status:'dirty'}; selTable=to; MK.audit('table.transfer',{from:id,to}); MKO.toast(`↔ ${id}→${to}`); renderTables(); }
  function actMerge(id){ const to = prompt(STATE.lang==='ar'?'ادمج مع (مثال: T02)':'Merge with (e.g. T02)'); if(!to) return; MKO.toast(`⤵ ${id}+${to}`); MK.audit('table.merge',{a:id,b:to}); }

  // ================== TABLE / FLOOR MANAGEMENT ==================
  function closeMgmt(){
    const el=document.getElementById('tbl-selected'); if(el) el.style.display='';
    const m=document.getElementById('tv-mgmt'); if(m){m.classList.add('hidden');m.innerHTML='';}
  }

  function _tblForm(isEdit, tbl){
    const L = T_();
    const shapeOpts = ['round','square','rect','bar'].map(s=>`<option value="${s}"${tbl&&tbl.shape===s?' selected':''}>${s}</option>`).join('');
    return `
      <h4>${isEdit?(STATE.lang==='ar'?'تعديل':'Edit')+' '+tbl.id:(STATE.lang==='ar'?'إضافة طاولة':'Add Table')}</h4>
      ${!isEdit?`<label>ID</label><input id="tf-id" value="${currentFloor+String(MK_DATA.TABLES.filter(t=>t.floor===currentFloor).length+1).padStart(2,'0')}" maxlength="10"/>`:''}
      <label>${STATE.lang==='ar'?'تسمية':'Label'}</label>
      <input id="tf-label" value="${tbl&&tbl.label||''}"/>
      <div class="mrow">
        <div><label>${STATE.lang==='ar'?'مقاعد':'Seats'}</label><input id="tf-seats" type="number" value="${tbl?tbl.seats:2}" min="1" max="30"/></div>
        <div><label>${STATE.lang==='ar'?'شكل':'Shape'}</label><select id="tf-shape">${shapeOpts}</select></div>
      </div>
      <div class="mrow">
        <div><label>X</label><input id="tf-x" type="number" value="${tbl?tbl.x:100}" min="0" max="950"/></div>
        <div><label>Y</label><input id="tf-y" type="number" value="${tbl?tbl.y:100}" min="0" max="360"/></div>
      </div>
      <div class="mactions">
        <button class="save" onclick="MKV.${isEdit?`saveTable('${tbl.id}')`:'saveNewTable()'}">✓ ${STATE.lang==='ar'?'حفظ':'Save'}</button>
        ${isEdit?`<button class="del" onclick="MKV.deleteTable('${tbl.id}')">🗑</button>`:''}
        <button onclick="MKV.closeMgmt()">✕</button>
      </div>`;
  }

  function openAddTable(){
    selTable=null;
    const el=document.getElementById('tbl-selected'); if(el) el.style.display='none';
    const m=document.getElementById('tv-mgmt'); m.classList.remove('hidden');
    m.innerHTML=_tblForm(false,null);
    renderTables();
  }

  function openEditTable(id){
    const tbl=MK_DATA.TABLES.find(x=>x.id===id); if(!tbl) return;
    const el=document.getElementById('tbl-selected'); if(el) el.style.display='none';
    const m=document.getElementById('tv-mgmt'); m.classList.remove('hidden');
    m.innerHTML=_tblForm(true,tbl);
  }

  function saveNewTable(){
    const idVal=(document.getElementById('tf-id')||{value:''}).value.trim();
    if(!idVal){ MKO.toast(STATE.lang==='ar'?'ID مطلوب':'ID required'); return; }
    if(MK_DATA.TABLES.find(t=>t.id===idVal)){ MKO.toast(STATE.lang==='ar'?'ID موجود':'ID exists'); return; }
    const label=document.getElementById('tf-label').value.trim();
    const seats=parseInt(document.getElementById('tf-seats').value)||2;
    const shape=document.getElementById('tf-shape').value;
    const x=parseInt(document.getElementById('tf-x').value)||100;
    const y=parseInt(document.getElementById('tf-y').value)||100;
    const entry={id:idVal,seats,shape,x,y,floor:currentFloor};
    if(label) entry.label=label;
    MK_DATA.TABLES.push(entry);
    MK_DATA.saveTables();
    closeMgmt(); renderTables();
    MKO.toast(`✓ ${idVal}`);
  }

  function saveTable(id){
    const tbl=MK_DATA.TABLES.find(x=>x.id===id); if(!tbl) return;
    const label=document.getElementById('tf-label').value.trim();
    tbl.seats=parseInt(document.getElementById('tf-seats').value)||tbl.seats;
    tbl.shape=document.getElementById('tf-shape').value;
    tbl.x=parseInt(document.getElementById('tf-x').value)||tbl.x;
    tbl.y=parseInt(document.getElementById('tf-y').value)||tbl.y;
    if(label) tbl.label=label; else delete tbl.label;
    MK_DATA.saveTables();
    closeMgmt(); renderTables();
    MKO.toast(`✓ ${id}`);
  }

  function deleteTable(id){
    if(!confirm(STATE.lang==='ar'?`حذف ${id}؟`:`Delete ${id}?`)) return;
    const i=MK_DATA.TABLES.findIndex(x=>x.id===id);
    if(i>=0) MK_DATA.TABLES.splice(i,1);
    MK_DATA.saveTables();
    selTable=null; closeMgmt(); renderTables();
    MKO.toast(`🗑 ${id}`);
  }

  function _renderFloorMgmt(){
    const m=document.getElementById('tv-mgmt'); if(!m) return;
    m.innerHTML=`
      <h4>${STATE.lang==='ar'?'إدارة الطوابق':'Manage Floors'}</h4>
      ${MK_DATA.FLOORS.map(f=>`
        <div class="floor-row">
          <input id="flen-${f.id}" value="${f.name_en}" placeholder="English"/>
          <input id="flar-${f.id}" value="${f.name_ar}" placeholder="عربي"/>
          <button class="fl-save" onclick="MKV.saveFloor('${f.id}')">✓</button>
          <button class="fl-del" onclick="MKV.deleteFloor('${f.id}')">🗑</button>
        </div>`).join('')}
      <div class="fl-sep">
        <h4>${STATE.lang==='ar'?'إضافة طابق':'Add Floor'}</h4>
        <input id="fl-new-en" placeholder="English name" style="margin-bottom:4px"/>
        <input id="fl-new-ar" placeholder="اسم عربي"/>
        <div class="mactions" style="margin-top:6px">
          <button class="save" onclick="MKV.addFloor()">+ ${STATE.lang==='ar'?'إضافة':'Add'}</button>
          <button onclick="MKV.closeMgmt()">✕ ${STATE.lang==='ar'?'إغلاق':'Close'}</button>
        </div>
      </div>`;
  }

  function openManageFloors(){
    selTable=null;
    const el=document.getElementById('tbl-selected'); if(el) el.style.display='none';
    const m=document.getElementById('tv-mgmt'); m.classList.remove('hidden');
    _renderFloorMgmt();
  }

  function saveFloor(id){
    const f=MK_DATA.FLOORS.find(x=>x.id===id); if(!f) return;
    f.name_en=document.getElementById('flen-'+id).value.trim()||f.name_en;
    f.name_ar=document.getElementById('flar-'+id).value.trim()||f.name_ar;
    MK_DATA.saveFloors(); renderFloorTabs();
    MKO.toast('✓');
  }

  function addFloor(){
    const en=(document.getElementById('fl-new-en')||{value:''}).value.trim();
    const ar=(document.getElementById('fl-new-ar')||{value:''}).value.trim();
    if(!en&&!ar){ MKO.toast(STATE.lang==='ar'?'أدخل اسماً':'Enter a name'); return; }
    const newId='FL'+Date.now().toString(36).slice(-4).toUpperCase();
    MK_DATA.FLOORS.push({id:newId,name_en:en||ar,name_ar:ar||en});
    MK_DATA.saveFloors(); renderFloorTabs(); _renderFloorMgmt();
    MKO.toast('✓ '+newId);
  }

  function deleteFloor(id){
    if(MK_DATA.FLOORS.length<=1){ MKO.toast(STATE.lang==='ar'?'لا يمكن حذف آخر طابق':'Cannot delete last floor'); return; }
    if(!confirm(STATE.lang==='ar'?'حذف هذا الطابق وجميع طاولاته؟':'Delete this floor and all its tables?')) return;
    let i=MK_DATA.TABLES.length;
    while(i--){ if(MK_DATA.TABLES[i].floor===id) MK_DATA.TABLES.splice(i,1); }
    const fi=MK_DATA.FLOORS.findIndex(x=>x.id===id);
    if(fi>=0) MK_DATA.FLOORS.splice(fi,1);
    MK_DATA.saveTables(); MK_DATA.saveFloors();
    if(currentFloor===id) currentFloor=MK_DATA.FLOORS[0].id;
    renderFloorTabs(); _renderFloorMgmt(); renderTables();
    MKO.toast('🗑');
  }

  // ================== KDS VIEW ==================
  function renderKDS(){
    const L = T_();
    const colIncoming = document.getElementById('kds-incoming');
    const colPrep = document.getElementById('kds-preparing');
    const colReady = document.getElementById('kds-ready');
    const incoming = STATE.kdsQueue.filter(k=>k.status==='incoming');
    const prep = STATE.kdsQueue.filter(k=>k.status==='preparing');
    const ready = STATE.kdsQueue.filter(k=>k.status==='ready');
    const card = (k)=>{
      const age = Math.max(0, Math.round((Date.now()-new Date(k.at).getTime())/60000));
      const urg = age >= 5;
      const lines = k.items.map(i=>`<div class="kl"><div class="kn">${i.q}× ${i.name}</div>${i.mods?`<div class="km">${i.mods}</div>`:''}</div>`).join('');
      const nextAct = k.status==='incoming'?`<button class="kds-bump" onclick="MKV.kdsAdvance('${k.id}')">▶ ${L.preparing}</button>`:
                      k.status==='preparing'?`<button class="kds-bump" onclick="MKV.kdsAdvance('${k.id}')">✓ ${L.ready}</button>`:
                      `<button class="kds-bump" onclick="MKV.kdsAdvance('${k.id}')">🎉 ${L.bump}</button>`;
      return `<div class="kds-card ${urg?'urgent':''}">
        <div class="kh">
          <div><span class="kid">${k.id}</span> <span class="kt">· ${k.table||'—'}</span></div>
          <span class="age">${age}m</span>
        </div>
        ${lines}${nextAct}
      </div>`;
    };
    colIncoming.innerHTML = incoming.map(card).join('') || `<div style="color:#555;text-align:center;padding:20px;font-size:11px">—</div>`;
    colPrep.innerHTML = prep.map(card).join('') || `<div style="color:#555;text-align:center;padding:20px;font-size:11px">—</div>`;
    colReady.innerHTML = ready.map(card).join('') || `<div style="color:#555;text-align:center;padding:20px;font-size:11px">—</div>`;
    document.getElementById('kds-ct-i').textContent = incoming.length;
    document.getElementById('kds-ct-p').textContent = prep.length;
    document.getElementById('kds-ct-r').textContent = ready.length;
  }

  function kdsAdvance(id){
    const k = STATE.kdsQueue.find(x=>x.id===id); if(!k) return;
    if(k.status==='incoming') k.status='preparing';
    else if(k.status==='preparing') k.status='ready';
    else { STATE.kdsQueue = STATE.kdsQueue.filter(x=>x.id!==id); MK.audit('kds.complete',id); }
    renderKDS();
  }

  // ================== INVENTORY VIEW ==================
  function renderInv(){
    const L = T_();
    const tb = document.getElementById('inv-tbody');
    let totalValue=0, lowCt=0, outCt=0;
    tb.innerHTML = INV.map(i=>{
      const s = stockStatus(i);
      const pct = Math.min(100, (i.qty/(i.min*3))*100);
      const name = i[STATE.lang]||i.en;
      const value = i.qty * i.cost;
      totalValue += value;
      if(s==='low') lowCt++; if(s==='out') outCt++;
      return `<tr>
        <td><div style="font-weight:800">${name}</div><div class="sk">${i.k}</div></td>
        <td class="n">${fmtNum(Math.round(i.qty))} <span style="color:#9aa5a0;font-weight:700">${i.unit}</span></td>
        <td class="n">${fmtNum(i.min)} ${i.unit}</td>
        <td>
          <span class="qbar ${s}"><span class="f" style="width:${pct}%"></span></span>
          <span class="pill ${s}">${L[s==='good'?'good':s==='low'?'low':'outStock']}</span>
        </td>
        <td class="n">${fmtNum(i.cost)}</td>
        <td class="n" style="color:#367d4d">${fmtNum(Math.round(value))}</td>
        <td style="text-align:center">
          <button class="rowbtn" onclick="MKV.invReceive('${i.k}')">➕ ${L.receive}</button>
          <button class="rowbtn" onclick="MKV.invAdjust('${i.k}')">✏ ${L.adjust}</button>
        </td>
      </tr>`;
    }).join('');
    document.getElementById('inv-k-items').textContent = INV.length;
    document.getElementById('inv-k-value').textContent = fmtNum(Math.round(totalValue));
    document.getElementById('inv-k-low').textContent = lowCt;
    document.getElementById('inv-k-out').textContent = outCt;
  }
  function invReceive(k){
    const inv = INV.find(x=>x.k===k);
    const v = prompt(STATE.lang==='ar'?`كمية الاستلام (${inv.unit}):`:`Receive qty (${inv.unit}):`, '');
    const n = parseFloat(v); if(!n||n<=0) return;
    inv.qty += n; MK.audit('inv.receive',{k,qty:n}); MKO.toast(`➕ ${n} ${inv.unit}`); renderInv();
  }
  function invAdjust(k){
    const inv = INV.find(x=>x.k===k);
    const v = prompt(STATE.lang==='ar'?`الكمية الفعلية (${inv.unit}):`:`Actual qty (${inv.unit}):`, inv.qty);
    const n = parseFloat(v); if(isNaN(n)||n<0) return;
    const delta = n-inv.qty; inv.qty = n; MK.audit('inv.adjust',{k,delta}); MKO.toast(`✏ ${inv.qty} ${inv.unit}`); renderInv();
  }
  function invExport(kind){
    const rows = [['SKU','Name (EN)','Name (AR)','Qty','Unit','Min','Cost','Value IQD','Status']];
    INV.forEach(i=> rows.push([i.k, i.en, i.ar, Math.round(i.qty), i.unit, i.min, i.cost, Math.round(i.qty*i.cost), stockStatus(i)]));
    if(kind==='csv') exportCSV('inventory_'+fmtDate(new Date().toISOString()), rows);
    else if(kind==='xls') exportXLS('inventory_'+fmtDate(new Date().toISOString()), [{name:'Inventory', rows}]);
    else exportJSON('inventory_'+fmtDate(new Date().toISOString()), INV);
    MKO.toast('📥 Export ✓','ok');
  }

  // ================== RESERVATIONS VIEW ==================
  function renderReservations(){
    const L = T_();
    const res = document.getElementById('rv-res');
    RESERVATIONS.sort((a,b)=> new Date(a.at) - new Date(b.at));
    res.innerHTML = RESERVATIONS.map(r=>{
      const time = fmtTime(r.at);
      return `<div class="rs-card res">
        <div class="tm"><div class="hh">${time}</div><div class="am">${r.party}${L.seats.charAt(0)}</div></div>
        <div>
          <div class="m1">${r.name_ar}</div>
          <div class="m2">${r.phone} · ${r.table} · ${L[r.status]||r.status}</div>
        </div>
        <div class="mact">
          <button class="prim" onclick="MKV.seatRes('${r.id}')">✓ ${L.seat}</button>
          <button onclick="MKV.cancelRes('${r.id}')">✕</button>
        </div>
      </div>`;
    }).join('') || emptyBlock();

    const pk = document.getElementById('rv-pk');
    pk.innerHTML = PICKUPS.map(p=>{
      const time = fmtTime(p.at);
      const items = p.items.map(i=>{ const it = MENU.find(m=>m.sku===i.sku); return `${i.q}× ${it?itemName(it):i.sku}`; }).join(', ');
      return `<div class="rs-card pickup">
        <div class="tm"><div class="hh">${time}</div><div class="am">📱</div></div>
        <div>
          <div class="m1">${p.name}</div>
          <div class="m2">${items} · ${fmtNum(p.total)} IQD</div>
        </div>
        <div class="mact">
          <button class="prim" onclick="MKV.acceptPickup('${p.id}')">✓</button>
          <button onclick="MKV.rejectPickup('${p.id}')">✕</button>
        </div>
      </div>`;
    }).join('') || emptyBlock();

    document.getElementById('rv-ct-res').textContent = RESERVATIONS.length;
    document.getElementById('rv-ct-pk').textContent = PICKUPS.length;
  }
  function emptyBlock(){
    return `<div style="text-align:center;color:#9aa5a0;font-weight:700;font-size:11.5px;padding:30px;background:#fff;border-radius:8px">—</div>`;
  }
  function seatRes(id){
    const r = RESERVATIONS.find(x=>x.id===id); if(!r) return;
    if(r.table) STATE.onlineTables[r.table] = {status:'occupied', orderId:'TX-'+String(parseInt(STATE.order.id.replace(/\D/g,''))+50).padStart(5,'0')};
    RESERVATIONS.splice(RESERVATIONS.indexOf(r),1);
    MK.audit('res.seat',id); MKO.toast('✓ '+id); renderReservations();
  }
  function cancelRes(id){
    const idx = RESERVATIONS.findIndex(x=>x.id===id); if(idx<0) return;
    if(!confirm('Cancel '+id+'?')) return;
    RESERVATIONS.splice(idx,1); MK.audit('res.cancel',id); renderReservations();
  }
  function acceptPickup(id){
    const idx = PICKUPS.findIndex(x=>x.id===id); if(idx<0) return;
    const p = PICKUPS[idx];
    // Push to KDS
    STATE.kdsQueue.unshift({
      id: 'PK-'+id.slice(2), table:'PICKUP', at: new Date().toISOString(), status:'incoming',
      items: p.items.map(i=>{const it = MENU.find(m=>m.sku===i.sku); return {name: it?itemName(it):i.sku, q:i.q};})
    });
    PICKUPS.splice(idx,1);
    MK.audit('pickup.accept',id); MKO.toast('✓ '+id+' → '+t('kitchen'),'ok'); renderReservations();
  }
  function rejectPickup(id){
    const idx = PICKUPS.findIndex(x=>x.id===id); if(idx<0) return;
    PICKUPS.splice(idx,1); MK.audit('pickup.reject',id); renderReservations();
  }

  // ================== CUSTOMERS VIEW ==================
  let custQ = '';
  function renderCustomers(){
    const L = T_();
    const body = document.getElementById('cv-grid');
    let list = CUSTOMERS.slice();
    if(custQ){ const q = custQ.toLowerCase();
      list = list.filter(c=> c.name_ar.includes(q) || c.name_en.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q));
    }
    body.innerHTML = list.map(c=>{
      const nm = STATE.lang==='ar'?c.name_ar:c.name_en;
      const stamps = [];
      for(let i=0;i<10;i++) stamps.push(`<span class="stamp ${i<c.stamps?'on':''}">${i<c.stamps?'★':''}</span>`);
      const readyFree = c.stamps>=10 ? `<span class="stamp free">🎁</span> <small style="color:#10b981">${L.redeemStamp}!</small>` : `<small>${c.stamps}/10</small>`;
      return `<div class="cc">
        <div class="ct">
          <div><div class="cn">${nm}</div><div class="cp">${c.phone} · ${c.id}</div></div>
          <span class="tier ${c.tier}">${L[c.tier.toLowerCase()]||c.tier}</span>
        </div>
        <div class="stats">
          <div class="st"><div class="vl">${c.visits}</div><div class="lb">${L.visits}</div></div>
          <div class="st"><div class="vl">${fmtNum(c.spent/1000).toFixed(0)}K</div><div class="lb">${L.totalSpent}</div></div>
          <div class="st"><div class="vl">${c.stamps}</div><div class="lb">${L.stamps}</div></div>
        </div>
        <div class="stamps-row">${stamps.join('')}${readyFree}</div>
      </div>`;
    }).join('');
  }
  function setCustQ(v){ custQ = v; renderCustomers(); }
  function custExport(kind){
    const rows = [['ID','Name (EN)','Name (AR)','Phone','Stamps','Visits','Total Spent IQD','Tier']];
    CUSTOMERS.forEach(c=> rows.push([c.id, c.name_en, c.name_ar, c.phone, c.stamps, c.visits, c.spent, c.tier]));
    if(kind==='csv') exportCSV('customers_'+fmtDate(new Date().toISOString()), rows);
    else exportXLS('customers_'+fmtDate(new Date().toISOString()), [{name:'Customers', rows}]);
    MKO.toast('📥 Export ✓','ok');
  }

  // ================== REPORTS VIEW ==================
  let rptRange = '1'; // 1=today, 7, 30

  function renderReports(){
    const L = T_();
    const cutoff = Date.now() - parseInt(rptRange)*86400000;
    const txns = MK_DATA.TXNS.filter(tx=> new Date(tx.at).getTime() >= cutoff);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayTx = MK_DATA.TXNS.filter(tx=> new Date(tx.at) >= today);

    // KPIs (today)
    const salesT = todayTx.reduce((s,t)=>s+t.total,0);
    const ordersT = todayTx.length;
    const avgT = ordersT ? Math.round(salesT/ordersT) : 0;
    const itemsT = todayTx.reduce((s,t)=>s+t.lines.reduce((a,l)=>a+l.q,0),0);

    document.getElementById('k-sales').textContent = fmtNum(salesT)+' IQD';
    document.getElementById('k-orders').textContent = fmtNum(ordersT);
    document.getElementById('k-avg').textContent = fmtNum(avgT)+' IQD';
    document.getElementById('k-items').textContent = fmtNum(itemsT);

    // Hourly bars (today)
    const hours = Array(24).fill(0);
    todayTx.forEach(tx=> hours[new Date(tx.at).getHours()] += tx.total);
    const maxH = Math.max(...hours, 1);
    // Show 7am – 11pm (17 bars)
    const hrs = [];
    for(let h=7;h<=23;h++) hrs.push({h, v:hours[h]});
    document.getElementById('bars').innerHTML = hrs.map(x=>
      `<div class="bar" style="height:${Math.max(2,(x.v/maxH)*100)}%" data-t="${x.h}:00 · ${fmtNum(Math.round(x.v))}"></div>`
    ).join('');
    document.getElementById('bars-lbl').innerHTML = hrs.map(x=>`<span>${x.h}</span>`).join('');

    // Payment donut (range)
    const pay = {};
    txns.forEach(t=>{ pay[t.payment] = (pay[t.payment]||0) + t.total; });
    const pTotal = Object.values(pay).reduce((s,v)=>s+v,0) || 1;
    const colors = {cash:'#367d4d',card:'#3b82f6',zain:'#a855f7',switch:'#f97316',stamp:'#f59e0b'};
    let cum = 0;
    const slices = Object.keys(pay).map(k=>{
      const pct = pay[k]/pTotal;
      const off = -cum * 100;
      cum += pct;
      return `<circle cx="60" cy="60" r="32" fill="none" stroke="${colors[k]||'#9aa5a0'}" stroke-width="18" stroke-dasharray="${pct*201} 201" stroke-dashoffset="${off*2.01}" transform="rotate(-90 60 60)"/>`;
    }).join('');
    document.getElementById('donut-svg').innerHTML = slices + `<text x="60" y="58" text-anchor="middle" font-family="var(--mk-font-mono)" font-weight="900" font-size="13" fill="#111">${fmtNum(Math.round(pTotal/1000))}K</text><text x="60" y="72" text-anchor="middle" font-size="9" font-weight="700" fill="#6b7a6e">IQD</text>`;
    document.getElementById('donut-lbl').innerHTML = Object.keys(pay).map(k=>
      `<div class="it"><span class="sw" style="background:${colors[k]||'#9aa5a0'}"></span>${L[k==='switch'?'switchPay':k==='zain'?'zaincash':k==='stamp'?'stamps':k]||k}<span class="vv">${fmtNum(Math.round(pay[k]/1000))}K</span></div>`
    ).join('');

    // Top items (range)
    const counts = {};
    txns.forEach(t=>t.lines.forEach(l=>{
      counts[l.name] = counts[l.name] || {q:0, rev:0};
      counts[l.name].q += l.q;
      counts[l.name].rev += l.total;
    }));
    const top = Object.entries(counts).sort((a,b)=>b[1].q-a[1].q).slice(0,8);
    document.getElementById('top-items').innerHTML = top.map((x,i)=>{
      const it = MENU.find(m=>m.en===x[0]);
      const emoji = it?it.e:'•';
      return `<div class="ti"><span class="rk">#${i+1}</span><span class="em">${emoji}</span><span class="nm">${x[0]}</span><span class="qt">×${x[1].q}</span><span class="rv">${fmtNum(x[1].rev)}</span></div>`;
    }).join('');
  }
  function setRange(r){ rptRange = r; renderReports(); }

  function rptExport(kind){
    const cutoff = Date.now() - parseInt(rptRange)*86400000;
    const txns = MK_DATA.TXNS.filter(tx=> new Date(tx.at).getTime() >= cutoff);
    // Build multi-sheet
    const summaryRows = [['Metric','Value']];
    const pay={}; const types={}; let total=0;
    txns.forEach(t=>{ pay[t.payment]=(pay[t.payment]||0)+t.total; types[t.type]=(types[t.type]||0)+t.total; total+=t.total; });
    summaryRows.push(['Period (days)', rptRange]);
    summaryRows.push(['Orders', txns.length]);
    summaryRows.push(['Total sales IQD', total]);
    summaryRows.push(['Avg order IQD', txns.length?Math.round(total/txns.length):0]);
    summaryRows.push(['','']);
    summaryRows.push(['By payment','']);
    Object.keys(pay).forEach(k=>summaryRows.push([k, pay[k]]));
    summaryRows.push(['','']);
    summaryRows.push(['By type','']);
    Object.keys(types).forEach(k=>summaryRows.push([k, types[k]]));

    const txnRows = [['Order ID','DateTime','Type','Table','Cashier','Lines','Subtotal','Tax','Total','Payment','CustomerID']];
    txns.forEach(t=> txnRows.push([t.id, t.at, t.type, t.table||'', t.cashier, t.lines.length, t.sub, t.tax, t.total, t.payment, t.customerId||'']));

    const lineRows = [['Order ID','DateTime','SKU','Name','Qty','Price','Line Total']];
    txns.forEach(t=>t.lines.forEach(l=> lineRows.push([t.id, t.at, l.sku||'', l.name, l.q, l.price, l.total])));

    const filename = 'sales_report_'+fmtDate(new Date().toISOString())+'_'+rptRange+'d';
    if(kind==='csv'){
      exportCSV(filename, [['— SUMMARY —'],...summaryRows,['','',''],['— TRANSACTIONS —'],...txnRows,['','',''],['— LINE ITEMS —'],...lineRows]);
    } else if (kind==='xls'){
      exportXLS(filename, [
        {name:'Summary', rows:summaryRows},
        {name:'Transactions', rows:txnRows},
        {name:'Line Items', rows:lineRows}
      ]);
    } else {
      exportJSON(filename, txns);
    }
    MKO.toast('📥 Export ✓','ok');
  }

  function exportAll(){
    const filename = 'mrkims_full_export_'+fmtDate(new Date().toISOString());
    // Menu sheet
    const menuRows = [['SKU','Name EN','Name AR','Name KO','Category','Price IQD']];
    MENU.forEach(m=> menuRows.push([m.sku, m.en, m.ar, m.ko, m.c, m.p]));
    const invRows = [['SKU','Name EN','Name AR','Qty','Unit','Min','Cost','Value']];
    INV.forEach(i=> invRows.push([i.k, i.en, i.ar, Math.round(i.qty), i.unit, i.min, i.cost, Math.round(i.qty*i.cost)]));
    const custRows = [['ID','Name EN','Name AR','Phone','Stamps','Visits','Total Spent','Tier']];
    CUSTOMERS.forEach(c=> custRows.push([c.id, c.name_en, c.name_ar, c.phone, c.stamps, c.visits, c.spent, c.tier]));
    const txnRows = [['ID','DateTime','Type','Table','Cashier','Subtotal','Tax','Total','Payment','CustomerID']];
    MK_DATA.TXNS.forEach(t=> txnRows.push([t.id, t.at, t.type, t.table||'', t.cashier, t.sub, t.tax, t.total, t.payment, t.customerId||'']));
    exportXLS(filename, [
      {name:'Menu', rows:menuRows},
      {name:'Inventory', rows:invRows},
      {name:'Customers', rows:custRows},
      {name:'Transactions (All)', rows:txnRows}
    ]);
    MKO.toast('📥 Full export ✓','ok');
  }

  // ================== SHIFT CLOSE ==================
  function openShiftClose(){
    const shift = STATE.shift;
    const since = shift.startedAt;
    const txns = MK_DATA.TXNS.filter(tx=> !tx.id.startsWith('RF-') && tx.at >= since);
    const total = txns.reduce((s,tx)=>s+tx.total, 0);
    const cashSales = txns.filter(tx=>tx.payment==='cash').reduce((s,tx)=>s+tx.total, 0);
    const byPay = {};
    txns.forEach(tx=>{ byPay[tx.payment] = (byPay[tx.payment]||0) + tx.total; });
    const payRows = Object.keys(byPay).map(k=>`
      <div class="shift-kpi">
        <div class="sk-lbl">${k.toUpperCase()}</div>
        <div class="sk-val">${fmtNum(byPay[k])} IQD</div>
      </div>`).join('');
    const body = document.getElementById('shift-modal-body');
    body.innerHTML = `
      <div class="shift-grid">
        <div class="shift-kpi">
          <div class="sk-lbl">${t('ordersToday')}</div>
          <div class="sk-val">${txns.length}</div>
        </div>
        <div class="shift-kpi">
          <div class="sk-lbl">${t('salesToday')}</div>
          <div class="sk-val">${fmtNum(total)} IQD</div>
        </div>
        ${payRows}
      </div>
      <div class="shift-cash-row">
        <label>
          ${t('openingCash')}
          <input type="number" id="shift-open-cash" value="${shift.openingCash||0}" oninput="MKV.updateShiftCalc()" min="0"/>
        </label>
        <label>
          ${t('countedCash')}
          <input type="number" id="shift-counted-cash" value="" placeholder="0" oninput="MKV.updateShiftCalc()" min="0"/>
        </label>
      </div>
      <div class="shift-variance ok" id="shift-variance-row">
        <span>${t('variance')}</span><span id="shift-variance-val">—</span>
      </div>
      <input type="hidden" id="shift-cash-sales-val" value="${cashSales}"/>`;
    document.getElementById('shift-modal').classList.add('show');
    updateShiftCalc();
  }

  function updateShiftCalc(){
    const opening = parseFloat(document.getElementById('shift-open-cash')?.value)||0;
    const counted = parseFloat(document.getElementById('shift-counted-cash')?.value)||0;
    const cashSales = parseFloat(document.getElementById('shift-cash-sales-val')?.value)||0;
    const expected = opening + cashSales;
    const variance = counted - expected;
    const row = document.getElementById('shift-variance-row');
    const val = document.getElementById('shift-variance-val');
    if(!document.getElementById('shift-counted-cash')?.value){ if(val) val.textContent='—'; return; }
    if(val) val.textContent = (variance>=0?'+':'')+fmtNum(variance)+' IQD';
    if(row){
      row.className = 'shift-variance';
      if(Math.abs(variance)<1000) row.classList.add('ok');
      else if(Math.abs(variance)<5000) row.classList.add('warn');
      else row.classList.add('bad');
    }
  }

  function confirmShiftClose(){
    const opening = parseFloat(document.getElementById('shift-open-cash')?.value)||0;
    const counted = parseFloat(document.getElementById('shift-counted-cash')?.value)||0;
    const cashSales = parseFloat(document.getElementById('shift-cash-sales-val')?.value)||0;
    const since = STATE.shift.startedAt;
    const txns = MK_DATA.TXNS.filter(tx=> !tx.id.startsWith('RF-') && tx.at >= since);
    const total = txns.reduce((s,tx)=>s+tx.total, 0);
    // CSV export
    const rows = [
      ['ID','DateTime','Type','Table','Cashier','Payment','Total'],
      ...txns.map(tx=>[tx.id, tx.at, tx.type||'', tx.table||'', tx.cashier||'', tx.payment||'', tx.total])
    ];
    rows.push([]);
    rows.push(['Opening Cash', opening, '', '', '', 'Cash Sales', cashSales]);
    rows.push(['Expected Cash', opening+cashSales, '', '', '', 'Counted', counted]);
    rows.push(['Variance', counted-(opening+cashSales)]);
    exportCSV('shift-'+fmtDate(since)+'-to-'+fmtDate(new Date().toISOString()), rows);
    // Reset shift
    STATE.shift.startedAt = new Date().toISOString();
    STATE.shift.openingCash = counted;
    audit('shift.close', {txns:txns.length, total, openingCash:opening, counted, variance:counted-(opening+cashSales)});
    document.getElementById('shift-modal').classList.remove('show');
    MKO.toast('🔐 '+t('shiftClose')+' ✓', 'ok');
  }

  // ================== REFUND ==================
  let _refundTxId = null;

  function openRefund(){
    document.getElementById('refund-id-in').value = '';
    document.getElementById('refund-modal-body').innerHTML = `<div class="refund-msg">${t('findOrder')}: TX-XXXXX</div>`;
    document.getElementById('refund-confirm-btn').disabled = true;
    _refundTxId = null;
    document.getElementById('refund-modal').classList.add('show');
  }

  function findRefundOrder(query){
    const q = String(query||'').trim().toUpperCase();
    const body = document.getElementById('refund-modal-body');
    const btn = document.getElementById('refund-confirm-btn');
    if(!q){ body.innerHTML=`<div class="refund-msg">${t('findOrder')}: TX-XXXXX</div>`; btn.disabled=true; _refundTxId=null; return; }
    const tx = MK_DATA.TXNS.find(t=> t.id.toUpperCase()===q);
    if(!tx){
      body.innerHTML=`<div class="refund-msg" style="color:var(--mk-red)">Not found: ${esc(q)}</div>`;
      btn.disabled=true; _refundTxId=null; return;
    }
    if(tx.refunded==='full'){
      body.innerHTML=`<div class="refund-msg" style="color:var(--mk-orange)">Already fully refunded</div>`;
      btn.disabled=true; _refundTxId=null; return;
    }
    _refundTxId = tx.id;
    const lines = (tx.lines||[]).map((l,i)=>{
      const disabled = tx.refundedLines && tx.refundedLines.includes(i) ? 'disabled' : '';
      return `<div class="refund-line" onclick="this.querySelector('input').click()">
        <input type="checkbox" id="rl-${i}" value="${i}" ${disabled}/>
        <div class="rl-name">${esc(l.name)}${l.mods?' · '+esc(l.mods):''} ×${l.q}</div>
        <div class="rl-amt">${fmtNum(l.price*l.q)} IQD</div>
      </div>`;
    }).join('');
    body.innerHTML = `<div class="refund-lines">${lines}</div>`;
    btn.disabled = false;
  }

  function processRefund(){
    if(!_refundTxId) return;
    const tx = MK_DATA.TXNS.find(t=>t.id===_refundTxId);
    if(!tx) return;
    const checks = document.querySelectorAll('#refund-modal-body input[type=checkbox]:checked');
    if(!checks.length){ MKO.toast(t('findOrder')+' — '+t('confirm'),'warn'); return; }
    const indices = Array.from(checks).map(c=>parseInt(c.value));
    const lines = indices.map(i=>tx.lines[i]);
    // Restore inventory
    lines.forEach(l=> restoreIngredients({...l, opts:l.opts||{}}));
    // Mark refunded lines
    tx.refundedLines = [...(tx.refundedLines||[]), ...indices];
    tx.refunded = tx.refundedLines.length >= tx.lines.length ? 'full' : 'partial';
    // Create RF- transaction
    const rfTotal = lines.reduce((s,l)=>s+(l.price*l.q),0);
    const rfId = 'RF-'+_refundTxId.replace(/^TX-/,'');
    MK_DATA.TXNS.unshift({
      id: rfId,
      at: new Date().toISOString(),
      type: 'refund',
      refundOf: _refundTxId,
      cashier: STATE.user.name,
      lines: lines.map(l=>({...l})),
      sub: -rfTotal, tax: 0, total: -rfTotal,
      payment: tx.payment
    });
    audit('refund', {id:rfId, refundOf:_refundTxId, total:rfTotal, lines:indices});
    document.getElementById('refund-modal').classList.remove('show');
    MKO.toast('↩ '+t('refund')+' '+fmtNum(rfTotal)+' IQD','ok');
    MK.bus.emit('orders.updated');
  }

  // ================== HELPERS ==================
  function T_(){ return MK.T[STATE.lang]; }

  // ================== PUBLIC ==================
  window.MKV = {
    renderTables, selectTable, setFloor, seatTable, clearTable, cleanTable, checkin, openTableOrder, actTransfer, actMerge,
    openAddTable, openEditTable, saveNewTable, saveTable, deleteTable,
    openManageFloors, saveFloor, addFloor, deleteFloor, closeMgmt,
    renderKDS, kdsAdvance,
    renderInv, invReceive, invAdjust, invExport,
    renderReservations, seatRes, cancelRes, acceptPickup, rejectPickup,
    renderCustomers, setCustQ, custExport,
    renderReports, setRange, rptExport, exportAll,
    openShiftClose, updateShiftCalc, confirmShiftClose,
    openRefund, findRefundOrder, processRefund
  };
})();
