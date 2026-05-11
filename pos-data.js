/* ============================================================
   Mr. Kim's POS — Seed Data & Menu Schema
   ============================================================ */

window.MK_DATA = (function(){

  // ---------- CATEGORIES ----------
  const CATS = [
    {k:'hot', ar:'قهوة ساخنة',  en:'Hot Coffee',     ko:'핫 커피',   i:'☕'},
    {k:'ice', ar:'قهوة مثلجة',  en:'Iced Coffee',    ko:'아이스 커피', i:'🧋'},
    {k:'tea', ar:'شاي',         en:'Tea',            ko:'차',         i:'🫖'},
    {k:'smo', ar:'سموذي',       en:'Smoothies',      ko:'스무디',     i:'🥤'},
    {k:'des', ar:'حلويات',      en:'Desserts',       ko:'디저트',     i:'🍰'},
    {k:'foo', ar:'طعام',        en:'Food',           ko:'푸드',      i:'🥪'}
  ];

  // ---------- OPTION GROUPS ----------
  const OPTIONS = {
    size: {
      ar:'الحجم', en:'Size', ko:'사이즈',
      choices:[
        {k:'s', ar:'صغير',  en:'Small',  ko:'S', d:-500},
        {k:'m', ar:'وسط',   en:'Medium', ko:'M', d:0, def:true},
        {k:'l', ar:'كبير',  en:'Large',  ko:'L', d:1000}
      ]
    },
    temp: {
      ar:'الحرارة', en:'Temp', ko:'온도',
      choices:[
        {k:'h', ar:'ساخن',   en:'Hot',  ko:'Hot', d:0, def:true},
        {k:'c', ar:'مثلج',   en:'Iced', ko:'Ice', d:300}
      ]
    },
    milk: {
      ar:'الحليب', en:'Milk', ko:'우유',
      choices:[
        {k:'whole',  ar:'كامل',         en:'Whole',       ko:'일반',     d:0, def:true},
        {k:'lf',     ar:'قليل الدسم',   en:'Low-fat',     ko:'저지방',   d:0},
        {k:'oat',    ar:'شوفان',        en:'Oat',         ko:'오트',     d:500},
        {k:'almond', ar:'لوز',          en:'Almond',      ko:'아몬드',   d:500},
        {k:'no',     ar:'بدون',         en:'None',        ko:'없음',     d:0}
      ]
    },
    shot: {
      ar:'الشوت', en:'Shots', ko:'샷',
      choices:[
        {k:'1', ar:'واحد',   en:'Single', ko:'1샷', d:0, def:true},
        {k:'2', ar:'مزدوج',  en:'Double', ko:'2샷', d:1000},
        {k:'3', ar:'ثلاثي',  en:'Triple', ko:'3샷', d:2000}
      ]
    }
  };

  const applicableOptions = (cat) => {
    if (cat==='hot'||cat==='ice') return ['size','temp','milk','shot'];
    if (cat==='tea') return ['size','temp'];
    if (cat==='smo') return ['size'];
    return [];
  };

  // ---------- MENU ITEMS (sku, name, price, category, recipe) ----------
  const MENU = [
    // Hot coffee
    {sku:'C001', e:'☕', ar:'أمريكانو',         en:'Americano',        ko:'아메리카노',    p:3500, c:'hot', rec:{esp:1, water:1}},
    {sku:'C002', e:'☕', ar:'إسبريسو',          en:'Espresso',         ko:'에스프레소',    p:2500, c:'hot', rec:{esp:1}},
    {sku:'C003', e:'☕', ar:'كابتشينو',         en:'Cappuccino',       ko:'카푸치노',      p:4000, c:'hot', rec:{esp:1, milk:1}, hot:1},
    {sku:'C004', e:'☕', ar:'لاتيه',            en:'Latte',            ko:'라떼',          p:4500, c:'hot', rec:{esp:1, milk:1}, hot:1},
    {sku:'C005', e:'☕', ar:'لاتيه فانيلا',     en:'Vanilla Latte',    ko:'바닐라 라떼',   p:5000, c:'hot', rec:{esp:1, milk:1, vanilla:1}},
    {sku:'C006', e:'☕', ar:'فلات وايت',         en:'Flat White',       ko:'플랫 화이트',   p:4500, c:'hot', rec:{esp:2, milk:1}},
    {sku:'C007', e:'☕', ar:'ماكياتو',          en:'Macchiato',        ko:'마키아토',      p:4500, c:'hot', rec:{esp:1, milk:1}},
    {sku:'C008', e:'☕', ar:'موكا',             en:'Mocha',            ko:'모카',          p:5500, c:'hot', rec:{esp:1, milk:1, choc:1}},
    // Iced
    {sku:'I001', e:'🧋', ar:'آيس أمريكانو',     en:'Iced Americano',   ko:'아이스 아메리카노', p:3500, c:'ice', rec:{esp:1, ice:1}},
    {sku:'I002', e:'🧋', ar:'آيس لاتيه',        en:'Iced Latte',       ko:'아이스 라떼',   p:5000, c:'ice', rec:{esp:1, milk:1, ice:1}, low:1},
    {sku:'I003', e:'🧋', ar:'آيس موكا',          en:'Iced Mocha',       ko:'아이스 모카',   p:5500, c:'ice', rec:{esp:1, milk:1, choc:1, ice:1}},
    {sku:'I004', e:'🧋', ar:'آيس كراميل',        en:'Iced Caramel',     ko:'아이스 카라멜', p:5500, c:'ice', rec:{esp:1, milk:1, caramel:1, ice:1}, new:1},
    {sku:'I005', e:'🧋', ar:'فرابتشينو',         en:'Frappuccino',      ko:'프라푸치노',    p:6000, c:'ice', rec:{esp:1, milk:1, ice:2}},
    {sku:'I006', e:'🧋', ar:'آيس ماتشا لاتيه',    en:'Iced Matcha Latte',ko:'아이스 말차 라떼', p:5500, c:'ice', rec:{matcha:1, milk:1, ice:1}},
    // Tea
    {sku:'T001', e:'🫖', ar:'شاي ماتشا',         en:'Matcha Tea',       ko:'말차',          p:4500, c:'tea', rec:{matcha:1}},
    {sku:'T002', e:'🫖', ar:'شاي أخضر',          en:'Green Tea',        ko:'녹차',          p:3000, c:'tea', rec:{tea_g:1}},
    {sku:'T003', e:'🫖', ar:'شاي النعناع',       en:'Mint Tea',         ko:'민트차',        p:3000, c:'tea', rec:{mint:1}},
    {sku:'T004', e:'🫖', ar:'شاي أسود',          en:'Black Tea',        ko:'홍차',          p:2500, c:'tea', rec:{tea_b:1}},
    // Smoothies
    {sku:'S001', e:'🥤', ar:'سموذي فراولة',      en:'Strawberry',       ko:'딸기 스무디',   p:5500, c:'smo', rec:{straw:1, yog:1}},
    {sku:'S002', e:'🥤', ar:'سموذي مانجو',       en:'Mango',            ko:'망고 스무디',   p:5500, c:'smo', rec:{mango:1, yog:1}, out:1},
    {sku:'S003', e:'🥤', ar:'سموذي توت',         en:'Berry',            ko:'베리 스무디',   p:5500, c:'smo', rec:{berry:1, yog:1}},
    {sku:'S004', e:'🥤', ar:'ليموناضة',         en:'Lemonade',         ko:'레모네이드',    p:4000, c:'smo', rec:{lemon:1}},
    // Desserts
    {sku:'D001', e:'🍰', ar:'تيراميسو',         en:'Tiramisu',         ko:'티라미수',      p:4000, c:'des'},
    {sku:'D002', e:'🍰', ar:'تشيز كيك',         en:'Cheesecake',       ko:'치즈케이크',    p:4500, c:'des', low:1},
    {sku:'D003', e:'🍰', ar:'كيك شوكولاتة',     en:'Choco Cake',       ko:'초코케이크',    p:4000, c:'des'},
    {sku:'D004', e:'🍪', ar:'كوكيز',           en:'Cookies',          ko:'쿠키',          p:2000, c:'des'},
    // Food
    {sku:'F001', e:'🥐', ar:'كرواسون ساده',     en:'Croissant',        ko:'크루아상',      p:2500, c:'foo'},
    {sku:'F002', e:'🥐', ar:'كرواسون جبنة',     en:'Cheese Croissant', ko:'치즈 크루아상', p:3000, c:'foo'},
    {sku:'F003', e:'🥪', ar:'ساندويتش حلومي',   en:'Halloumi Sandwich',ko:'할루미 샌드위치', p:6000, c:'foo'},
    {sku:'F004', e:'🥯', ar:'بيغل كريم',         en:'Cream Bagel',      ko:'크림 베이글',   p:3500, c:'foo'}
  ];

  // ---------- INVENTORY ----------
  const INV = [
    {k:'esp',     ar:'حبوب الإسبريسو',  en:'Espresso Beans',   unit:'g',  qty:2800, min:1000, cost:35},
    {k:'milk',    ar:'حليب كامل',       en:'Whole Milk',       unit:'ml', qty:12000,min:5000, cost:2},
    {k:'oat_m',   ar:'حليب الشوفان',    en:'Oat Milk',         unit:'ml', qty:4000, min:2000, cost:4},
    {k:'alm_m',   ar:'حليب اللوز',      en:'Almond Milk',      unit:'ml', qty:3200, min:2000, cost:4},
    {k:'ice',     ar:'ثلج',              en:'Ice',              unit:'g',  qty:8000, min:3000, cost:0.5},
    {k:'vanilla', ar:'شراب الفانيلا',   en:'Vanilla Syrup',    unit:'ml', qty:800,  min:500,  cost:15},
    {k:'caramel', ar:'شراب الكراميل',   en:'Caramel Syrup',    unit:'ml', qty:400,  min:500,  cost:15}, // BELOW MIN
    {k:'choc',    ar:'صلصة الشوكولاتة', en:'Chocolate Sauce',  unit:'ml', qty:1200, min:500,  cost:20},
    {k:'matcha',  ar:'ماتشا',            en:'Matcha Powder',    unit:'g',  qty:320,  min:200,  cost:80},
    {k:'tea_g',   ar:'شاي أخضر',          en:'Green Tea',        unit:'g',  qty:450,  min:200,  cost:30},
    {k:'tea_b',   ar:'شاي أسود',          en:'Black Tea',        unit:'g',  qty:500,  min:200,  cost:25},
    {k:'mint',    ar:'النعناع',            en:'Mint Leaves',      unit:'g',  qty:180,  min:100,  cost:15},
    {k:'straw',   ar:'فراولة مجمدة',     en:'Frozen Strawberry',unit:'g',  qty:1800, min:1000, cost:12},
    {k:'mango',   ar:'مانجو مجمد',        en:'Frozen Mango',     unit:'g',  qty:0,    min:1000, cost:14}, // OUT
    {k:'berry',   ar:'توت مجمد',           en:'Frozen Berries',   unit:'g',  qty:1200, min:1000, cost:15},
    {k:'yog',     ar:'زبادي',              en:'Yogurt',           unit:'ml', qty:3200, min:1500, cost:6},
    {k:'lemon',   ar:'ليمون',              en:'Lemons',           unit:'pc', qty:40,   min:20,   cost:500},
    {k:'water',   ar:'ماء',                 en:'Water',            unit:'ml', qty:30000,min:10000,cost:0.1}
  ];

  // ---------- FLOORS ----------
  const SEED_FLOORS = [
    {id:'F1', name_en:'1st Floor',   name_ar:'الطابق الأول'},
    {id:'F2', name_en:'2nd Floor',   name_ar:'الطابق الثاني'}
  ];

  // ---------- TABLES (floor map) ----------
  // Layout based on architectural blueprint: 1st floor = multi-zone, 2nd floor = open seating
  const SEED_TABLES = [
    // === 1st Floor ===
    // Top bar counter (long horizontal bar with stools)
    {id:'B01', seats:1, x:60,  y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B02', seats:1, x:130, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B03', seats:1, x:200, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B04', seats:1, x:270, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B05', seats:1, x:340, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B06', seats:1, x:410, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B07', seats:1, x:480, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    {id:'B08', seats:1, x:550, y:20,  shape:'bar', label:'Bar', floor:'F1'},
    // Community round table (upper center)
    {id:'T01', seats:8, x:640, y:80,  shape:'round', label:'Community', floor:'F1'},
    // Right wall bar tables
    {id:'T02', seats:4, x:950, y:30,  shape:'rect', label:'Window', floor:'F1'},
    {id:'T03', seats:4, x:950, y:160, shape:'rect', label:'Window', floor:'F1'},
    {id:'T04', seats:4, x:950, y:290, shape:'rect', label:'Window', floor:'F1'},
    // Entrance lounge (middle area)
    {id:'T05', seats:4, x:740, y:240, shape:'square', label:'Lounge', floor:'F1'},
    {id:'T06', seats:4, x:840, y:240, shape:'square', label:'Lounge', floor:'F1'},
    // Library (left center)
    {id:'L01', seats:4, x:170, y:180, shape:'round', label:'Library', floor:'F1'},
    // Kids area (right middle)
    {id:'K01', seats:4, x:620, y:380, shape:'square', label:'Kids', floor:'F1'},
    {id:'K02', seats:4, x:720, y:380, shape:'square', label:'Kids', floor:'F1'},
    {id:'K03', seats:4, x:820, y:380, shape:'square', label:'Kids', floor:'F1'},
    // Study areas (left side)
    {id:'SA01', seats:8, x:30, y:320, shape:'rect', label:'Study A', floor:'F1'},
    {id:'SA02', seats:8, x:30, y:470, shape:'rect', label:'Study B', floor:'F1'},
    // Office team (bottom)
    {id:'OT01', seats:8, x:280, y:540, shape:'rect', label:'Office', floor:'F1'},

    // === 2nd Floor ===
    // Top long conference table
    {id:'F201', seats:8, x:200, y:30,  shape:'rect', label:'Conference', floor:'F2'},
    // Right side 3 square tables
    {id:'F202', seats:4, x:920, y:60,  shape:'square', floor:'F2'},
    {id:'F203', seats:4, x:920, y:180, shape:'square', floor:'F2'},
    {id:'F204', seats:4, x:920, y:300, shape:'square', floor:'F2'},
    // Center round table
    {id:'F205', seats:6, x:420, y:200, shape:'round', label:'Round', floor:'F2'},
    // Left wall window seats
    {id:'F206', seats:1, x:30, y:80,  shape:'bar', label:'Window', floor:'F2'},
    {id:'F207', seats:1, x:30, y:140, shape:'bar', label:'Window', floor:'F2'},
    {id:'F208', seats:1, x:30, y:200, shape:'bar', label:'Window', floor:'F2'},
    {id:'F209', seats:1, x:30, y:260, shape:'bar', label:'Window', floor:'F2'},
    {id:'F210', seats:1, x:30, y:320, shape:'bar', label:'Window', floor:'F2'},
    {id:'F211', seats:1, x:30, y:380, shape:'bar', label:'Window', floor:'F2'},
    // Bottom small tables
    {id:'F212', seats:3, x:300, y:440, shape:'square', floor:'F2'},
    {id:'F213', seats:3, x:460, y:440, shape:'square', floor:'F2'}
  ];

  function _loadArr(key,seed){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):seed.map(x=>({...x})); }catch(e){ return seed.map(x=>({...x})); } }
  function _saveArr(key,arr){ try{ localStorage.setItem(key,JSON.stringify(arr)); }catch(e){} }

  const TABLES = _loadArr('mk_tables', SEED_TABLES);
  const FLOORS = _loadArr('mk_floors', SEED_FLOORS);
  function saveTables(){ _saveArr('mk_tables', TABLES); }
  function saveFloors(){ _saveArr('mk_floors', FLOORS); }
  function resetTablesToSeed(){
    TABLES.length = 0;
    SEED_TABLES.forEach(t => TABLES.push({...t}));
    saveTables();
  }
  function resetFloorsToSeed(){
    FLOORS.length = 0;
    SEED_FLOORS.forEach(f => FLOORS.push({...f}));
    saveFloors();
  }

  // One-time auto-seed: Study room floor → S4+ chair tables
  (function _autoSeedStudyChairs(){
    try{
      const studyFloor = FLOORS.find(f =>
        (f.name_en && /study/i.test(f.name_en)) ||
        (f.name_ar && /دراسة/.test(f.name_ar))
      );
      if(!studyFloor) return;
      const fid = studyFloor.id;
      if(TABLES.some(t => t.floor === fid && t.id === 'S4')) return;
      const positions = [
        {x:705, y:70},   // top-right near wall
        {x:870, y:80},   // right cluster
        {x:845, y:165},
        {x:885, y:190},
        {x:810, y:205},
        {x:875, y:230},
        {x:185, y:210},  // mid-left below wall opening
        {x:340, y:315},  // center
        {x:465, y:275},
        {x:465, y:320},
        {x:90, y:295},   // left vertical column
        {x:90, y:350},
        {x:90, y:430},
        {x:80, y:485},
        {x:80, y:540},
        {x:255, y:415},  // center-bottom column
        {x:255, y:470},
        {x:260, y:520},
        {x:260, y:575}
      ];
      let n = 4;
      positions.forEach(p => {
        TABLES.push({id:'S'+n, seats:1, x:p.x, y:p.y, shape:'square', floor:fid});
        n++;
      });
      saveTables();
    }catch(e){}
  })();

  // ---------- CUSTOMERS (loyalty) ----------
  const CUSTOMERS = [
    {id:'L-1001', phone:'+9647700001001', name_ar:'أحمد المحمود', name_en:'Ahmed Al-Mahmoud', stamps:8, visits:42, spent:285000, tier:'Gold'},
    {id:'L-1002', phone:'+9647700001002', name_ar:'فاطمة الزهراء', name_en:'Fatima Al-Zahra',  stamps:3, visits:11, spent:68000,  tier:'Silver'},
    {id:'L-1003', phone:'+9647700001003', name_ar:'علي الكرخي',    name_en:'Ali Al-Karkhi',   stamps:10, visits:67, spent:540000, tier:'Gold'},
    {id:'L-1004', phone:'+9647700001004', name_ar:'زينب حسن',      name_en:'Zainab Hasan',    stamps:1, visits:3,  spent:18000,  tier:'Bronze'},
    {id:'L-1005', phone:'+9647700001005', name_ar:'كريم الرماحي',  name_en:'Kareem Al-Rammahi',stamps:5, visits:19, spent:112000, tier:'Silver'},
    {id:'L-1006', phone:'+9647700001006', name_ar:'ليلى بغداد',    name_en:'Layla Baghdad',   stamps:7, visits:31, spent:198000, tier:'Gold'},
    {id:'L-1007', phone:'+9647700001007', name_ar:'حسين العلي',    name_en:'Hussein Al-Ali',  stamps:2, visits:6,  spent:34000,  tier:'Bronze'},
    {id:'L-1008', phone:'+9647700001008', name_ar:'مريم الصافي',   name_en:'Maryam Al-Safi',  stamps:9, visits:48, spent:312000, tier:'Gold'}
  ];

  // ---------- RESERVATIONS ----------
  const today = new Date();
  const dstr = (d,h,m) => {const x=new Date(today);x.setHours(h,m,0,0);return x.toISOString()};
  const RESERVATIONS = [
    {id:'R-2401', name_ar:'أحمد المحمود', phone:'+9647700001001', at: dstr(today,14,30), party:2, table:'T01', status:'confirmed', customerId:'L-1001'},
    {id:'R-2402', name_ar:'ضيف',           phone:'+9647700002020', at: dstr(today,15,0),  party:4, table:'T03', status:'confirmed'},
    {id:'R-2403', name_ar:'علي الكرخي',    phone:'+9647700001003', at: dstr(today,16,0),  party:6, table:'T05', status:'confirmed', customerId:'L-1003'},
    {id:'R-2404', name_ar:'ليلى بغداد',    phone:'+9647700001006', at: dstr(today,18,30), party:2, table:'T07', status:'confirmed', customerId:'L-1006'},
    {id:'R-2405', name_ar:'ضيف',           phone:'+9647700002021', at: dstr(today,19,0),  party:4, table:'P01', status:'confirmed'},
    {id:'R-2406', name_ar:'مريم الصافي',   phone:'+9647700001008', at: dstr(today,20,0),  party:3, table:'T04', status:'pending',   customerId:'L-1008'}
  ];

  // ---------- PICKUP ORDERS (incoming from app) ----------
  const PICKUPS = [
    {id:'P-9101', name:'Sara K.', phone:'+9647700003001', at: dstr(today,14,15), items:[{sku:'C004',q:1},{sku:'D001',q:1}], status:'pending', total:8500},
    {id:'P-9102', name:'Omar J.', phone:'+9647700003002', at: dstr(today,14,25), items:[{sku:'I001',q:2}], status:'pending', total:7000}
  ];

  // ---------- TRANSACTIONS (historical — loaded from server) ----------
  // No fake seeding. TXNS is filled by loadTxns() from /api/orders.
  const TXNS = [];

  // Map server order row → POS TXN shape used by pos-views renderReports().
  function mapServerOrderToTxn(o){
    if(!o) return null;
    const lines = (o.items || []).map(it => ({
      sku: it.key || it.sku || '',
      name: it.name || '',
      q: it.qty || it.q || 1,
      price: it.price || 0,
      total: (it.price || 0) * (it.qty || it.q || 1),
      opts: it.opts || null
    }));
    const sub = lines.reduce((s,l)=>s+l.total, 0);
    return {
      id: o.id || ('SRV-'+(o.timestamp||Date.now())),
      at: o.timestamp ? new Date(o.timestamp).toISOString() : new Date().toISOString(),
      type: o.type || 'dine',
      table: o.tableNum || o.table || null,
      cashier: o.cashier_name || o.cashierName || '',
      lines,
      sub,
      tax: o.tax || 0,
      total: o.total || sub,
      payment: (o.payment || 'cash').toLowerCase(),
      customerId: o.customer_id || o.customerId || null,
      status: o.status || 'done',
      refunded: !!(o.refunded || o.status === 'cancelled')
    };
  }

  // Map server ingredient row to client INV shape used by reports view.
  // Server is authoritative; client never mutates qty/min directly — edits go through PATCH.
  function mapServerIngredient(row){
    if (!row || row.id == null) return null;
    return {
      id:   row.id,
      k:    'i' + row.id,
      ar:   row.name_ar || row.name_ko || '',
      en:   row.name_ko || row.name_ar || '',
      unit: row.unit || '',
      qty:  Number(row.current_qty) || 0,
      min:  Number(row.min_qty) || 0,
      cost: Number(row.cost_per_unit) || 0,
      origin:       row.origin || null,
      marketName:   row.market_name || null,
      qtyPerBox:    row.qty_per_box != null ? Number(row.qty_per_box) : null,
      numBoxes:     row.num_boxes != null ? Number(row.num_boxes) : null,
      marketPrice:  row.market_price != null ? Number(row.market_price) : null,
      receivedDate: row.received_date || null,
      imagePath:    row.image_path || null,
      supplierId:   row.supplier_id != null ? Number(row.supplier_id) : null,
      supplierName: row.supplier_name || null,
      supplierPhone: row.supplier_phone || null
    };
  }

  // Pull current inventory from server. Replaces INV in place so existing
  // bindings (renderInv, exports) keep pointing at the same array.
  async function loadInventory(headers = {}){
    try {
      const r = await fetch('/api/ingredients', { headers });
      if (!r.ok) return INV;
      const rows = await r.json();
      const mapped = Array.isArray(rows) ? rows.map(mapServerIngredient).filter(Boolean) : [];
      INV.length = 0;
      mapped.forEach(x => INV.push(x));
    } catch (_) { /* keep prior INV on failure */ }
    return INV;
  }

  // Fetch the last N days of completed orders from the server.
  // Cashier auth header is injected by the caller (cashier.html ships cashierHeaders).
  async function loadTxns(daysBack = 7, headers = {}){
    const out = [];
    const today = new Date();
    for (let d = 0; d <= daysBack; d++) {
      const day = new Date(today);
      day.setDate(today.getDate() - d);
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth()+1).padStart(2,'0');
      const dd = String(day.getDate()).padStart(2,'0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      try {
        const r = await fetch(`/api/orders?date=${dateStr}`, { headers });
        if (!r.ok) continue;
        const rows = await r.json();
        rows.forEach(o => { const t = mapServerOrderToTxn(o); if (t) out.push(t); });
      } catch (_) { /* swallow per-day fetch errors; partial reports better than none */ }
    }
    out.sort((a,b)=> (b.at||'').localeCompare(a.at||''));
    TXNS.length = 0;
    out.forEach(t => TXNS.push(t));
    return TXNS;
  }

  // ---------- SPRINT 2.7: DB-BACKED MENU (V2) ----------
  // These arrays are populated by loadPublicMenu() from /api/menu/public.
  // They live alongside the legacy hardcoded MENU/CATS/OPTIONS so the order
  // view can fall back when the DB is empty (first install). Once the owner
  // has populated the menu through Settings, V2 takes over.
  const MENU_V2 = [];
  const CATS_V2 = [];
  const MODIFIER_GROUPS_V2 = [];
  const MENU_V2_SOLDOUT = new Set();

  // Pull the public menu bundle. Replaces V2 arrays in place so existing
  // bindings keep pointing at the same objects. Returns a snapshot.
  async function loadPublicMenu(headers = {}){
    try {
      const r = await fetch('/api/menu/public', { headers });
      if (!r.ok) return { categories: CATS_V2, items: MENU_V2, modifier_groups: MODIFIER_GROUPS_V2 };
      const data = await r.json();
      const cats = Array.isArray(data && data.categories) ? data.categories : [];
      const items = Array.isArray(data && data.items) ? data.items : [];
      const groups = Array.isArray(data && data.modifier_groups) ? data.modifier_groups : [];
      CATS_V2.length = 0; cats.forEach(c => CATS_V2.push(c));
      MENU_V2.length = 0; items.forEach(it => MENU_V2.push(it));
      MODIFIER_GROUPS_V2.length = 0; groups.forEach(g => MODIFIER_GROUPS_V2.push(g));
      MENU_V2_SOLDOUT.clear();
      items.forEach(it => { if (it.sold_out) MENU_V2_SOLDOUT.add(it.id); });
    } catch (_) {
      /* keep prior V2 cache on failure — at worst the order view falls back to legacy */
    }
    return { categories: CATS_V2, items: MENU_V2, modifier_groups: MODIFIER_GROUPS_V2 };
  }

  // Helper used by the order view: locate a V2 modifier group by its `code`
  // (matches the seeded codes 'size'/'temp'/'milk'/'shot'/'syrup' or any
  // owner-defined code).
  function getModifierGroupV2ByCode(code){
    return MODIFIER_GROUPS_V2.find(g => g.code === code) || null;
  }
  function getModifierGroupV2ById(id){
    return MODIFIER_GROUPS_V2.find(g => g.id === id) || null;
  }
  function getMenuV2ById(id){
    return MENU_V2.find(m => m.id === id) || null;
  }

  return {
    CATS, OPTIONS, MENU, INV, TABLES, FLOORS, CUSTOMERS, RESERVATIONS, PICKUPS, TXNS,
    loadTxns, loadInventory, applicableOptions,
    saveTables, saveFloors, resetTablesToSeed, resetFloorsToSeed,
    // Sprint 2.7
    MENU_V2, CATS_V2, MODIFIER_GROUPS_V2, MENU_V2_SOLDOUT,
    loadPublicMenu, getModifierGroupV2ByCode, getModifierGroupV2ById, getMenuV2ById
  };
})();
