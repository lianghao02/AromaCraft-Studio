const test=require('node:test');
const assert=require('node:assert/strict');
const {createHarness}=require('../tools/gas-mock.cjs');
const c=createHarness().loadCore();
const materials=[{id:'oil',name:'測試精油',category:'精油'},{id:'base',name:'基底',category:'基底油'}];
const prices=[{id:'p1',materialId:'oil',amount:10,unit:'g',paid:100,label:'舊批次'},{id:'p2',materialId:'base',amount:100,unit:'g',paid:100,label:'一般批次'}];
const cost={packaging:2,minutes:30,hourly:200,other:10,loss:10,margin:40,sale:50};
function recipe(){return {name:'測試',type:'無水精油膏',units:10,cost,items:[{materialId:'oil',priceId:'p1',grams:1},{materialId:'base',priceId:'p2',grams:99}]};}
function near(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);}
test('密度與包裝重量必填，g 與 kg 正確換算',()=>{
  assert.throws(()=>c.price({amount:10,unit:'mL',paid:100,density:''}));
  near(c.price({amount:10,unit:'mL',paid:100,density:0.9}).perGram,100/9);
  assert.throws(()=>c.price({amount:2,unit:'瓶',paid:100,gramsPerUnit:''}));
  near(c.price({amount:2,unit:'瓶',paid:100,gramsPerUnit:50}).perGram,1);
  near(c.price({amount:1,unit:'kg',paid:100}).perGram,0.1);
});
test('原料、良率、包材、工時、售價與毛利計算',()=>{
  const r=c.calculate(recipe(),materials,prices,[]);
  near(r.total,100);near(r.items.reduce((s,i)=>s+i.percent,0),100);near(r.material,109);
  near(r.lossCost,109/0.9-109);near(r.packaging,20);near(r.labor,100);
  near(r.batch,109/0.9+130);near(r.perUnit,r.batch/10);near(r.suggested,r.perUnit/0.6);near(r.grossMargin,(50-r.perUnit)/50*100);
});
test('無效數值、空值、負重量與非整數產量均拒絕',()=>{
  for(const v of ['',null,NaN,Infinity,-1]) assert.throws(()=>c.number(v,'測試'));
  const r=recipe();r.units=1.5;assert.throws(()=>c.calculate(r,materials,prices,[]));
  r.units=1;r.cost={...cost,margin:100};assert.throws(()=>c.calculate(r,materials,prices,[]));
  r.cost=cost;r.items[0].grams=-1;assert.throws(()=>c.calculate(r,materials,prices,[]));
});
test('指定基底補足重量、避免負基底、等比例放大',()=>{
  const items=recipe().items,next=c.adjust(items,'oil',3,'base');near(next[1].grams,97);near(next[0].grams,3);near(items[0].grams,1);
  assert.throws(()=>c.adjust(items,'oil',101,'base'));
  const scaled=c.scale(items,200);near(scaled[0].grams,2);near(scaled[1].grams,198);
});
test('安全資料不足從不顯示通過，已核對限制超標才顯示超出',()=>{
  assert.equal(c.calculate(recipe(),materials,prices,[]).safety,'待驗證');
  const rule={materialId:'oil',type:'無水精油膏',maxPercent:0.5,status:'已核對',source:'測試來源（非真實安全指引）'};
  assert.equal(c.calculate(recipe(),materials,prices,[rule]).safety,'超出限制');
  assert.equal(c.calculate(recipe(),materials,prices,[{...rule,source:''}]).safety,'待驗證');
  assert.equal(c.calculate(recipe(),materials,prices,[{...rule,maxPercent:2}]).safety,'待驗證');
  assert.equal(c.calculate(recipe(),materials,prices,[{...rule,maxPercent:null}]).safety,'待驗證');
});
test('同原料重複與不同原料的價格批次均拒絕',()=>{
  const r=recipe();r.items.push({...r.items[0]});assert.throws(()=>c.calculate(r,materials,prices,[]));
  r.items.pop();r.items[0].priceId='p2';assert.throws(()=>c.calculate(r,materials,prices,[]));
});
test('極端換算造成無限值時拒絕保存成本',()=>{
  assert.throws(()=>c.price({amount:Number.MIN_VALUE,unit:'g',paid:1e12}));
});
