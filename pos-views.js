/* ============================================================
   Mr. Kim's POS — Tables, KDS, Inventory, Reservations, Customers, Reports
   ============================================================ */

(function(){
  const {STATE, t, itemName, fmtIQD, fmtNum, fmtTime, fmtDate, fmtDateTime,
         stockStatus, exportCSV, exportXLS, exportJSON, audit, restoreIngredients} = MK;
  const {INV, CUSTOMERS, RESERVATIONS, PICKUPS, MENU} = MK_DATA;

  // local esc for safe HTML interpolation (XSS guard)
  const esc = (s)=> String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  // ================== TABLES VIEW ==================
  let selTable = null;
  let currentFloor = (MK_DATA.FLOORS&&MK_DATA.FLOORS[0]) ? MK_DATA.FLOORS[0].id : 'F1';
  let editMode = false;
  function toggleEditMode(){
    editMode = !editMode;
    const btn = document.getElementById('tv-edit-btn');
    if(btn) btn.classList.toggle('active', editMode);
    if(editMode) MKO.toast(STATE.lang==='ar'?'وضع التعديل مفعّل':'Edit mode ON');
    else MKO.toast(STATE.lang==='ar'?'وضع التعديل متوقف':'Edit mode OFF');
    renderTables();
  }
  const SHAPE_DEFAULTS = { bar:{w:44,h:44}, rect:{w:120,h:100}, square:{w:86,h:86}, round:{w:80,h:80} };
  function _tblSize(tbl){
    const d = SHAPE_DEFAULTS[tbl.shape] || {w:80,h:80};
    return { w: tbl.w || d.w, h: tbl.h || d.h };
  }

  function renderFloorTabs(){
    const tabs = document.getElementById('tv-tabs');
    if(!tabs) return;
    tabs.innerHTML = MK_DATA.FLOORS.map(f=>`<button class="tv-tab${currentFloor===f.id?' active':''}" onclick="MKV.setFloor('${f.id}')">${STATE.lang==='ar'?f.name_ar:f.name_en}</button>`).join('');
  }

  function setFloor(id){ currentFloor=id; selTable=null; closeMgmt(); renderFloorTabs(); renderTables(); }

  // Drag-to-move/resize/rotate table positioning (with click-vs-drag threshold)
  let _dragState = null;
  function _attachDragHandlers(map){
    if(map._dragSetup) return;
    map._dragSetup = true;
    const onDown = (ev)=>{
      const isTouch = ev.type === 'touchstart';
      const pt = isTouch ? ev.touches[0] : ev;
      const bgEl = ev.target.closest && ev.target.closest('.tv-map-bg');
      const handle = ev.target.closest && ev.target.closest('.resize-handle, .rotate-handle');
      // BG drag/resize (edit mode only)
      if(editMode && bgEl && map.contains(bgEl) && !ev.target.closest('.tbl-node')){
        const floorObj = (MK_DATA.FLOORS||[]).find(x=>x.id===currentFloor);
        if(!floorObj) return;
        let mode = 'drag';
        let handleDir = null;
        if(handle){ mode='resize'; handleDir = ['tl','tr','bl','br'].find(c=>handle.classList.contains(c)); }
        _dragState = {
          target: 'bg', node: bgEl, floorObj, mode, handleDir,
          startX: pt.clientX, startY: pt.clientY,
          origX: floorObj.bgX||0, origY: floorObj.bgY||0,
          origW: floorObj.bgW||1100, origH: floorObj.bgH||650,
          curX: floorObj.bgX||0, curY: floorObj.bgY||0, curW: floorObj.bgW||1100, curH: floorObj.bgH||650,
          mapRect: map.getBoundingClientRect(), moved: false
        };
        if(!isTouch) ev.preventDefault();
        return;
      }
      const node = ev.target.closest && ev.target.closest('.tbl-node');
      if(!node || !map.contains(node)) return;
      const id = node.dataset.tid;
      const tbl = MK_DATA.TABLES.find(t=>t.id===id);
      if(!tbl) return;
      let mode = 'drag';
      let handleDir = null;
      if(handle && editMode){
        if(handle.classList.contains('rotate-handle')) mode = 'rotate';
        else { mode = 'resize'; handleDir = ['tl','tr','bl','br'].find(c=>handle.classList.contains(c)); }
      }
      const sz = _tblSize(tbl);
      _dragState = {
        target: 'tbl',
        id, node, tbl, mode, handleDir,
        startX: pt.clientX, startY: pt.clientY,
        origX: tbl.x, origY: tbl.y,
        origW: sz.w, origH: sz.h,
        origRot: tbl.rot || 0,
        curX: tbl.x, curY: tbl.y, curW: sz.w, curH: sz.h, curRot: tbl.rot||0,
        mapRect: map.getBoundingClientRect(),
        moved: false
      };
      if(!isTouch) ev.preventDefault();
    };
    const onMove = (ev)=>{
      if(!_dragState) return;
      const isTouch = ev.type === 'touchmove';
      const pt = isTouch ? ev.touches[0] : ev;
      const dx = pt.clientX - _dragState.startX;
      const dy = pt.clientY - _dragState.startY;
      if(!_dragState.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)){
        _dragState.moved = true;
        if(_dragState.mode==='drag') _dragState.node.classList.add('dragging');
      }
      if(!_dragState.moved) return;
      const ds = _dragState;
      if(ds.target === 'bg'){
        if(ds.mode === 'drag'){
          const nx = ds.origX + dx;
          const ny = ds.origY + dy;
          ds.node.style.left = nx + 'px';
          ds.node.style.top = ny + 'px';
          ds.curX = nx; ds.curY = ny;
        } else if(ds.mode === 'resize'){
          let nw = ds.origW, nh = ds.origH, nx = ds.origX, ny = ds.origY;
          if(ds.handleDir === 'br'){ nw = ds.origW + dx; nh = ds.origH + dy; }
          else if(ds.handleDir === 'bl'){ nw = ds.origW - dx; nh = ds.origH + dy; nx = ds.origX + dx; }
          else if(ds.handleDir === 'tr'){ nw = ds.origW + dx; nh = ds.origH - dy; ny = ds.origY + dy; }
          else if(ds.handleDir === 'tl'){ nw = ds.origW - dx; nh = ds.origH - dy; nx = ds.origX + dx; ny = ds.origY + dy; }
          nw = Math.max(100, Math.min(3000, nw));
          nh = Math.max(100, Math.min(3000, nh));
          ds.node.style.width = nw + 'px';
          ds.node.style.height = nh + 'px';
          ds.node.style.left = nx + 'px';
          ds.node.style.top = ny + 'px';
          ds.curW = nw; ds.curH = nh; ds.curX = nx; ds.curY = ny;
        }
        if(isTouch) ev.preventDefault();
        return;
      }
      if(ds.mode === 'drag'){
        if(!editMode){ ds.moved=false; ds.node.classList.remove('dragging'); return; } // dragging requires edit mode
        const w = ds.node.offsetWidth, h = ds.node.offsetHeight;
        const maxX = Math.max(0, ds.mapRect.width - w);
        const maxY = Math.max(0, ds.mapRect.height - h);
        const nx = Math.max(0, Math.min(maxX, ds.origX + dx));
        const ny = Math.max(0, Math.min(maxY, ds.origY + dy));
        ds.node.style.left = nx + 'px';
        ds.node.style.top = ny + 'px';
        ds.curX = nx; ds.curY = ny;
      } else if(ds.mode === 'resize'){
        let nw = ds.origW, nh = ds.origH, nx = ds.origX, ny = ds.origY;
        if(ds.handleDir === 'br'){ nw = ds.origW + dx; nh = ds.origH + dy; }
        else if(ds.handleDir === 'bl'){ nw = ds.origW - dx; nh = ds.origH + dy; nx = ds.origX + dx; }
        else if(ds.handleDir === 'tr'){ nw = ds.origW + dx; nh = ds.origH - dy; ny = ds.origY + dy; }
        else if(ds.handleDir === 'tl'){ nw = ds.origW - dx; nh = ds.origH - dy; nx = ds.origX + dx; ny = ds.origY + dy; }
        nw = Math.max(30, Math.min(400, nw));
        nh = Math.max(30, Math.min(400, nh));
        ds.node.style.width = nw + 'px';
        ds.node.style.height = nh + 'px';
        ds.node.style.left = nx + 'px';
        ds.node.style.top = ny + 'px';
        ds.curW = nw; ds.curH = nh; ds.curX = nx; ds.curY = ny;
      } else if(ds.mode === 'rotate'){
        const rect = ds.node.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const ang = Math.atan2(pt.clientY - cy, pt.clientX - cx) * 180 / Math.PI + 90;
        ds.curRot = Math.round(ang);
        ds.node.style.transform = `rotate(${ds.curRot}deg)`;
      }
      if(isTouch) ev.preventDefault();
    };
    const onUp = ()=>{
      if(!_dragState) return;
      const ds = _dragState;
      _dragState = null;
      ds.node.classList.remove('dragging');
      if(ds.target === 'bg'){
        if(ds.moved){
          ds.floorObj.bgX = Math.round(ds.curX);
          ds.floorObj.bgY = Math.round(ds.curY);
          ds.floorObj.bgW = Math.round(ds.curW);
          ds.floorObj.bgH = Math.round(ds.curH);
          if(MK_DATA.saveFloors) MK_DATA.saveFloors();
          renderTables();
        }
        return;
      }
      if(ds.moved){
        if(ds.mode === 'drag'){
          ds.tbl.x = Math.round(ds.curX); ds.tbl.y = Math.round(ds.curY);
        } else if(ds.mode === 'resize'){
          ds.tbl.x = Math.round(ds.curX); ds.tbl.y = Math.round(ds.curY);
          ds.tbl.w = Math.round(ds.curW); ds.tbl.h = Math.round(ds.curH);
        } else if(ds.mode === 'rotate'){
          ds.tbl.rot = ds.curRot;
        }
        MK_DATA.saveTables();
        renderTables();
      } else {
        selectTable(ds.id);
      }
    };
    map.addEventListener('mousedown', onDown);
    map.addEventListener('touchstart', onDown, {passive:false});
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
  }

  let _clipboardTbl = null;
  let _kbdSetup = false;
  function _setupKbd(){
    if(_kbdSetup) return;
    _kbdSetup = true;
    document.addEventListener('keydown', (e)=>{
      const tag = e.target && e.target.tagName;
      if(tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if(e.target && e.target.isContentEditable) return;
      const map = document.getElementById('tv-map');
      if(!map || map.offsetParent===null) return;
      const k = (e.key||'').toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if(mod && k==='c' && selTable){
        const tbl = MK_DATA.TABLES.find(t=>t.id===selTable);
        if(tbl){
          _clipboardTbl = JSON.parse(JSON.stringify(tbl));
          if(MKO && MKO.toast) MKO.toast(STATE.lang==='ar'?'نُسخت الطاولة':'Table copied');
          e.preventDefault();
        }
      } else if(mod && k==='v' && _clipboardTbl){
        const prefix = currentFloor;
        let n = MK_DATA.TABLES.filter(t=>t.floor===currentFloor).length + 1;
        let newId;
        do { newId = prefix + String(n).padStart(2,'0'); n++; } while(MK_DATA.TABLES.find(t=>t.id===newId) && n < 9999);
        const clone = JSON.parse(JSON.stringify(_clipboardTbl));
        clone.id = newId;
        clone.floor = currentFloor;
        clone.x = (clone.x||0) + 20;
        clone.y = (clone.y||0) + 20;
        MK_DATA.TABLES.push(clone);
        MK_DATA.saveTables();
        selTable = newId;
        renderTables();
        if(MKO && MKO.toast) MKO.toast(`✓ ${newId}`);
        e.preventDefault();
      }
    });
  }

  const FLOOR_BLUEPRINT_FALLBACK = { F1: 'blueprint-f1.png', F2: 'blueprint-f2.png' };
  function _floorBlueprint(floorId){
    const f = (MK_DATA.FLOORS||[]).find(x=>x.id===floorId);
    if(f && f.blueprint) return f.blueprint;
    return FLOOR_BLUEPRINT_FALLBACK[floorId] || '';
  }

  function renderTables(){
    renderFloorTabs();
    const L = T_();
    const map = document.getElementById('tv-map');
    const bp = _floorBlueprint(currentFloor);
    map.style.backgroundImage = '';
    const floorObj = (MK_DATA.FLOORS||[]).find(x=>x.id===currentFloor);
    let bgHtml = '';
    if(bp){
      const bpRotate = (floorObj && floorObj.blueprintRotate) || 0;
      const bpFlipH = (floorObj && floorObj.blueprintFlipH) || false;
      const bpFlipV = (floorObj && floorObj.blueprintFlipV) || false;
      const tfs = [];
      if(bpRotate) tfs.push(`rotate(${bpRotate}deg)`);
      if(bpFlipH) tfs.push('scaleX(-1)');
      if(bpFlipV) tfs.push('scaleY(-1)');
      const tfStr = tfs.length ? tfs.join(' ') : 'none';
      const bgX = (floorObj && floorObj.bgX) != null ? floorObj.bgX : 0;
      const bgY = (floorObj && floorObj.bgY) != null ? floorObj.bgY : 0;
      const bgW = (floorObj && floorObj.bgW) || 1100;
      const bgH = (floorObj && floorObj.bgH) || 650;
      const handles = `<span class="resize-handle tl"></span><span class="resize-handle tr"></span><span class="resize-handle bl"></span><span class="resize-handle br"></span>`;
      bgHtml = `<div class="tv-map-bg" data-bg="1" style="left:${bgX}px;top:${bgY}px;width:${bgW}px;height:${bgH}px;background-image:url('${bp}');background-size:100% 100%;transform:${tfStr}">${handles}</div>`;
    }
    map.classList.toggle('editing', editMode);
    const floorTbls = MK_DATA.TABLES.filter(t=>t.floor===currentFloor);
    const tblHtml = floorTbls.map(tbl=>{
      const s = STATE.onlineTables[tbl.id] || {status:'free'};
      const cls = ['tbl-node', tbl.shape, s.status, selTable===tbl.id?'sel':''].filter(Boolean).join(' ');
      const styles = [`left:${tbl.x}px`, `top:${tbl.y}px`];
      if(tbl.w) styles.push(`width:${tbl.w}px`);
      if(tbl.h) styles.push(`height:${tbl.h}px`);
      if(tbl.rot) styles.push(`transform:rotate(${tbl.rot}deg)`);
      const seatLbl = tbl.label || (tbl.seats+'');
      const handles = `<span class="resize-handle tl"></span><span class="resize-handle tr"></span><span class="resize-handle bl"></span><span class="resize-handle br"></span><span class="rotate-handle"></span>`;
      return `<div class="${cls}" style="${styles.join(';')}" data-tid="${tbl.id}">
        <div>${tbl.id}</div>
        <div class="ts">${seatLbl==='Bar'||seatLbl==='Patio'?seatLbl:tbl.seats+' '+L.seats}</div>
        ${handles}
      </div>`;
    }).join('');
    map.innerHTML = bgHtml + tblHtml;
    const editBtn = document.getElementById('tv-edit-btn');
    if(editBtn) editBtn.classList.toggle('active', editMode);
    _attachDragHandlers(map);
    _setupKbd();

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
        <div class="id">${esc(tbl.id)} ${tbl.label?'· '+esc(tbl.label):''}</div>
        <div class="meta">${tbl.seats} ${L.seats} · ${esc(tbl.shape)}</div>
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
        <button onclick="MKV.showTableQR('${tbl.id}')" style="background:#1a5e38;color:#fff;border-color:#1a5e38">⬛ QR</button>
      </div>`;
  }

  function seatTable(id){ STATE.onlineTables[id]={status:'occupied',orderId:'TX-'+String(parseInt(STATE.order.id.replace(/\D/g,''))+100).padStart(5,'0')}; MK.audit('table.seat',id); MKO.toast(`✓ ${id}`); renderTables(); }
  function clearTable(id){ STATE.onlineTables[id]={status:'dirty'}; MK.audit('table.clear',id); MKO.toast(`🧹 ${id}`); renderTables(); }
  function cleanTable(id){ STATE.onlineTables[id]={status:'free'}; MK.audit('table.clean',id); renderTables(); }
  function checkin(id){ STATE.onlineTables[id]={status:'occupied',orderId:'TX-'+String(parseInt(STATE.order.id.replace(/\D/g,''))+101).padStart(5,'0')}; MK.audit('table.checkin',id); renderTables(); }
  function openTableOrder(id){ STATE.order.table=id; STATE.view='order'; MK.bus.emit('nav','order'); }

  async function showTableQR(tableId){
    const ar = STATE.lang==='ar';
    const modal = document.getElementById('qr-modal');
    const body  = document.getElementById('qr-modal-body');
    if(!modal||!body) return;
    body.innerHTML = `<div style="text-align:center;padding:24px;color:#9aa5a0">${ar?'جارٍ إنشاء الرمز…':'Generating QR…'}</div>`;
    modal.classList.add('show');
    try {
      const authHeaders = (typeof cashierHeaders === 'function')
        ? cashierHeaders()
        : { 'x-cashier-token': (window.cashierToken||'') };
      // 1) create/refresh token for this table
      const tokRes = await fetch('/api/table-tokens', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...authHeaders },
        body: JSON.stringify({ tableNum: tableId })
      });
      if(!tokRes.ok) throw new Error('token http '+tokRes.status);
      const tokData = await tokRes.json();
      if(!tokData.token) throw new Error('token missing');
      const token = tokData.token;
      // 2) build the URL the customer will land on
      const base = window.location.origin;
      const customerUrl = `${base}/?t=${token}&table=${encodeURIComponent(tableId)}`;
      // 3) fetch QR image from server
      const qrRes = await fetch(`/api/qr-image?url=${encodeURIComponent(customerUrl)}`, { headers: authHeaders });
      if(!qrRes.ok) throw new Error('qr http '+qrRes.status);
      const qrData = await qrRes.json();
      if(!qrData.dataUrl) throw new Error('no dataUrl');
      body.innerHTML = `
        <div style="text-align:center;padding:16px">
          <div style="font-size:13px;font-weight:900;color:#111;margin-bottom:8px">${ar?'طاولة':'Table'} ${tableId}</div>
          <img src="${qrData.dataUrl}" style="width:200px;height:200px;border-radius:8px;border:2px solid #e6ebe7">
          <div style="font-size:10px;color:#9aa5a0;margin-top:8px;word-break:break-all;max-width:240px;margin-inline:auto">${customerUrl}</div>
          <button onclick="MKV._printQR('${tableId}','${qrData.dataUrl}')" style="margin-top:14px;background:#1a5e38;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:13px;font-weight:900;cursor:pointer">${ar?'طباعة':'Print QR'}</button>
        </div>`;
    } catch(e) {
      body.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444">${ar?'فشل إنشاء QR':'Failed to generate QR'}</div>`;
    }
  }

  function _printQR(tableId, dataUrl){
    const ar = STATE.lang==='ar';
    const w = window.open('','_blank','width=400,height=500');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR ${tableId}</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff}
      h2{margin:0 0 12px;font-size:18px}img{width:220px;height:220px}p{font-size:12px;color:#666;margin-top:8px}</style></head>
      <body><h2>Mr. Kim's Café</h2><p>${ar?'طاولة':'Table'} ${tableId}</p><img src="${dataUrl}"><p>${ar?'امسح للطلب':'Scan to order'}</p></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(), 300);
  }

  function _pickTablePanel(fromId, mode){
    const ar = STATE.lang==='ar';
    const title = mode==='transfer'
      ? (ar?'انقل إلى':'Transfer to')
      : (ar?'ادمج مع':'Merge with');
    const candidates = MK_DATA.TABLES.filter(t=>{
      if(t.id===fromId) return false;
      const s = STATE.onlineTables[t.id]||{status:'free'};
      return mode==='transfer' ? s.status==='free' : s.status==='occupied';
    });
    const m = document.getElementById('tv-mgmt');
    if(!m) return;
    m.classList.remove('hidden');
    if(!candidates.length){
      m.innerHTML = `<h4>${title}</h4><div style="padding:12px;color:#9aa5a0;font-size:12px">${ar?'لا توجد طاولات مناسبة':'No eligible tables'}</div><div class="mactions"><button onclick="MKV.closeMgmt()">✕</button></div>`;
      return;
    }
    const buttons = candidates.map(t=>{
      const s = STATE.onlineTables[t.id]||{status:'free'};
      const label = t.label?` · ${t.label}`:'';
      return `<button class="prim" style="margin:3px;min-width:88px" onclick="MKV.confirm${mode==='transfer'?'Transfer':'Merge'}('${fromId}','${t.id}')">${t.id}${label} <span style="opacity:.7;font-size:10px">${t.floor}</span></button>`;
    }).join('');
    m.innerHTML = `<h4>${title} (${fromId})</h4><div style="display:flex;flex-wrap:wrap;gap:4px;padding:6px 0">${buttons}</div><div class="mactions"><button onclick="MKV.closeMgmt()">${ar?'إلغاء':'Cancel'}</button></div>`;
  }

  function actTransfer(id){
    const s = STATE.onlineTables[id];
    if(!s || s.status!=='occupied'){ MKO.toast(STATE.lang==='ar'?'الطاولة غير مشغولة':'Table not occupied','warn'); return; }
    _pickTablePanel(id, 'transfer');
  }
  function confirmTransfer(fromId, toId){
    const src = STATE.onlineTables[fromId];
    const dst = STATE.onlineTables[toId];
    if(!src || src.status!=='occupied' || (dst && dst.status!=='free')){
      MKO.toast(STATE.lang==='ar'?'تعذر النقل':'Transfer failed','err'); closeMgmt(); return;
    }
    STATE.onlineTables[toId] = {...src};
    STATE.onlineTables[fromId] = {status:'dirty'};
    selTable = toId;
    MK.audit('table.transfer',{from:fromId,to:toId});
    MKO.toast(`↔ ${fromId}→${toId}`,'ok');
    closeMgmt(); renderTables();
  }
  function actMerge(id){
    const s = STATE.onlineTables[id];
    if(!s || s.status!=='occupied'){ MKO.toast(STATE.lang==='ar'?'الطاولة غير مشغولة':'Table not occupied','warn'); return; }
    _pickTablePanel(id, 'merge');
  }
  function confirmMerge(a, b){
    const sa = STATE.onlineTables[a], sb = STATE.onlineTables[b];
    if(!sa || !sb || sa.status!=='occupied' || sb.status!=='occupied'){
      MKO.toast(STATE.lang==='ar'?'تعذر الدمج':'Merge failed','err'); closeMgmt(); return;
    }
    const mergedOrder = sa.orderId || sb.orderId;
    STATE.onlineTables[a] = {status:'occupied', orderId: mergedOrder, mergedWith:[...(sa.mergedWith||[]), b]};
    STATE.onlineTables[b] = {status:'dirty'};
    MK.audit('table.merge',{primary:a, absorbed:b, orderId: mergedOrder});
    MKO.toast(`⤵ ${a}+${b}`,'ok');
    closeMgmt(); renderTables();
  }

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
        <div><label>X</label><input id="tf-x" type="number" value="${tbl?tbl.x:100}" min="0" max="1080"/></div>
        <div><label>Y</label><input id="tf-y" type="number" value="${tbl?tbl.y:100}" min="0" max="630"/></div>
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

  function _uploadBlueprint(id, input){
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const f = MK_DATA.FLOORS.find(x=>x.id===id); if(!f) return;
      f.blueprint = e.target.result;
      MK_DATA.saveFloors();
      _renderFloorMgmt();
      if(currentFloor===id) renderTables();
      MKO.toast('✓');
    };
    reader.readAsDataURL(file);
  }

  function _clearBlueprint(id){
    const f = MK_DATA.FLOORS.find(x=>x.id===id); if(!f) return;
    delete f.blueprint;
    MK_DATA.saveFloors();
    _renderFloorMgmt();
    if(currentFloor===id) renderTables();
    MKO.toast('🗑');
  }

  function _onBpModeChange(id){
    const sel = document.getElementById('fbpmode-'+id);
    const sliderRow = document.getElementById('fbpzoom-row-'+id);
    if(!sel || !sliderRow) return;
    sliderRow.style.display = sel.value === 'custom' ? 'flex' : 'none';
  }

  function _rotateBlueprint(id, deg){
    const f = MK_DATA.FLOORS.find(x=>x.id===id); if(!f) return;
    f.blueprintRotate = (((f.blueprintRotate||0) + deg) % 360 + 360) % 360;
    MK_DATA.saveFloors();
    _renderFloorMgmt();
    if(currentFloor===id) renderTables();
  }

  function _flipBlueprint(id, axis){
    const f = MK_DATA.FLOORS.find(x=>x.id===id); if(!f) return;
    if(axis==='H') f.blueprintFlipH = !f.blueprintFlipH;
    else f.blueprintFlipV = !f.blueprintFlipV;
    MK_DATA.saveFloors();
    _renderFloorMgmt();
    if(currentFloor===id) renderTables();
  }

  function _renderFloorMgmt(){
    const m=document.getElementById('tv-mgmt'); if(!m) return;
    const isAr = STATE.lang==='ar';
    m.innerHTML=`
      <h4>${isAr?'إدارة الطوابق':'Manage Floors'}</h4>
      ${MK_DATA.FLOORS.map(f=>{
        const imgSrc = f.blueprint || (f.id==='F1'?'blueprint-f1.png':f.id==='F2'?'blueprint-f2.png':'');
        const mode = f.blueprintMode || 'contain';
        const zoom = f.blueprintZoom || 100;
        const rotate = f.blueprintRotate || 0;
        const flipH = !!f.blueprintFlipH;
        const flipV = !!f.blueprintFlipV;
        return `
        <div class="floor-row floor-row-full">
          <div class="floor-row-names">
            <input id="flen-${f.id}" value="${f.name_en}" placeholder="English"/>
            <input id="flar-${f.id}" value="${f.name_ar}" placeholder="عربي"/>
            <button class="fl-save" onclick="MKV.saveFloor('${f.id}')">✓</button>
            <button class="fl-del" onclick="MKV.deleteFloor('${f.id}')">🗑</button>
          </div>
          <div class="floor-bg-row">
            ${imgSrc?`<img src="${imgSrc}" class="floor-bp-thumb"/>`:`<span class="floor-bp-empty"></span>`}
            <input type="file" id="fbp-${f.id}" accept="image/*" style="display:none" onchange="MKV._uploadBlueprint('${f.id}',this)"/>
            <button class="fl-save" onclick="document.getElementById('fbp-${f.id}').click()" title="${isAr?'تغيير الصورة':'Change image'}">🖼</button>
            ${f.blueprint?`<button class="fl-del" onclick="MKV._clearBlueprint('${f.id}')" title="${isAr?'إزالة':'Remove'}">✕</button>`:''}
            <select id="fbpmode-${f.id}" onchange="MKV._onBpModeChange('${f.id}')">
              <option value="contain" ${mode==='contain'?'selected':''}>Fit</option>
              <option value="cover" ${mode==='cover'?'selected':''}>Cover</option>
              <option value="100% 100%" ${mode==='100% 100%'?'selected':''}>Stretch</option>
              <option value="custom" ${mode==='custom'?'selected':''}>Custom %</option>
            </select>
          </div>
          <div class="floor-bg-row">
            <button class="fl-btn-icon" onclick="MKV._rotateBlueprint('${f.id}',-90)" title="Rotate left">↺</button>
            <button class="fl-btn-icon" onclick="MKV._rotateBlueprint('${f.id}',90)" title="Rotate right">↻</button>
            <span style="font-size:10px;font-weight:800;color:#6b7a6e;min-width:28px">${rotate}°</span>
            <button class="fl-btn-icon${flipH?' active':''}" onclick="MKV._flipBlueprint('${f.id}','H')" title="Flip horizontal">↔</button>
            <button class="fl-btn-icon${flipV?' active':''}" onclick="MKV._flipBlueprint('${f.id}','V')" title="Flip vertical">↕</button>
            <span style="font-size:10px;color:#9aa5a0;margin-left:2px">${isAr?'تدوير / قلب':'Rotate / Flip'}</span>
          </div>
          <div class="floor-zoom-row" id="fbpzoom-row-${f.id}" style="display:${mode==='custom'?'flex':'none'}">
            <input type="range" id="fbpzoom-${f.id}" min="10" max="300" value="${zoom}" style="flex:1" oninput="document.getElementById('fbpzoom-lbl-${f.id}').textContent=this.value+'%'"/>
            <span id="fbpzoom-lbl-${f.id}" style="min-width:38px;font-size:10px;font-weight:800;color:#367d4d">${zoom}%</span>
          </div>
        </div>`;
      }).join('')}
      <div class="fl-sep">
        <h4>${STATE.lang==='ar'?'إضافة طابق':'Add Floor'}</h4>
        <input id="fl-new-en" placeholder="English name" style="margin-bottom:4px"/>
        <input id="fl-new-ar" placeholder="اسم عربي"/>
        <div class="mactions" style="margin-top:6px">
          <button class="save" onclick="MKV.addFloor()">+ ${STATE.lang==='ar'?'إضافة':'Add'}</button>
          <button onclick="MKV.closeMgmt()">✕ ${STATE.lang==='ar'?'إغلاق':'Close'}</button>
        </div>
      </div>
      <div class="fl-sep">
        <h4>${STATE.lang==='ar'?'إعادة ضبط التخطيط':'Reset Layout'}</h4>
        <div style="font-size:11px;color:#5a6660;margin-bottom:6px">${STATE.lang==='ar'?'يستعيد جميع الطاولات والطوابق إلى التصميم الأصلي':'Restore all tables and floors to original blueprint'}</div>
        <button class="del" style="width:100%" onclick="MKV.resetLayout()">⟲ ${STATE.lang==='ar'?'إعادة ضبط':'Reset to Default'}</button>
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
    const modeEl=document.getElementById('fbpmode-'+id);
    if(modeEl) f.blueprintMode=modeEl.value;
    const zoomEl=document.getElementById('fbpzoom-'+id);
    if(zoomEl) f.blueprintZoom=parseInt(zoomEl.value)||100;
    MK_DATA.saveFloors(); renderFloorTabs();
    if(currentFloor===id) renderTables();
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

  function resetLayout(){
    if(!confirm(STATE.lang==='ar'?'إعادة ضبط جميع الطاولات والطوابق إلى التصميم الأصلي؟ سيتم فقدان أي تغييرات.':'Reset all tables and floors to original blueprint? Any changes will be lost.')) return;
    MK_DATA.resetFloorsToSeed();
    MK_DATA.resetTablesToSeed();
    selTable=null;
    currentFloor = MK_DATA.FLOORS[0].id;
    renderFloorTabs(); _renderFloorMgmt(); renderTables();
    MKO.toast('⟲ '+(STATE.lang==='ar'?'تم':'Reset'));
  }

  // ================== KDS VIEW ==================
  // Station routing: C/I/T/S (drinks) -> barista, D/F (desserts/food) -> kitchen
  function kdsStation(sku){
    if(!sku) return 'other';
    const p = String(sku).charAt(0).toUpperCase();
    if(p==='C'||p==='I'||p==='T'||p==='S') return 'barista';
    if(p==='D'||p==='F') return 'kitchen';
    return 'other';
  }
  function kdsStationBadge(st){
    if(st==='barista') return '<span class="kds-st kds-st-bar" title="Barista">☕</span>';
    if(st==='kitchen') return '<span class="kds-st kds-st-kit" title="Kitchen">🍳</span>';
    return '';
  }
  function kdsSetFilter(f){
    STATE.kdsFilter = f;
    document.querySelectorAll('.kds-filter-tab').forEach(el=>{
      el.classList.toggle('active', el.dataset.f===f);
    });
    renderKDS();
  }
  function _kdsItems(k){
    const raw = k.lines || k.items || [];
    return raw.map(i => ({
      sku: i.sku || '',
      name: i.name || '',
      q: i.q || i.qty || 1,
      mods: i.mods || (Array.isArray(i.modsLabel) ? i.modsLabel.join(' · ') : '') || ''
    }));
  }
  function _kdsActive(){
    return (MK_DATA.TXNS||[]).filter(t =>
      t && (t.status==='incoming' || t.status==='preparing' || t.status==='ready')
      && !String(t.id||'').startsWith('RF-')
    );
  }
  function renderKDS(){
    const L = T_();
    const filter = STATE.kdsFilter || 'all';
    const colIncoming = document.getElementById('kds-incoming');
    const colPrep = document.getElementById('kds-preparing');
    const colReady = document.getElementById('kds-ready');
    if(!colIncoming || !colPrep || !colReady) return;
    const matchesFilter = (k) => {
      if(filter==='all') return true;
      return _kdsItems(k).some(i => kdsStation(i.sku)===filter);
    };
    const active = _kdsActive().filter(matchesFilter);
    const incoming = active.filter(k=>k.status==='incoming');
    const prep = active.filter(k=>k.status==='preparing');
    const ready = active.filter(k=>k.status==='ready');
    const card = (k)=>{
      const items = _kdsItems(k);
      const age = Math.max(0, Math.round((Date.now()-new Date(k.at).getTime())/60000));
      const urg = age >= 5;
      const lines = items.map(i=>{
        const st = kdsStation(i.sku);
        const dim = (filter!=='all' && st!==filter) ? 'kl-dim' : '';
        return `<div class="kl ${dim}"><div class="kn">${kdsStationBadge(st)}${i.q}× ${esc(i.name)}</div>${i.mods?`<div class="km">${esc(i.mods)}</div>`:''}</div>`;
      }).join('');
      const nextAct = k.status==='incoming'?`<button class="kds-bump" onclick="MKV.kdsAdvance('${k.id}')">▶ ${L.preparing}</button>`:
                      k.status==='preparing'?`<button class="kds-bump" onclick="MKV.kdsAdvance('${k.id}')">✓ ${L.ready}</button>`:
                      `<button class="kds-bump" onclick="MKV.kdsAdvance('${k.id}')">🎉 ${L.bump}</button>`;
      const meta = [];
      if (k.customerName) meta.push(`👤 ${k.customerName}`);
      if (k.customerPhone) meta.push(`📞 ${k.customerPhone}`);
      const metaHtml = meta.length ? `<div class="km" style="font-size:11px;color:#555;margin:2px 0 4px">${meta.join(' · ')}</div>` : '';
      const stations = new Set(items.map(i=>kdsStation(i.sku)));
      const stHdr = [...stations].filter(s=>s!=='other').map(kdsStationBadge).join('');
      return `<div class="kds-card ${urg?'urgent':''}">
        <div class="kh">
          <div><span class="kid">${k.id}</span> <span class="kt">· ${k.table||'—'}</span></div>
          <span>${stHdr}<span class="age">${age}m</span></span>
        </div>
        ${metaHtml}
        ${lines}${nextAct}
      </div>`;
    };
    colIncoming.innerHTML = incoming.map(card).join('') || `<div style="color:#555;text-align:center;padding:20px;font-size:11px">—</div>`;
    colPrep.innerHTML = prep.map(card).join('') || `<div style="color:#555;text-align:center;padding:20px;font-size:11px">—</div>`;
    colReady.innerHTML = ready.map(card).join('') || `<div style="color:#555;text-align:center;padding:20px;font-size:11px">—</div>`;
    const ci = document.getElementById('kds-ct-i'); if(ci) ci.textContent = incoming.length;
    const cp = document.getElementById('kds-ct-p'); if(cp) cp.textContent = prep.length;
    const cr = document.getElementById('kds-ct-r'); if(cr) cr.textContent = ready.length;
  }

  function kdsAdvance(id){
    const k = (MK_DATA.TXNS||[]).find(x=>x.id===id); if(!k) return;
    if(k.status==='incoming') k.status='preparing';
    else if(k.status==='preparing') k.status='ready';
    else { k.status='done'; MK.audit('kds.complete',id); }
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
  async function _adjustInv(id, change_type, quantity, reason){
    const headers = (typeof window!=='undefined' && typeof window.cashierHeaders==='function')
      ? window.cashierHeaders() : {};
    const r = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ ingredient_id: id, change_type, quantity, reason })
    });
    if(!r.ok) throw new Error('adjust failed: '+r.status);
    if (MK_DATA.loadInventory) await MK_DATA.loadInventory(headers);
    renderInv();
  }
  function invReceive(k){
    const inv = INV.find(x=>x.k===k);
    if(!inv || inv.id == null){ MKO.toast('⚠ no id','warn'); return; }
    const v = prompt(STATE.lang==='ar'?`كمية الاستلام (${inv.unit}):`:`Receive qty (${inv.unit}):`, '');
    const n = parseFloat(v); if(!n||n<=0) return;
    _adjustInv(inv.id, 'in', n, 'cashier receive').then(()=>{
      MK.audit('inv.receive',{id:inv.id,qty:n});
      MKO.toast(`➕ ${n} ${inv.unit}`);
    }).catch(()=> MKO.toast('⚠ save failed','warn'));
  }
  function invAdjust(k){
    const inv = INV.find(x=>x.k===k);
    if(!inv || inv.id == null){ MKO.toast('⚠ no id','warn'); return; }
    const v = prompt(STATE.lang==='ar'?`الكمية الفعلية (${inv.unit}):`:`Actual qty (${inv.unit}):`, inv.qty);
    const n = parseFloat(v); if(isNaN(n)||n<0) return;
    const delta = n - (Number(inv.qty)||0);
    if (delta === 0) return;
    const change_type = delta > 0 ? 'in' : 'out';
    _adjustInv(inv.id, change_type, Math.abs(delta), 'cashier adjust').then(()=>{
      MK.audit('inv.adjust',{id:inv.id,delta});
      MKO.toast(`✏ ${n} ${inv.unit}`);
    }).catch(()=> MKO.toast('⚠ save failed','warn'));
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
  function _resWhen(r){
    if(r.at) return r.at;
    if(r.date && r.time) return r.date+'T'+r.time;
    if(r.date) return r.date+'T00:00';
    return new Date().toISOString();
  }
  function _resName(r){ return r.name || r.name_ar || r.name_en || '—'; }
  function renderReservations(){
    const L = T_();
    const AREA_LABELS = { floor_1: 'Floor 1', floor_2: 'Floor 2', study_room: 'Study Room' };
    const res = document.getElementById('rv-res');
    RESERVATIONS.sort((a,b)=> new Date(_resWhen(a)) - new Date(_resWhen(b)));
    res.innerHTML = RESERVATIONS.map(r=>{
      const when = _resWhen(r);
      const time = r.time || fmtTime(when);
      const areaLabel = r.table_num ? (AREA_LABELS[r.table_num] || r.table_num) : '';
      const tblOrNotes = areaLabel || r.table || r.notes || '';
      return `<div class="rs-card res">
        <div class="tm"><div class="hh">${time}</div><div class="am">${r.party||1}${L.seats.charAt(0)}</div></div>
        <div>
          <div class="m1">${esc(_resName(r))}</div>
          <div class="m2">${esc(r.phone||'—')}${tblOrNotes?' · 📍 '+esc(tblOrNotes):''} · ${L[r.status]||esc(r.status||'')}</div>
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
      const items = p.items.map(i=>{ const it = MENU.find(m=>m.sku===i.sku); return `${i.q}× ${esc(it?itemName(it):i.sku)}`; }).join(', ');
      return `<div class="rs-card pickup">
        <div class="tm"><div class="hh">${time}</div><div class="am">📱</div></div>
        <div>
          <div class="m1">${esc(p.name)}</div>
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
    MK_DATA.TXNS.unshift({
      id: 'PK-'+id.slice(2), table:'PICKUP', at: new Date().toISOString(), status:'incoming',
      lines: p.items.map(i=>{const it = MENU.find(m=>m.sku===i.sku); return {sku:i.sku, name: it?itemName(it):i.sku, q:i.q};})
    });
    PICKUPS.splice(idx,1);
    MK.audit('pickup.accept',id); MKO.toast('✓ '+id+' → '+t('kitchen'),'ok'); renderReservations();
    if(STATE.view==='kds' || STATE.view==='kitchen') renderKDS();
  }
  function rejectPickup(id){
    const idx = PICKUPS.findIndex(x=>x.id===id); if(idx<0) return;
    PICKUPS.splice(idx,1); MK.audit('pickup.reject',id); renderReservations();
  }

  // ================== ONLINE ORDERS VIEW ==================
  function _onlineHeaders(){
    try { return (typeof cashierHeaders === 'function') ? cashierHeaders() : {}; } catch(_) { return {}; }
  }
  function _onlineItemName(i){
    if(i.name) return i.name;
    const it = MENU.find(m=>m.sku===i.sku);
    return it ? itemName(it) : (i.sku || '?');
  }
  function _arrivalCountdown(arrivalTime){
    if(!arrivalTime) return null;
    const L = T_();
    const ms = new Date(arrivalTime).getTime() - Date.now();
    const mins = Math.round(ms/60000);
    if(mins < 0) return { text: Math.abs(mins)+'m '+L.overdue, urgent:true };
    return { text: mins+' '+L.minutesLeft, urgent: mins <= 5 };
  }
  function renderOnlineOrders(){
    const L = T_();
    const grid = document.getElementById('online-orders-list');
    if(!grid) return;
    const list = (MK_DATA.ONLINE_ORDERS||[]).filter(o=>o.status==='new');
    const ct = document.getElementById('oo-ct');
    if(ct) ct.textContent = list.length;
    if(!list.length){
      grid.innerHTML = `<div style="text-align:center;color:#9aa5a0;font-weight:700;font-size:12px;padding:40px;background:#fff;border-radius:8px;grid-column:1/-1">📱 ${L.noOnlineOrders}</div>`;
      return;
    }
    const TYPE_MAP = {
      dine:   { label:'DINE IN',   icon:'🍽️', cls:'t-dine'   },
      pickup: { label:'PICK UP',   icon:'🥡', cls:'t-pickup' },
      take:   { label:'TAKE OUT',  icon:'🛍️', cls:'t-take'   },
      deli:   { label:'DELIVERY',  icon:'🛵', cls:'t-deli'   }
    };
    grid.innerHTML = list.map(o=>{
      const time = fmtTime(o.at);
      const items = (o.items||[]).map(i=>{
        const qty = i.qty || i.q || 1;
        const size = i.size ? `<span class="oo-size">${esc(i.size)}</span>` : '';
        const price = (i.price!=null) ? `<div class="oo-line-price">${fmtNum(i.price*qty)} IQD</div>` : '';
        return `<div class="oo-line">
          <div class="oo-line-left">
            <span class="oo-qty">${qty}×</span>
            <span class="oo-line-name">${esc(_onlineItemName(i))}</span>
          </div>
          <div class="oo-line-right">${size}${price}</div>
        </div>`;
      }).join('');
      const tp = TYPE_MAP[o.type] || { label:(o.type||'ONLINE').toUpperCase(), icon:'📱', cls:'' };
      const cd = (o.type==='pickup') ? _arrivalCountdown(o.arrival_time) : null;
      const cdHtml = cd ? `<div class="oo-cd ${cd.urgent?'urg':''}">⏰ ${L.arrivalTime}: <b>${fmtTime(o.arrival_time)}</b> · <b>${esc(cd.text)}</b></div>` : '';
      const tableNum = o.table_num || o.table || o.tableNo || o.tableNum;
      const tableHtml = (o.type==='dine' && tableNum) ? `<div class="oo-meta oo-table-row"><span class="oo-meta-k">🪑 TABLE</span><span class="oo-meta-v oo-table-v">${esc(tableNum)}</span></div>` : '';
      const name = o.customer_name || '—';
      const phone = o.customer_phone || '—';
      return `<div class="oo-card ${cd&&cd.urgent?'urgent':''}">
        <div class="oo-banner ${tp.cls}">
          <span class="oo-banner-type">${tp.icon} ${tp.label}</span>
          <span class="oo-banner-id">#${esc(o.num||o.id)}</span>
        </div>
        <div class="oo-top">
          <span class="oo-time">🕒 ${time}</span>
        </div>
        ${tableHtml}
        <div class="oo-meta"><span class="oo-meta-k">👤 NAME</span><span class="oo-meta-v">${esc(name)}</span></div>
        <div class="oo-meta"><span class="oo-meta-k">📞 PHONE</span><span class="oo-meta-v">${esc(phone)}</span></div>
        ${cdHtml}
        <div class="oo-items">${items}</div>
        <div class="oo-tot">${fmtNum(o.total||0)} IQD</div>
        <div class="oo-act">
          <button class="prim" onclick="MKV.acceptOnlineOrder('${o.id}')">✓ ${L.accept}</button>
          <button class="rej" onclick="MKV.rejectOnlineOrder('${o.id}')">✕ ${L.reject}</button>
        </div>
      </div>`;
    }).join('');
  }
  async function acceptOnlineOrder(id){
    const arr = MK_DATA.ONLINE_ORDERS||[];
    const idx = arr.findIndex(x=>x.id===id); if(idx<0) return;
    const o = arr[idx];
    const L = T_();
    try {
      const r = await fetch('/api/orders/'+encodeURIComponent(id)+'/status', {
        method:'PUT',
        headers:{'Content-Type':'application/json', ..._onlineHeaders()},
        body: JSON.stringify({status:'making'})
      });
      if(!r.ok){ MKO.toast('✕ '+L.accept+' failed','err'); return; }
    } catch(e){ MKO.toast('✕ network','err'); return; }
    const _tn = o.table_num || o.table || o.tableNo || o.tableNum;
    let _tableLabel;
    if (o.type === 'pickup') _tableLabel = 'PICKUP';
    else if (o.type === 'dine' && _tn) _tableLabel = '🪑 TABLE ' + _tn;
    else if (o.type === 'dine') _tableLabel = 'DINE IN';
    else _tableLabel = (o.type || 'ONLINE').toUpperCase();
    const _kdsId = 'PK-'+String(id).slice(-5);
    const _existing = (MK_DATA.TXNS||[]).find(t=>t.id===id);
    const _entry = {
      id: _existing ? id : _kdsId,
      table: _tableLabel,
      at: o.at || new Date().toISOString(),
      status: 'incoming',
      type: o.type,
      tableNum: _tn || null,
      customerName: o.customer_name || null,
      customerPhone: o.customer_phone || null,
      orderNum: o.num || null,
      lines: (o.items||[]).map(i=>({sku:i.sku||'', name:_onlineItemName(i)+(i.size?` (${i.size})`:''), q: i.qty || i.q || 1}))
    };
    if(_existing){ Object.assign(_existing, _entry); }
    else { MK_DATA.TXNS.unshift(_entry); }
    arr.splice(idx,1);
    audit('online.accept', id);
    MKO.toast('✓ '+(o.num||id)+' → '+t('kitchen'),'ok');
    renderOnlineOrders();
    if(typeof updateOnlineBadge==='function') try{updateOnlineBadge();}catch(_){}
    if(STATE.view==='kds') renderKDS();
  }
  async function rejectOnlineOrder(id){
    const L = T_();
    const arr = MK_DATA.ONLINE_ORDERS||[];
    const idx = arr.findIndex(x=>x.id===id); if(idx<0) return;
    const o = arr[idx];
    if(!confirm((L.reject||'Reject')+' '+(o.num||id)+'?')) return;
    try {
      const r = await fetch('/api/orders/'+encodeURIComponent(id)+'/status', {
        method:'PUT',
        headers:{'Content-Type':'application/json', ..._onlineHeaders()},
        body: JSON.stringify({status:'cancelled'})
      });
      if(!r.ok){ MKO.toast('✕ '+L.reject+' failed','err'); return; }
    } catch(e){ MKO.toast('✕ network','err'); return; }
    arr.splice(idx,1);
    audit('online.reject', id);
    MKO.toast('✕ '+(o.num||id),'warn');
    renderOnlineOrders();
    if(typeof updateOnlineBadge==='function') try{updateOnlineBadge();}catch(_){}
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
          <div><div class="cn">${esc(nm)}</div><div class="cp">${esc(c.phone)} · ${esc(c.id)}</div></div>
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
  let _rptLoading = false;

  function _reportsHeaders(){
    try { return (typeof cashierHeaders === 'function') ? cashierHeaders() : {}; } catch(_) { return {}; }
  }

  async function renderReports(){
    const L = T_();
    // Pull real data from server before rendering. Better empty-but-real than fake.
    if(typeof MK_DATA.loadTxns === 'function' && !_rptLoading){
      _rptLoading = true;
      try { await MK_DATA.loadTxns(parseInt(rptRange)||1, _reportsHeaders()); }
      catch(_){ /* keep current TXNS on transient failure */ }
      finally { _rptLoading = false; }
    }
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

  async function rptExport(kind){
    if(typeof MK_DATA.loadTxns === 'function'){
      try { await MK_DATA.loadTxns(parseInt(rptRange)||1, _reportsHeaders()); } catch(e){ console.warn('[pos-rptExport] loadTxns failed, exporting stale data', e); }
    }
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

  async function confirmShiftClose(){
    const opening = parseFloat(document.getElementById('shift-open-cash')?.value)||0;
    const counted = parseFloat(document.getElementById('shift-counted-cash')?.value)||0;
    const cashSales = parseFloat(document.getElementById('shift-cash-sales-val')?.value)||0;
    const since = STATE.shift.startedAt;
    const txns = MK_DATA.TXNS.filter(tx=> !tx.id.startsWith('RF-') && tx.at >= since);
    const total = txns.reduce((s,tx)=>s+tx.total, 0);

    // Sprint 1.5: server validates close_shift / close_shift_force permissions
    // and audits. On 403 (variance + no force perm), prompt manager modal.
    const submitClose = async (managerOverride) => {
      return await fetch('/api/shift/close', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ..._reportsHeaders() },
        body: JSON.stringify({
          opening_cash: opening,
          counted_cash: counted,
          cash_sales:   cashSales,
          txn_count:    txns.length,
          started_at:   since,
          manager_override: managerOverride || undefined
        })
      });
    };

    let r = await submitClose(null);
    if (r.status === 403) {
      const err = await r.json().catch(()=>({}));
      if (err.error === 'permission_denied' && err.missing === 'close_shift') {
        MKO.toast('✕ Permission denied: close_shift', 'err');
        return;
      }
      if (err.error === 'permission_denied' && err.missing === 'close_shift_force') {
        if (!window.MKS?.requireManagerOverride) {
          MKO.toast('✕ Manager approval required (module not loaded)', 'err');
          return;
        }
        const hint = `Variance ${err.variance>0?'+':''}${err.variance} IQD requires manager approval`;
        const ok = await window.MKS.requireManagerOverride('close_shift_force', hint);
        if (!ok) { MKO.toast('Cancelled', 'warn'); return; }
        r = await submitClose(ok);
      }
    }
    if (!r.ok) {
      const err = await r.json().catch(()=>({}));
      MKO.toast('✕ '+(err.error || t('shiftClose')+' failed'), 'err');
      return;
    }

    // CSV export (post-success)
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
    if(tx.refunded===true || tx.refunded==='full'){
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

  let _refundBusy = false;
  async function processRefund(){
    if(!_refundTxId || _refundBusy) return;
    const tx = MK_DATA.TXNS.find(t=>t.id===_refundTxId);
    if(!tx) return;
    const checks = document.querySelectorAll('#refund-modal-body input[type=checkbox]:checked');
    if(!checks.length){ MKO.toast(t('findOrder')+' — '+t('confirm'),'warn'); return; }
    const indices = Array.from(checks).map(c=>parseInt(c.value));
    const lines = indices.map(i=>tx.lines[i]);
    const rfTotal = lines.reduce((s,l)=>s+(l.price*l.q),0);
    const remaining = (tx.lines||[]).length - ((tx.refundedLines||[]).length + indices.length);
    const isFull = remaining <= 0;

    const btn = document.getElementById('refund-confirm-btn');
    _refundBusy = true;
    if(btn) btn.disabled = true;
    try {
      // Sprint 1.5: send manager_override if available. The first attempt
      // is made without one — server replies 403 with `missing` if the
      // caller lacks permission or the amount exceeds their refund_max_iqd.
      // We then prompt the manager modal and retry inline.
      const submitRefund = async (managerOverride) => {
        return await fetch('/api/orders/'+encodeURIComponent(_refundTxId)+'/refund', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', ..._reportsHeaders() },
          body: JSON.stringify({
            lines: lines.map(l=>({ name:l.name, qty:l.q, price:l.price })),
            total: rfTotal,
            full: isFull,
            manager_override: managerOverride || undefined
          })
        });
      };

      let r = await submitRefund(null);
      if (r.status === 403) {
        const err = await r.json().catch(()=>({}));
        if (err.error === 'permission_denied') {
          // Trigger manager-override modal (settings module exposes it globally)
          if (!window.MKS?.requireManagerOverride) {
            MKO.toast('✕ Manager approval required (module not loaded)', 'err');
            return;
          }
          const reasonHint = err.reason === 'limit_exceeded'
            ? `Refund ${rfTotal} IQD exceeds your limit (${err.actor_limit||0} IQD)`
            : 'Refund requires manager approval';
          const ok = await window.MKS.requireManagerOverride('refund', reasonHint);
          if (!ok) { MKO.toast('Cancelled', 'warn'); return; }
          r = await submitRefund(ok);
        } else if (err.error === 'manager_limit_exceeded') {
          MKO.toast(`✕ Manager limit exceeded (${err.approver_limit||0} IQD)`, 'err');
          return;
        }
      }
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        MKO.toast('✕ '+(err.error || t('refund')+' failed'), 'err');
        return;
      }
      const data = await r.json();
      // Update local TXN state to mirror server outcome until next loadTxns refresh.
      tx.refundedLines = [...(tx.refundedLines||[]), ...indices];
      tx.refunded = isFull ? 'full' : 'partial';
      MK_DATA.TXNS.unshift({
        id: data.refund_id || ('RF-'+Date.now().toString(36).toUpperCase()),
        at: new Date().toISOString(),
        type: 'refund',
        refundOf: _refundTxId,
        cashier: (STATE.user && STATE.user.name) || '',
        lines: lines.map(l=>({...l})),
        sub: -rfTotal, tax: 0, total: -rfTotal,
        payment: tx.payment
      });
      audit('refund', { id:data.refund_id, refundOf:_refundTxId, total:rfTotal, lines:indices, full:isFull });
      document.getElementById('refund-modal').classList.remove('show');
      MKO.toast('↩ '+t('refund')+' '+fmtNum(rfTotal)+' IQD','ok');
      MK.bus.emit('orders.updated');
    } catch (e) {
      MKO.toast('✕ Network error','err');
    } finally {
      _refundBusy = false;
      if(btn) btn.disabled = false;
    }
  }

  // ================== HELPERS ==================
  function T_(){ return MK.T[STATE.lang]; }

  // ================== PUBLIC ==================
  window.MKV = {
    renderTables, selectTable, setFloor, toggleEditMode, seatTable, clearTable, cleanTable, checkin, openTableOrder, actTransfer, actMerge, confirmTransfer, confirmMerge,
    openAddTable, openEditTable, saveNewTable, saveTable, deleteTable,
    openManageFloors, saveFloor, addFloor, deleteFloor, closeMgmt, resetLayout, _uploadBlueprint, _clearBlueprint, _onBpModeChange, _rotateBlueprint, _flipBlueprint,
    renderKDS, kdsAdvance, kdsSetFilter,
    renderInv, invReceive, invAdjust, invExport,
    renderReservations, seatRes, cancelRes, acceptPickup, rejectPickup,
    renderOnlineOrders, acceptOnlineOrder, rejectOnlineOrder,
    renderCustomers, setCustQ, custExport,
    renderReports, setRange, rptExport, exportAll,
    openShiftClose, updateShiftCalc, confirmShiftClose,
    openRefund, findRefundOrder, processRefund,
    showTableQR, _printQR
  };
})();
