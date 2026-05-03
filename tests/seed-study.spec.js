const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://mrkimscafe.com' });

test('migration adds S4-S22 when Study floor exists', async ({ page }) => {
  // First visit to set up localStorage with a Study floor + S1-S3
  await page.goto('/cashier.html');
  await page.waitForTimeout(2000);

  await page.evaluate(()=>{
    const fid = 'FL_STUDY';
    const floors = [
      {id:'F1', name_en:'1st Floor', name_ar:'الطابق الأول'},
      {id:'F2', name_en:'2nd Floor', name_ar:'الطابق الثاني'},
      {id:fid, name_en:'Study', name_ar:'دراسة'}
    ];
    const tables = [
      {id:'S1', seats:1, x:100, y:100, shape:'square', floor:fid},
      {id:'S2', seats:1, x:150, y:100, shape:'square', floor:fid},
      {id:'S3', seats:1, x:200, y:100, shape:'square', floor:fid}
    ];
    localStorage.setItem('mk_floors', JSON.stringify(floors));
    localStorage.setItem('mk_tables', JSON.stringify(tables));
  });

  // Reload — migration should fire on fresh script load
  await page.reload();
  await page.waitForTimeout(2500);

  const result = await page.evaluate(()=>{
    const tables = JSON.parse(localStorage.getItem('mk_tables')||'[]');
    const floors = JSON.parse(localStorage.getItem('mk_floors')||'[]');
    const studyFloor = floors.find(f => /study/i.test(f.name_en||'') || /دراسة/.test(f.name_ar||''));
    const sTables = tables.filter(t => t.floor === studyFloor.id);
    return { fid: studyFloor.id, sIds: sTables.map(t=>t.id).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1))) };
  });
  console.log('AFTER MIGRATION:', JSON.stringify(result, null, 2));

  expect(result.sIds).toContain('S4');
  expect(result.sIds).toContain('S22');
  expect(result.sIds.length).toBe(22);
});
