const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cafe-warehouse.db'));

// 1 KRW = 0.9 IQD (2026년 4월 기준)
const RATE = 0.9;

// 이번에 삽입한 46개 재료만 업데이트 (id 기준이 아니라 name_ko 패턴으로)
const ingredients = db.prepare(`
  SELECT id, name_ko, cost_per_unit FROM ingredients
  WHERE name_ko LIKE '%(%)%'
`).all();

const update = db.prepare(`UPDATE ingredients SET cost_per_unit = ? WHERE id = ?`);

const run = db.transaction(() => {
  for (const ing of ingredients) {
    const newPrice = Math.round(ing.cost_per_unit * RATE);
    update.run(newPrice, ing.id);
    console.log(`[OK] ${ing.name_ko}: ${ing.cost_per_unit} KRW → ${newPrice} IQD`);
  }
});

run();

console.log(`\n✅ ${ingredients.length}개 재료 가격 IQD 변환 완료 (×${RATE})`);
db.close();
