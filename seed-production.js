const https = require('https');

const BASE_URL = 'https://mrkimscafe.com';
const PASSWORD = process.env.ADMIN_PW || '1234';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const ingredients = [
  // ── SYRUPS (1L×6ea/CTN) ──
  { name_ko: 'Vanilla Syrup (1L×6ea/box)', name_ar: 'شراب الفانيليا', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 5356 },
  { name_ko: 'Apple Syrup Black Label (1L×6ea/box)', name_ar: 'شراب التفاح الأسود', unit: '병', current_qty: 18, min_qty: 6, cost_per_unit: 6531 },
  { name_ko: 'Apple Syrup (1L×6ea/box)', name_ar: 'شراب التفاح', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Peach Syrup (1L×6ea/box)', name_ar: 'شراب الخوخ', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Blueberry Syrup (1L×6ea/box)', name_ar: 'شراب التوت الأزرق', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Black Tea Syrup (1L×6ea/box)', name_ar: 'شراب الشاي الأسود', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 8504 },
  { name_ko: 'Lychee Syrup (1L×6ea/box)', name_ar: 'شراب الليتشي', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Passionfruit Syrup (1L×6ea/box)', name_ar: 'شراب فاكهة العاطفة', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Peach Iced Tea Syrup (1L×6ea/box)', name_ar: 'شراب شاي الخوخ المثلج', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Grapefruit Syrup (1L×6ea/box)', name_ar: 'شراب الجريب فروت', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 8504 },
  { name_ko: 'Green Tea Syrup (1L×6ea/box)', name_ar: 'شراب الشاي الأخضر', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 8504 },
  { name_ko: 'Mint Syrup (1L×6ea/box)', name_ar: 'شراب النعناع', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Smoky Earl Grey Syrup (1L×6ea/box)', name_ar: 'شراب الإيرل غري المدخن', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Orange & Lemon Syrup (1L×6ea/box)', name_ar: 'شراب البرتقال والليمون', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Hazelnut Syrup (1L×6ea/box)', name_ar: 'شراب البندق', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Pulpy Green Apple Syrup (1L×6ea/box)', name_ar: 'شراب التفاح الأخضر بالعصير', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6270 },
  { name_ko: 'Blue Curacao Syrup (1L×6ea/box)', name_ar: 'شراب كوراساو الأزرق', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Coffee Caramel Syrup (1L×6ea/box)', name_ar: 'شراب كراميل القهوة', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 5356 },
  { name_ko: 'Coffee Cocktail Syrup (1L×6ea/box)', name_ar: 'شراب كوكتيل القهوة', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Caramel Syrup (1L×6ea/box)', name_ar: 'شراب الكراميل', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 5356 },
  { name_ko: 'Maple Syrup (1L×6ea/box)', name_ar: 'شراب القيقب', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 5356 },
  { name_ko: 'Raspberry Syrup (1L×6ea/box)', name_ar: 'شراب التوت الأحمر', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Ginger & Lemon Syrup (1L×6ea/box)', name_ar: 'شراب الزنجبيل والليمون', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 7577 },
  { name_ko: 'Hibiscus Syrup (1L×6ea/box)', name_ar: 'شراب الكركديه', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 5356 },
  { name_ko: 'Strawberry Syrup (1L×6ea/box)', name_ar: 'شراب الفراولة', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Lemon Syrup (1L×6ea/box)', name_ar: 'شراب الليمون', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  { name_ko: 'Kiwi Syrup (1L×6ea/box)', name_ar: 'شراب الكيوي', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6140 },
  // ── CHERRY SYRUP (500g×12ea/CTN) ──
  { name_ko: 'Cherry Syrup (500g×12ea/box)', name_ar: 'شراب الكرز', unit: '봉', current_qty: 24, min_qty: 12, cost_per_unit: 3136 },
  // ── POWDER ──
  { name_ko: 'Banana Powder (800g×12ea/box)', name_ar: 'مسحوق الموز', unit: '봉', current_qty: 12, min_qty: 6, cost_per_unit: 7446 },
  { name_ko: 'Frizzante Powder (500g×12ea/box)', name_ar: 'مسحوق فريزانتي', unit: '봉', current_qty: 12, min_qty: 6, cost_per_unit: 4442 },
  // ── SAUCES ──
  { name_ko: 'Chocolate Sauce (2kg×6ea/box)', name_ar: 'صلصة الشوكولاتة', unit: '개', current_qty: 24, min_qty: 6, cost_per_unit: 7969 },
  { name_ko: 'White Chocolate Sauce (2kg×6ea/box)', name_ar: 'صلصة الشوكولاتة البيضاء', unit: '개', current_qty: 6, min_qty: 6, cost_per_unit: 7969 },
  { name_ko: 'Caramel Sauce (2kg×6ea/box)', name_ar: 'صلصة الكراميل', unit: '개', current_qty: 48, min_qty: 6, cost_per_unit: 8230 },
  { name_ko: 'Tiramisu Sauce (1.9kg×6ea/box)', name_ar: 'صلصة التيراميسو', unit: '개', current_qty: 24, min_qty: 6, cost_per_unit: 3168 },
  { name_ko: 'Peanut Sauce (2kg×6ea/box)', name_ar: 'صلصة الفول السوداني', unit: '개', current_qty: 6, min_qty: 6, cost_per_unit: 11887 },
  { name_ko: 'Vanilla Bean Sauce (1L×6ea/box)', name_ar: 'صلصة حبوب الفانيليا', unit: '병', current_qty: 48, min_qty: 6, cost_per_unit: 14305 },
  // ── SMOOTHIES ──
  { name_ko: 'Strawberry Smoothie (2kg×6ea/box)', name_ar: 'سموذي الفراولة', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8099 },
  { name_ko: 'Kiwi Smoothie (2kg×6ea/box)', name_ar: 'سموذي الكيوي', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8099 },
  { name_ko: 'Mango Smoothie (2kg×6ea/box)', name_ar: 'سموذي المانجو', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8099 },
  { name_ko: 'Blueberry Smoothie (2kg×6ea/box)', name_ar: 'سموذي التوت الأزرق', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8099 },
  { name_ko: 'Citron Smoothie (2kg×6ea/box)', name_ar: 'سموذي الليمون الأصفر', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8099 },
  { name_ko: 'Lemon Smoothie (2kg×6ea/box)', name_ar: 'سموذي الليمون', unit: '개', current_qty: 24, min_qty: 6, cost_per_unit: 8099 },
  // ── PULPS ──
  { name_ko: 'Calamansi with Pulp (1.2kg×9ea/box)', name_ar: 'كالاماندين بالعصير', unit: '개', current_qty: 9, min_qty: 9, cost_per_unit: 4181 },
  { name_ko: 'Lemon with Pulp (1.2kg×9ea/box)', name_ar: 'ليمون بالعصير', unit: '개', current_qty: 18, min_qty: 9, cost_per_unit: 4768 },
  { name_ko: 'Passionfruit with Pulp (1.2kg×9ea/box)', name_ar: 'فاكهة العاطفة بالعصير', unit: '개', current_qty: 18, min_qty: 9, cost_per_unit: 9536 },
  { name_ko: 'Cherry with Pulp (1.2kg×9ea/box)', name_ar: 'كرز بالعصير', unit: '개', current_qty: 18, min_qty: 9, cost_per_unit: 9536 },
];

async function main() {
  // 1. 로그인
  console.log('🔑 Logging in...');
  const login = await request('POST', '/api/auth/login', { password: PASSWORD });
  if (!login.data.token) {
    console.error('❌ Login failed:', login.data);
    process.exit(1);
  }
  const token = login.data.token;
  console.log('✅ Logged in\n');

  // 2. 기존 재료 목록 조회
  const existing = await request('GET', '/api/ingredients', null, token);
  const existingNames = new Set((existing.data || []).map(i => i.name_ko));
  console.log(`📦 Existing ingredients: ${existingNames.size}\n`);

  // 3. 재료 삽입
  let inserted = 0, skipped = 0;
  for (const ing of ingredients) {
    if (existingNames.has(ing.name_ko)) {
      console.log(`[SKIP] ${ing.name_ko}`);
      skipped++;
      continue;
    }
    const res = await request('POST', '/api/ingredients', ing, token);
    if (res.status === 200 || res.status === 201) {
      console.log(`[OK]   ${ing.name_ko}`);
      inserted++;
    } else {
      console.log(`[ERR]  ${ing.name_ko} → ${JSON.stringify(res.data)}`);
    }
  }

  console.log(`\n✅ Done — inserted: ${inserted}, skipped: ${skipped}`);
}

main().catch(console.error);
