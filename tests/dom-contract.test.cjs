const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=path.join(__dirname,'..','src');
const client=fs.readFileSync(path.join(src,'Client.html'),'utf8'),index=fs.readFileSync(path.join(src,'Index.html'),'utf8');
// 為什麼需要這個測試：client.test.cjs 的假 DOM 會自動造出任何 id，Client 引用了真實頁面沒有的元素時，測試完全看不出來
// （曾發生：`#blank` 只在測試裡存在，真實頁面沒有按鈕，使用者無法清空重來）。拆檔或搬移程式碼後也靠它確認元素沒漏。
// 遺留的選用元素：Client 以 `if ($('id'))` 保護，頁面沒有這些元素時會直接略過。新增項目前請先確認真的需要，優先把元素加進 Index.html。
const LEGACY_OPTIONAL=['modeFormulate','modeCost','gotoSaved','manageMaterialsBtn','quickNewMaterial','btnReturnFormulate','backToSelection','save'];
const inIndex=new Set([...index.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const generated=new Set([...client.matchAll(/\bid="([A-Za-z0-9_-]+)"/g)].map(m=>m[1]));
for(const m of client.matchAll(/input\('[^']*','([A-Za-z0-9_-]+)'/g))generated.add(m[1]);
const refs=new Map();
client.split(/\r?\n/).forEach((line,i)=>{for(const m of line.matchAll(/\$\('([A-Za-z0-9_-]+)'\)|getElementById\('([A-Za-z0-9_-]+)'\)/g)){const id=m[1]||m[2];if(!refs.has(id))refs.set(id,[]);refs.get(id).push({n:i+1,line});}});
test('Client 引用的元素 id 必須存在於真實頁面（Index.html）或由 Client 動態產生',()=>{
  const missing=[...refs.keys()].filter(id=>!inIndex.has(id)&&!generated.has(id)&&!LEGACY_OPTIONAL.includes(id));
  assert.deepEqual(missing,[],'Client.html 引用了真實頁面沒有的元素：'+missing.join('、')+'。請在 Index.html 補上元素，或確認是動態產生。');
});
test('遺留選用元素必須全程有 if 保護，且不得出現在真實頁面（出現了就該從清單移除）',()=>{
  for(const id of LEGACY_OPTIONAL){
    assert.ok(refs.has(id),id+' 已不再被引用，請從 LEGACY_OPTIONAL 移除');
    assert.ok(!inIndex.has(id)&&!generated.has(id),id+' 已存在於頁面，請從 LEGACY_OPTIONAL 移除');
    assert.match(refs.get(id)[0].line,/\bif\s*\(/,id+' 第一次引用（行 '+refs.get(id)[0].n+'）沒有 if 保護，頁面沒有此元素時會當掉');
  }
});
test('動態 id 前綴（quantity-、quantity-error-、quantity-unit-）仍由用量列樣板產生',()=>{
  for(const p of ['quantity-','quantity-error-','quantity-unit-'])assert.ok(client.includes('id="'+p+"'+id+'\"")||client.includes('id="'+p+'\'+id'),'找不到動態 id 樣板：'+p);
});
