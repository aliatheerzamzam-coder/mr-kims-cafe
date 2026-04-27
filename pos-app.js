/* ============================================================
   Mr. Kim's POS — App Core: i18n, state, events, formatting,
                            receipts, CSV/XLSX export
   ============================================================ */

window.MK = (function(){

  // ---------- i18n ----------
  const T = {
    ar: {
      // nav / chrome
      order:'الطلب', tables:'الطاولات', kitchen:'المطبخ', inventory:'المخزون', reservations:'الحجوزات',
      customers:'العملاء', reports:'التقارير', settings:'الإعدادات', logout:'خروج',
      // order screen
      search:'ابحث بالاسم، SKU، أو رمز...', scan:'مسح', newOrder:'طلب جديد', parkOrder:'احفظ',
      all:'الكل', dine:'داخل', take:'استلام', deli:'توصيل', pickup:'طلب تطبيق',
      cart:'السلة', subtotal:'المجموع الفرعي', discount:'خصم', tax:'ضريبة 10%', total:'الإجمالي', pay:'الدفع',
      emptyCart:'السلة فارغة', tapToAdd:'اضغط منتج للإضافة', table:'طاولة', guest:'ضيف', addCustomer:'إضافة عميل',
      note:'ملاحظة', split:'تقسيم', cash:'نقداً', card:'بطاقة', zaincash:'ZainCash', switchPay:'Switch', stamps:'طوابع',
      received:'المستلم', change:'الباقي', due:'المطلوب', confirmPay:'تأكيد الدفع وطباعة',
      size:'الحجم', temp:'الحرارة', milk:'الحليب', shots:'الشوتات',
      qty:'الكمية', addToCart:'أضف للسلة',
      // tables
      floorMap:'خريطة الطاولات', free:'شاغرة', occupied:'مشغولة', reserved:'محجوزة', dirty:'للتنظيف',
      transfer:'نقل', merge:'دمج', seats:'مقاعد',
      // kitchen
      kds:'شاشة المطبخ', incoming:'واردة', preparing:'قيد التحضير', ready:'جاهزة', bump:'تم',
      // inventory
      item:'المادة', inStock:'المتوفر', min:'الحد الأدنى', status:'الحالة', cost:'التكلفة', value:'القيمة',
      adjust:'تعديل', receive:'استلام', good:'جيد', low:'منخفض', outStock:'نفذ',
      // reservations & pickups
      upcoming:'القادمة', time:'الوقت', party:'الأشخاص', phone:'الهاتف', confirmed:'مؤكد', pendingCap:'قيد الانتظار',
      seat:'تسكين', cancel:'إلغاء', today:'اليوم',
      // customers
      allCustomers:'جميع العملاء', visits:'الزيارات', totalSpent:'إجمالي الإنفاق', tier:'المستوى',
      gold:'ذهبي', silver:'فضي', bronze:'برونزي', redeemStamp:'استخدام طوابع',
      // reports
      salesToday:'مبيعات اليوم', ordersToday:'طلبات اليوم', avgOrder:'متوسط الطلب', topItems:'الأصناف الأكثر مبيعاً',
      hourly:'المبيعات بالساعة', byPayment:'حسب طريقة الدفع', byType:'حسب نوع الطلب',
      export:'تصدير إلى Excel', exportCSV:'CSV', exportJSON:'JSON',
      date:'التاريخ', dateRange:'الفترة', last7:'آخر 7 أيام', last30:'آخر 30 يوم',
      // misc
      save:'حفظ', close:'إغلاق', confirm:'تأكيد', yes:'نعم', no:'لا', remove:'حذف',
      online:'متصل', offline:'غير متصل', sync:'مزامنة',
      // receipt
      rcptTitle:'إيصال', rcptNo:'رقم', rcptDate:'التاريخ', rcptCashier:'الكاشير', thank:'شكراً لزيارتكم',
      // days
      day0:'أحد', day1:'اثن', day2:'ثلا', day3:'أرب', day4:'خمي', day5:'جمع', day6:'سبت',
      // shift / refund / receipt share
      shiftClose:'إغلاق الوردية', shiftSummary:'ملخص الوردية', openingCash:'النقد الافتتاحي',
      cashSalesLbl:'مبيعات نقدية', expectedCash:'النقد المتوقع', countedCash:'النقد المحسوب',
      variance:'الفارق', closeShift:'إغلاق وتصدير', refund:'استرداد', findOrder:'بحث',
      shareReceipt:'إجراءات الإيصال', printRcpt:'طباعة', shareWA:'مشاركة WhatsApp', lowStockWarn:'مخزون منخفض',
      onlineOrders:'طلبات الإنترنت', accept:'قبول', reject:'رفض', noShow:'لم يحضر',
      autoCancelled:'تم الإلغاء تلقائياً', arrivalTime:'وقت الوصول', minutesLeft:'دقيقة متبقية',
      overdue:'متأخر', noOnlineOrders:'لا توجد طلبات إنترنت'
    },
    en: {
      order:'Order', tables:'Tables', kitchen:'Kitchen', inventory:'Inventory', reservations:'Reservations',
      customers:'Customers', reports:'Reports', settings:'Settings', logout:'Sign out',
      search:'Search name, SKU, or shortcut...', scan:'Scan', newOrder:'New Order', parkOrder:'Park',
      all:'All', dine:'Dine-in', take:'Takeout', deli:'Delivery', pickup:'App Pickup',
      cart:'Cart', subtotal:'Subtotal', discount:'Discount', tax:'Tax 10%', total:'Total', pay:'Pay',
      emptyCart:'Cart empty', tapToAdd:'Tap an item to add', table:'Table', guest:'Guest', addCustomer:'Add customer',
      note:'Note', split:'Split', cash:'Cash', card:'Card', zaincash:'ZainCash', switchPay:'Switch', stamps:'Stamps',
      received:'Received', change:'Change', due:'Due', confirmPay:'Confirm & Print',
      size:'Size', temp:'Temp', milk:'Milk', shots:'Shots', qty:'Qty', addToCart:'Add to cart',
      floorMap:'Floor Map', free:'Free', occupied:'Occupied', reserved:'Reserved', dirty:'Dirty',
      transfer:'Transfer', merge:'Merge', seats:'seats',
      kds:'Kitchen Display', incoming:'Incoming', preparing:'Preparing', ready:'Ready', bump:'Done',
      item:'Item', inStock:'In stock', min:'Min', status:'Status', cost:'Cost', value:'Value',
      adjust:'Adjust', receive:'Receive', good:'OK', low:'Low', outStock:'Out',
      upcoming:'Upcoming', time:'Time', party:'Party', phone:'Phone', confirmed:'Confirmed', pendingCap:'Pending',
      seat:'Seat', cancel:'Cancel', today:'Today',
      allCustomers:'All Customers', visits:'Visits', totalSpent:'Total Spent', tier:'Tier',
      gold:'Gold', silver:'Silver', bronze:'Bronze', redeemStamp:'Redeem Stamps',
      salesToday:'Sales Today', ordersToday:'Orders Today', avgOrder:'Avg Order', topItems:'Top Selling Items',
      hourly:'Hourly Sales', byPayment:'By Payment', byType:'By Order Type',
      export:'Export to Excel', exportCSV:'CSV', exportJSON:'JSON',
      date:'Date', dateRange:'Range', last7:'Last 7 days', last30:'Last 30 days',
      save:'Save', close:'Close', confirm:'Confirm', yes:'Yes', no:'No', remove:'Remove',
      online:'Online', offline:'Offline', sync:'Sync',
      rcptTitle:'RECEIPT', rcptNo:'No.', rcptDate:'Date', rcptCashier:'Cashier', thank:'Thank you!',
      day0:'Sun', day1:'Mon', day2:'Tue', day3:'Wed', day4:'Thu', day5:'Fri', day6:'Sat',
      shiftClose:'Shift Close', shiftSummary:'Shift Summary', openingCash:'Opening Cash',
      cashSalesLbl:'Cash Sales', expectedCash:'Expected Cash', countedCash:'Counted Cash',
      variance:'Variance', closeShift:'Close & Export', refund:'Refund', findOrder:'Search',
      shareReceipt:'Receipt Actions', printRcpt:'Print', shareWA:'Share WhatsApp', lowStockWarn:'Low Stock',
      onlineOrders:'Online Orders', accept:'Accept', reject:'Reject', noShow:'No-show',
      autoCancelled:'Auto-cancelled', arrivalTime:'Arrival', minutesLeft:'min left',
      overdue:'overdue', noOnlineOrders:'No online orders'
    }
    // NOTE: Korean (ko:) i18n removed per Iraq market requirement (English/Arabic only)
  };

  // ---------- STATE ----------
  const STATE = {
    lang: 'ar',
    view: 'order',           // order | tables | kitchen | inventory | reservations | customers | reports
    user: { name:'أحمد حسين', role:'owner', shift:'Shift 2' }, // owner sees everything
    cart: [],
    order: {
      id: 'TX-24821',
      type: 'dine',
      table: 'T03',
      customer: null,
      note: '',
      discount: 0,
      discountLabel: ''
    },
    parked: [],
    kdsQueue: [],
    kdsFilter: 'all',        // all | barista | kitchen

    onlineTables: {},        // T01 -> {status, orderId}
    audit: [],
    shift: { startedAt: new Date().toISOString(), openingCash: 0 }
  };

  // Seed a KDS queue + table states
  function seedRuntime(){
    // Tables default to free; live SSE/server state will override.
    MK_DATA.TABLES.forEach(t=>{ STATE.onlineTables[t.id] = {status:'free'}; });

    // Demo data only: gated by window.MK_DEMO so production cashiers don't see fake orders.
    if(!window.MK_DEMO) return;

    ['T01','T03','T05','T07','B01'].forEach(id=>{
      if(STATE.onlineTables[id]) STATE.onlineTables[id] = {status:'occupied', orderId:'TX-2482'+id.slice(-1)};
    });
    ['T04','P01'].forEach(id=>{
      if(STATE.onlineTables[id]) STATE.onlineTables[id] = {status:'reserved'};
    });
    ['T06'].forEach(id=>{
      if(STATE.onlineTables[id]) STATE.onlineTables[id] = {status:'dirty'};
    });

    STATE.kdsQueue = [];
  }

  // ---------- FORMATTING ----------
  const fmtIQD = (n) => Math.round(n).toLocaleString('en-US') + ' IQD';
  const fmtNum = (n) => Number(n).toLocaleString('en-US');
  const fmtTime = (iso) => { const d=new Date(iso); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
  const fmtDate = (iso) => { const d=new Date(iso); return d.toISOString().slice(0,10); };
  const fmtDateTime = (iso) => fmtDate(iso)+' '+fmtTime(iso);

  const t = (key) => (T[STATE.lang] && T[STATE.lang][key]) || T.en[key] || key;
  const itemName = (it) => it[STATE.lang] || it.en || it.ar;

  // ---------- EVENT BUS ----------
  const bus = { _l:{}, on(e,fn){(this._l[e]=this._l[e]||[]).push(fn)}, emit(e,p){(this._l[e]||[]).forEach(f=>f(p))} };

  // ---------- AUDIT LOG ----------
  function audit(action, detail){
    STATE.audit.push({at:new Date().toISOString(), by:STATE.user.name, action, detail});
    if(STATE.audit.length>500) STATE.audit.shift();
  }

  // ---------- CART MATH ----------
  function lineTotal(line){ return line.price * line.q; }
  function cartSub(){ return STATE.cart.reduce((s,l)=>s+lineTotal(l),0); }
  function cartDiscountAmt(sub){ return Math.round(sub * STATE.order.discount); }
  function cartTotals(){
    const sub = cartSub();
    const disc = cartDiscountAmt(sub);
    const afterDisc = sub - disc;
    const tax = Math.round(afterDisc * 0.1);
    const total = afterDisc + tax;
    return { sub, disc, afterDisc, tax, total };
  }

  // ---------- INVENTORY ----------
  function stockStatus(inv){
    if(inv.qty<=0) return 'out';
    if(inv.qty <= inv.min) return 'low';
    return 'good';
  }
  function isOutOfStock(item){
    return item && item.out === true;
  }
  function consumeIngredients(_line){
    // Server is authoritative on inventory deduction (server.js handles on order done).
  }

  function restoreIngredients(_line){
    // Server is authoritative on inventory restore (server.js handles on refund).
  }

  // ---------- CSV / XLSX (xml) ----------
  function csvEscape(v){
    if(v==null) return '';
    const s = String(v);
    if(/[",\n]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
    return s;
  }
  function toCSV(rows){
    return rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
  }
  function download(filename, content, mime){
    const blob = new Blob(['\uFEFF'+content], {type: mime || 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(url); a.remove();}, 0);
  }
  // Excel 2003 XML Spreadsheet — opens natively in Excel as .xls
  function toExcelXML(sheets){
    const esc = (s)=> String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const cell = (v)=>{
      if(typeof v === 'number') return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
      return `<Cell><Data ss:Type="String">${esc(v??'')}</Data></Cell>`;
    };
    const sheetsXml = sheets.map(s=>{
      const rows = s.rows.map(r=>`<Row>${r.map(cell).join('')}</Row>`).join('');
      return `<Worksheet ss:Name="${esc(s.name)}"><Table>${rows}</Table></Worksheet>`;
    }).join('');
    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 ${sheetsXml}
</Workbook>`;
  }
  function exportCSV(filename, rows){ download(filename+'.csv', toCSV(rows), 'text/csv;charset=utf-8'); audit('export',filename+'.csv'); }
  function exportXLS(filename, sheets){
    download(filename+'.xls', toExcelXML(sheets), 'application/vnd.ms-excel;charset=utf-8');
    audit('export', filename+'.xls');
  }
  function exportJSON(filename, data){ download(filename+'.json', JSON.stringify(data,null,2), 'application/json'); }

  // ---------- RECEIPT (printable HTML window) ----------
  function printReceipt(order){
    const w = window.open('', '_blank', 'width=360,height=700');
    const tot = order.totals;
    const L = T[STATE.lang];
    const lines = order.lines.map(l=>`
      <div class="r-line">
        <div class="r-name">${l.name}${l.mods?' <small>· '+l.mods+'</small>':''}</div>
        <div class="r-qp">${l.q} × ${fmtNum(l.price)}</div>
        <div class="r-tot">${fmtNum(l.price*l.q)}</div>
      </div>`).join('');
    const html = `<!doctype html><html dir="${STATE.lang==='ar'?'rtl':'ltr'}" lang="${STATE.lang}">
      <head><meta charset="utf-8"><title>${L.rcptTitle} ${order.id}</title>
      <style>
        @page{size:80mm auto;margin:0}
        body{font-family:'Cairo','Nunito',monospace;width:76mm;margin:6mm auto;color:#000;font-size:12px}
        .c{text-align:center}
        h1{font-size:18px;margin:0}
        .brand-g{color:#367d4d;font-weight:900;font-size:20px;letter-spacing:.05em}
        .rule{border-top:1px dashed #000;margin:8px 0}
        .r-line{display:grid;grid-template-columns:1fr auto auto;gap:6px;margin-bottom:4px;font-size:11px}
        .r-line small{color:#555;font-size:10px}
        .r-name{font-weight:700}
        .r-qp{text-align:center;color:#555}
        .r-tot{text-align:left;direction:ltr;font-weight:700}
        .tr{display:flex;justify-content:space-between;margin:2px 0}
        .tr.big{font-size:16px;font-weight:900;border-top:2px solid #000;padding-top:6px;margin-top:6px}
        .v{direction:ltr;font-weight:800}
        .meta{font-size:11px;display:flex;justify-content:space-between;margin:2px 0}
        .qr{text-align:center;margin-top:10px}
        .thank{text-align:center;font-weight:800;margin-top:14px;font-size:13px}
      </style></head>
      <body>
        <div class="c">
          <div class="brand-g">Mr. Kim's</div>
          <div>Korean Coffee House · Baghdad</div>
          <div>Al-Karrada · +964 770 000 1234</div>
        </div>
        <div class="rule"></div>
        <div class="meta"><span>${L.rcptNo}:</span><span class="v">${order.id}</span></div>
        <div class="meta"><span>${L.rcptDate}:</span><span class="v">${fmtDateTime(order.at||new Date().toISOString())}</span></div>
        <div class="meta"><span>${L.rcptCashier}:</span><span>${order.cashier||STATE.user.name}</span></div>
        ${order.table?`<div class="meta"><span>${L.table}:</span><span>${order.table}</span></div>`:''}
        <div class="rule"></div>
        ${lines}
        <div class="rule"></div>
        <div class="tr"><span>${L.subtotal}</span><span class="v">${fmtNum(tot.sub)}</span></div>
        ${tot.disc?`<div class="tr"><span>${L.discount}</span><span class="v">-${fmtNum(tot.disc)}</span></div>`:''}
        <div class="tr"><span>${L.tax}</span><span class="v">${fmtNum(tot.tax)}</span></div>
        <div class="tr big"><span>${L.total}</span><span class="v">${fmtNum(tot.total)} IQD</span></div>
        <div class="rule"></div>
        <div class="meta"><span>${L.cash==='نقداً'?'طريقة الدفع':'Payment'}:</span><span>${order.payment||'CASH'}</span></div>
        ${order.customerId?`<div class="meta"><span>${L.customers}:</span><span>${order.customerId}</span></div>`:''}
        <div class="thank">${L.thank} · ☕</div>
      </body></html>`;
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(), 100);
  }

  // ---------- KITCHEN TICKET (printable) ----------
  function printKitchen(order){
    const w = window.open('','_blank','width=300,height=500');
    const lines = order.lines.map(l=>`
      <div class="kl">
        <div class="kn">${l.q}× ${l.name}</div>
        ${l.mods?`<div class="km">${l.mods}</div>`:''}
      </div>`).join('');
    w.document.write(`<!doctype html><html dir="${STATE.lang==='ar'?'rtl':'ltr'}">
      <head><meta charset="utf-8"><style>
        @page{size:80mm auto;margin:0}
        body{font-family:Cairo,Nunito,monospace;width:76mm;margin:5mm auto;color:#000}
        .h{font-size:20px;font-weight:900;text-align:center}
        .id{font-size:14px;font-family:monospace;text-align:center;margin:6px 0}
        .rule{border-top:2px dashed #000;margin:6px 0}
        .kl{margin-bottom:10px}
        .kn{font-size:15px;font-weight:800}
        .km{font-size:12px;margin-left:12px;color:#333}
        .foot{margin-top:10px;font-size:12px;text-align:center}
      </style></head><body>
        <div class="h">🍳 KITCHEN</div>
        <div class="id">${order.id} · ${order.table||order.type}</div>
        <div class="rule"></div>
        ${lines}
        <div class="rule"></div>
        <div class="foot">${fmtDateTime(new Date().toISOString())}</div>
      </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),100);
  }

  // ---------- APPLY LANGUAGE ----------
  function applyLang(){
    document.documentElement.lang = STATE.lang;
    document.documentElement.dir = STATE.lang==='ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('mk-rtl', STATE.lang==='ar');
    document.body.classList.toggle('mk-ko', STATE.lang==='ko');
  }

  return {
    T, STATE, seedRuntime, bus, audit,
    t, itemName, fmtIQD, fmtNum, fmtTime, fmtDate, fmtDateTime,
    cartSub, cartTotals, lineTotal,
    stockStatus, isOutOfStock, consumeIngredients, restoreIngredients,
    exportCSV, exportXLS, exportJSON, download, toCSV, toExcelXML,
    printReceipt, printKitchen,
    applyLang
  };
})();
