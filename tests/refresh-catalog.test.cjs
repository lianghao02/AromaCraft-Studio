const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const R=require('../tools/refresh-catalog.cjs');
const rec=(o={})=>({id:'1',name:'測試精油 5ml',categories:['單方精油'],ml:5,wholesale:1000,retail:1300,perMl:200,inStock:true,status:'容量與價格已取得',url:'u',api:'a1',at:'2026-10-12T00:00:00.000Z',...o});
const sku=(o={})=>({partNumber:'1',name:'測試精油 5ml',wholesalePriceString:'1,000',retailPriceString:'1,300',inStock:true,...o});
const NOW='2026-11-01T00:00:00.000Z';
function tmp(rows){const f=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'aroma-refresh-')),'data.json');fs.writeFileSync(f,JSON.stringify(rows,null,2)+'\n');return f;}

test('價格與容量字串解析',()=>{
  assert.equal(R.parsePrice('1,390'),1390);assert.equal(R.parsePrice('0'),null);assert.equal(R.parsePrice(''),null);assert.equal(R.parsePrice(undefined),null);
  assert.equal(R.parseMl('心觸動配方精油 5ml'),5);assert.equal(R.parseMl('V-6 綜合純植物油 236 ml'),236);assert.equal(R.parseMl('套組'),null);
});
test('無變動：next 為 null，不換查價時間',()=>{
  const e=R.evaluate(rec(),sku(),NOW);assert.equal(e.next,null);assert.equal(e.changes.length,0);assert.equal(e.failed,false);
});
test('批發價變動：換查價時間、重算每 mL 價、列入變動清單',()=>{
  const e=R.evaluate(rec(),sku({wholesalePriceString:'1,100'}),NOW);
  assert.equal(e.next.wholesale,1100);assert.equal(e.next.perMl,220);assert.equal(e.next.at,NOW);assert.equal(e.priceBatchChanged,true);assert.equal(e.anomalies.length,0);
  assert.equal(e.changes[0].field,'批發價');
});
test('只有庫存或零售價變動：更新內容但不換查價時間（不新增價格批次）',()=>{
  const e=R.evaluate(rec(),sku({retailPriceString:'1,400',inStock:false}),NOW);
  assert.equal(e.next.retail,1400);assert.equal(e.next.inStock,false);assert.equal(e.next.at,'2026-10-12T00:00:00.000Z');assert.equal(e.priceBatchChanged,false);
});
test('異常：批發價變動超過 30%、容量變動、官網突然沒有價格、找不到商品',()=>{
  assert.match(R.evaluate(rec(),sku({wholesalePriceString:'2,000'}),NOW).anomalies[0],/變動超過 30%/);
  assert.match(R.evaluate(rec(),sku({name:'測試精油 15ml'}),NOW).anomalies.join(),/容量變動/);
  const none=R.evaluate(rec(),sku({wholesalePriceString:''}),NOW);assert.equal(none.next,null);assert.match(none.anomalies[0],/沒有批發價/);
  const miss=R.evaluate(rec(),null,NOW);assert.equal(miss.failed,true);
});
test('待核對品項取得容量與價格後轉為完整',()=>{
  const e=R.evaluate(rec({ml:null,wholesale:null,retail:null,perMl:null,status:'容量或價格待核對'}),sku({name:'乳香精油 15ml',wholesalePriceString:'3,180',retailPriceString:'4,180'}),NOW);
  assert.equal(e.next.ml,15);assert.equal(e.next.perMl,212);assert.equal(e.next.status,'容量與價格已取得');assert.equal(e.next.at,NOW);
});
test('run：dry run 不寫入；--write 只改有變動的筆，沒有介面的筆與順序原樣保留',async()=>{
  const rows=[rec({id:'1',api:'a1'}),rec({id:'2',api:'',wholesale:null,status:'公開價格待補'}),rec({id:'3',api:'a3'})];delete rows[1].api;
  const f=tmp(rows),before=fs.readFileSync(f,'utf8');
  const fetchImpl=async url=>url==='a1'?[sku({partNumber:'1',wholesalePriceString:'1,050'})]:[sku({partNumber:'3'})];
  const dry=await R.run({dataPath:f,fetchImpl,delayMs:0,now:NOW});
  assert.equal(dry.summary.changed,1);assert.equal(dry.summary.skippedNoApi,1);assert.equal(dry.summary.wrote,false);assert.equal(fs.readFileSync(f,'utf8'),before);
  const w=await R.run({dataPath:f,fetchImpl,delayMs:0,now:NOW,write:true});
  assert.equal(w.summary.wrote,true);const after=JSON.parse(fs.readFileSync(f,'utf8'));
  assert.deepEqual(after.map(r=>r.id),['1','2','3']);assert.equal(after[0].wholesale,1050);assert.equal(after[0].at,NOW);
  assert.deepEqual(after[1],rows[1]);assert.deepEqual(after[2],rows[2]);assert.ok(fs.readFileSync(f,'utf8').endsWith('\n'));
});
test('run：有異常時不寫入，加 acceptAnomalies 才寫入',async()=>{
  const f=tmp([rec()]);const fetchImpl=async()=>[sku({wholesalePriceString:'2,000'})];
  const a=await R.run({dataPath:f,fetchImpl,delayMs:0,now:NOW,write:true});assert.equal(a.summary.blocked,'anomaly');assert.equal(a.summary.wrote,false);assert.equal(JSON.parse(fs.readFileSync(f,'utf8'))[0].wholesale,1000);
  const b=await R.run({dataPath:f,fetchImpl,delayMs:0,now:NOW,write:true,acceptAnomalies:true});assert.equal(b.summary.wrote,true);assert.equal(JSON.parse(fs.readFileSync(f,'utf8'))[0].wholesale,2000);
});
test('run：失敗比例過高或一次變動太多時停止寫入',async()=>{
  const rows=Array.from({length:10},(_,i)=>rec({id:String(i+1),api:'a'+(i+1)}));
  const f=tmp(rows);
  const failing=await R.run({dataPath:f,delayMs:0,now:NOW,write:true,fetchImpl:async url=>{if(['a1','a2'].includes(url))throw Error('HTTP 500');return [sku({partNumber:url.slice(1)})];}});
  assert.equal(failing.summary.blocked,'fail');assert.equal(failing.summary.wrote,false);assert.equal(failing.summary.failed,2);
  const many=Array.from({length:35},(_,i)=>rec({id:String(i+1),api:'a'+(i+1)}));const g=tmp(many);
  const wide=await R.run({dataPath:g,delayMs:0,now:NOW,write:true,fetchImpl:async url=>[sku({partNumber:url.slice(1),wholesalePriceString:'1,010'})]});
  assert.equal(wide.summary.changed,35);assert.equal(wide.summary.blocked,'anomaly');assert.equal(wide.summary.wrote,false);
});
test('報告含變動清單、停止原因與下一步',async()=>{
  const f=tmp([rec()]);const res=await R.run({dataPath:f,delayMs:0,now:NOW,fetchImpl:async()=>[sku({wholesalePriceString:'1,100'})]});
  const text=R.report(res,false);assert.match(text,/變動清單/);assert.match(text,/批發價 1,000→1,100（10\.0%）/);assert.match(text,/加 --write 寫入/);
});
