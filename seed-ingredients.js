const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cafe-warehouse.db'));

const ingredients = [
  // ── SYRUPS (1L×6ea/CTN) ──
  { name_ko: 'Vanilla Syrup (1L×6ea/box)', name_ar: 'شراب الفانيليا', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 5951 },
  { name_ko: 'Apple Syrup Black Label (1L×6ea/box)', name_ar: 'شراب التفاح الأسود', unit: '병', current_qty: 18, min_qty: 6, cost_per_unit: 7257 },
  { name_ko: 'Apple Syrup (1L×6ea/box)', name_ar: 'شراب التفاح', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Peach Syrup (1L×6ea/box)', name_ar: 'شراب الخوخ', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Blueberry Syrup (1L×6ea/box)', name_ar: 'شراب التوت الأزرق', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Black Tea Syrup (1L×6ea/box)', name_ar: 'شراب الشاي الأسود', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 9449 },
  { name_ko: 'Lychee Syrup (1L×6ea/box)', name_ar: 'شراب الليتشي', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Passionfruit Syrup (1L×6ea/box)', name_ar: 'شراب فاكهة العاطفة', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Peach Iced Tea Syrup (1L×6ea/box)', name_ar: 'شراب شاي الخوخ المثلج', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Grapefruit Syrup (1L×6ea/box)', name_ar: 'شراب الجريب فروت', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 9449 },
  { name_ko: 'Green Tea Syrup (1L×6ea/box)', name_ar: 'شراب الشاي الأخضر', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 9449 },
  { name_ko: 'Mint Syrup (1L×6ea/box)', name_ar: 'شراب النعناع', unit: '병', current_qty: 24, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Smoky Earl Grey Syrup (1L×6ea/box)', name_ar: 'شراب الإيرل غري المدخن', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Orange & Lemon Syrup (1L×6ea/box)', name_ar: 'شراب البرتقال والليمون', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Hazelnut Syrup (1L×6ea/box)', name_ar: 'شراب البندق', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Pulpy Green Apple Syrup (1L×6ea/box)', name_ar: 'شراب التفاح الأخضر بالعصير', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6967 },
  { name_ko: 'Blue Curacao Syrup (1L×6ea/box)', name_ar: 'شراب كوراساو الأزرق', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Coffee Caramel Syrup (1L×6ea/box)', name_ar: 'شراب كراميل القهوة', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 5951 },
  { name_ko: 'Coffee Cocktail Syrup (1L×6ea/box)', name_ar: 'شراب كوكتيل القهوة', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Caramel Syrup (1L×6ea/box)', name_ar: 'شراب الكراميل', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 5951 },
  { name_ko: 'Maple Syrup (1L×6ea/box)', name_ar: 'شراب القيقب', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 5951 },
  { name_ko: 'Raspberry Syrup (1L×6ea/box)', name_ar: 'شراب التوت الأحمر', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Ginger & Lemon Syrup (1L×6ea/box)', name_ar: 'شراب الزنجبيل والليمون', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 8419 },
  { name_ko: 'Hibiscus Syrup (1L×6ea/box)', name_ar: 'شراب الكركديه', unit: '병', current_qty: 6, min_qty: 6, cost_per_unit: 5951 },
  { name_ko: 'Strawberry Syrup (1L×6ea/box)', name_ar: 'شراب الفراولة', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Lemon Syrup (1L×6ea/box)', name_ar: 'شراب الليمون', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },
  { name_ko: 'Kiwi Syrup (1L×6ea/box)', name_ar: 'شراب الكيوي', unit: '병', current_qty: 12, min_qty: 6, cost_per_unit: 6822 },

  // ── CHERRY SYRUP (500g×12ea/CTN) ──
  { name_ko: 'Cherry Syrup (500g×12ea/box)', name_ar: 'شراب الكرز', unit: '봉', current_qty: 24, min_qty: 12, cost_per_unit: 3484 },

  // ── POWDER ──
  { name_ko: 'Banana Powder (800g×12ea/box)', name_ar: 'مسحوق الموز', unit: '봉', current_qty: 12, min_qty: 6, cost_per_unit: 8273 },
  { name_ko: 'Frizzante Powder (500g×12ea/box)', name_ar: 'مسحوق فريزانتي', unit: '봉', current_qty: 12, min_qty: 6, cost_per_unit: 4935 },

  // ── SAUCES (2kg×6ea/CTN) ──
  { name_ko: 'Chocolate Sauce (2kg×6ea/box)', name_ar: 'صلصة الشوكولاتة', unit: '개', current_qty: 24, min_qty: 6, cost_per_unit: 8854 },
  { name_ko: 'White Chocolate Sauce (2kg×6ea/box)', name_ar: 'صلصة الشوكولاتة البيضاء', unit: '개', current_qty: 6, min_qty: 6, cost_per_unit: 8854 },
  { name_ko: 'Caramel Sauce (2kg×6ea/box)', name_ar: 'صلصة الكراميل', unit: '개', current_qty: 48, min_qty: 6, cost_per_unit: 9144 },
  { name_ko: 'Tiramisu Sauce (1.9kg×6ea/box)', name_ar: 'صلصة التيراميسو', unit: '개', current_qty: 24, min_qty: 6, cost_per_unit: 3520 },
  { name_ko: 'Peanut Sauce (2kg×6ea/box)', name_ar: 'صلصة الفول السوداني', unit: '개', current_qty: 6, min_qty: 6, cost_per_unit: 13208 },
  { name_ko: 'Vanilla Bean Sauce (1L×6ea/box)', name_ar: 'صلصة حبوب الفانيليا', unit: '병', current_qty: 48, min_qty: 6, cost_per_unit: 15894 },

  // ── SMOOTHIES (2kg×6ea/CTN) ──
  { name_ko: 'Strawberry Smoothie (2kg×6ea/box)', name_ar: 'سموذي الفراولة', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8999 },
  { name_ko: 'Kiwi Smoothie (2kg×6ea/box)', name_ar: 'سموذي الكيوي', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8999 },
  { name_ko: 'Mango Smoothie (2kg×6ea/box)', name_ar: 'سموذي المانجو', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8999 },
  { name_ko: 'Blueberry Smoothie (2kg×6ea/box)', name_ar: 'سموذي التوت الأزرق', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8999 },
  { name_ko: 'Citron Smoothie (2kg×6ea/box)', name_ar: 'سموذي الليمون الأصفر', unit: '개', current_qty: 12, min_qty: 6, cost_per_unit: 8999 },
  { name_ko: 'Lemon Smoothie (2kg×6ea/box)', name_ar: 'سموذي الليمون', unit: '개', current_qty: 24, min_qty: 6, cost_per_unit: 8999 },

  // ── PULPS (1.2kg×9ea/CTN) ──
  { name_ko: 'Calamansi with Pulp (1.2kg×9ea/box)', name_ar: 'كالاماندين بالعصير', unit: '개', current_qty: 9, min_qty: 9, cost_per_unit: 4645 },
  { name_ko: 'Lemon with Pulp (1.2kg×9ea/box)', name_ar: 'ليمون بالعصير', unit: '개', current_qty: 18, min_qty: 9, cost_per_unit: 5298 },
  { name_ko: 'Passionfruit with Pulp (1.2kg×9ea/box)', name_ar: 'فاكهة العاطفة بالعصير', unit: '개', current_qty: 18, min_qty: 9, cost_per_unit: 10596 },
  { name_ko: 'Cherry with Pulp (1.2kg×9ea/box)', name_ar: 'كرز بالعصير', unit: '개', current_qty: 18, min_qty: 9, cost_per_unit: 10596 },
];

const insert = db.prepare(`
  INSERT INTO ingredients (name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit)
  VALUES (@name_ko, @name_ar, @unit, @current_qty, @min_qty, @cost_per_unit)
`);

const checkExist = db.prepare('SELECT id FROM ingredients WHERE name_ko = @name_ko');

let inserted = 0;
let skipped = 0;

const insertMany = db.transaction((items) => {
  for (const item of items) {
    const existing = checkExist.get({ name_ko: item.name_ko });
    if (existing) {
      console.log(`[SKIP] Already exists: ${item.name_ko}`);
      skipped++;
    } else {
      insert.run(item);
      console.log(`[OK]   Inserted: ${item.name_ko}`);
      inserted++;
    }
  }
});

insertMany(ingredients);

const total = db.prepare('SELECT COUNT(*) as cnt FROM ingredients').get();
console.log(`\n✅ Done — inserted: ${inserted}, skipped: ${skipped}`);
console.log(`📦 Total ingredients in DB: ${total.cnt}`);

db.close();
