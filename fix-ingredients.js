/**
 * 프로덕션 재료 일괄 수정:
 *  - cost_per_unit × 1.15
 *  - category 자동 추론 (syrup→시럽, sauce→소스, smoothie→스무디, powder→파우더, pulp→과육)
 */

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
      res.on('data', c => body += c);
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

function inferCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('smoothie') || n.includes('스무디')) return '스무디';
  if (n.includes('syrup') || n.includes('시럽')) return '시럽';
  if (n.includes('sauce') || n.includes('소스')) return '소스';
  if (n.includes('powder') || n.includes('파우더')) return '파우더';
  if (n.includes('pulp') || n.includes('과육')) return '과육';
  return '기타';
}

async function main() {
  console.log('🔑 Logging in...');
  const login = await request('POST', '/api/auth/login', { password: PASSWORD });
  if (!login.data.token) { console.error('❌ Login failed:', login.data); process.exit(1); }
  const token = login.data.token;
  console.log('✅ Logged in\n');

  const { data: ings } = await request('GET', '/api/ingredients', null, token);
  console.log(`📦 Total ingredients: ${ings.length}\n`);

  let ok = 0, fail = 0;
  for (const i of ings) {
    const newPrice = Math.round(i.cost_per_unit * 1.15);
    const newCat = inferCategory(i.name_ko);

    const res = await request('PUT', `/api/ingredients/${i.id}`, {
      name_ko: i.name_ko,
      name_ar: i.name_ar,
      unit: i.unit,
      min_qty: i.min_qty,
      cost_per_unit: newPrice,
    }, token);

    if (res.status === 200) {
      console.log(`[OK] ${i.name_ko.padEnd(45)} ${i.cost_per_unit} → ${newPrice} IQD | cat: ${newCat}`);
      ok++;
    } else {
      console.log(`[ERR] ${i.name_ko} → ${JSON.stringify(res.data)}`);
      fail++;
    }
  }

  console.log(`\n✅ Done — updated: ${ok}, failed: ${fail}`);
}

main().catch(console.error);
