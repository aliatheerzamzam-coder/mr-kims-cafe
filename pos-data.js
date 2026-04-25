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
    {id:'SR', name_en:'Study Room',  name_ar:'غرفة الدراسة'},
    {id:'F2', name_en:'2nd Floor',   name_ar:'الطابق الثاني'}
  ];

  // ---------- TABLES (floor map) ----------
  const SEED_TABLES = [
    // 1st Floor
    {id:'T01', seats:2, x:60,  y:60,  shape:'round',  floor:'F1'},
    {id:'T02', seats:2, x:60,  y:180, shape:'round',  floor:'F1'},
    {id:'T03', seats:4, x:220, y:60,  shape:'square', floor:'F1'},
    {id:'T04', seats:4, x:220, y:210, shape:'square', floor:'F1'},
    {id:'T05', seats:6, x:420, y:60,  shape:'rect',   floor:'F1'},
    {id:'T06', seats:6, x:420, y:220, shape:'rect',   floor:'F1'},
    {id:'T07', seats:2, x:680, y:60,  shape:'round',  floor:'F1'},
    {id:'T08', seats:2, x:680, y:170, shape:'round',  floor:'F1'},
    {id:'T09', seats:4, x:680, y:280, shape:'square', floor:'F1'},
    {id:'B01', seats:1, x:60,  y:320, shape:'bar',   label:'Bar',   floor:'F1'},
    {id:'B02', seats:1, x:120, y:320, shape:'bar',   label:'Bar',   floor:'F1'},
    {id:'B03', seats:1, x:180, y:320, shape:'bar',   label:'Bar',   floor:'F1'},
    {id:'P01', seats:4, x:820, y:60,  shape:'square',label:'Patio', floor:'F1'},
    {id:'P02', seats:4, x:820, y:220, shape:'square',label:'Patio', floor:'F1'},
    // Study Room
    {id:'SA01', seats:1, x:80,  y:80,  shape:'square', floor:'SR'},
    {id:'SA02', seats:1, x:200, y:80,  shape:'square', floor:'SR'},
    {id:'KA01', seats:4, x:400, y:80,  shape:'square', label:'Kids', floor:'SR'},
    {id:'VIP1', seats:6, x:600, y:80,  shape:'rect',   label:'VIP',  floor:'SR'},
    // 2nd Floor
    {id:'F201', seats:2,  x:80,  y:80,  shape:'round',  floor:'F2'},
    {id:'F202', seats:2,  x:200, y:80,  shape:'round',  floor:'F2'},
    {id:'F203', seats:4,  x:380, y:80,  shape:'square', floor:'F2'},
    {id:'F204', seats:10, x:600, y:80,  shape:'rect',   label:'Board', floor:'F2'}
  ];

  function _loadArr(key,seed){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):seed.map(x=>({...x})); }catch(e){ return seed.map(x=>({...x})); } }
  function _saveArr(key,arr){ try{ localStorage.setItem(key,JSON.stringify(arr)); }catch(e){} }

  const TABLES = _loadArr('mk_tables', SEED_TABLES);
  const FLOORS = _loadArr('mk_floors', SEED_FLOORS);
  function saveTables(){ _saveArr('mk_tables', TABLES); }
  function saveFloors(){ _saveArr('mk_floors', FLOORS); }

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

  // ---------- TRANSACTIONS (historical — for reports) ----------
  // Simulate a day of data
  const seedTxns = () => {
    const out=[];
    let idN=0;
    const daysBack = 7;
    const randInt = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
    for(let d=daysBack; d>=0; d--){
      const date = new Date();
      date.setDate(date.getDate()-d);
      const ordersPerDay = d===0 ? randInt(18,35) : randInt(55,95);
      for(let i=0;i<ordersPerDay;i++){
        date.setHours(randInt(7,22), randInt(0,59), randInt(0,59));
        const linesN = randInt(1,4);
        const lines=[];
        let sub=0;
        for(let j=0;j<linesN;j++){
          const it = MENU[randInt(0, MENU.length-1)];
          if(it.out) continue;
          const q = randInt(1,3);
          const price = it.p + randInt(0,2)*500;
          lines.push({sku:it.sku, name:it.en, q, price, total:price*q});
          sub += price*q;
        }
        if(!lines.length) continue;
        const tax = Math.round(sub*0.1);
        const pm = ['cash','card','zain','switch','stamp'][randInt(0,4)];
        idN++;
        out.push({
          id:'TX-'+String(24000+idN).padStart(5,'0'),
          at: new Date(date).toISOString(),
          type: ['dine','take','deli','pickup'][randInt(0,3)],
          table: randInt(0,1) ? 'T0'+randInt(1,9) : null,
          cashier: ['Ahmed','Fatima','Omar'][randInt(0,2)],
          lines, sub, tax, total:sub+tax,
          payment:pm,
          customerId: randInt(0,3)===0 ? 'L-100'+randInt(1,8) : null
        });
      }
    }
    return out;
  };

  const TXNS = seedTxns();

  return { CATS, OPTIONS, MENU, INV, TABLES, FLOORS, CUSTOMERS, RESERVATIONS, PICKUPS, TXNS, applicableOptions, saveTables, saveFloors };
})();
