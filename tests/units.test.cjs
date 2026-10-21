const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness}=require('../tools/gas-mock.cjs');const c=createHarness().loadCore();
const materials=[{id:'oil',name:'合成測試精油',category:'精油'},{id:'base',name:'合成基底',category:'基底油'}];
const prices=[{id:'po',materialId:'oil',amount:15,unit:'mL',paid:300,density:.9,dropsPerMl:20,label:'測試批次'},{id:'pb',materialId:'base',amount:100,unit:'g',paid:80,density:.8,label:'測試批次'}];
const cost={packaging:2,minutes:0,hourly:0,other:0,loss:0,margin:0,sale:null};
const recipe=()=>({name:'合成單位測試，非製作建議',type:'按摩油',quantityUnit:'mL',targetQuantity:30,units:2,baseId:'base',cost,items:[{materialId:'oil',priceId:'po',quantity:10,unit:'滴'},{materialId:'base',priceId:'pb',quantity:0,unit:'mL'}]});
const near=(a,b)=>assert(Math.abs(a-b)<1e-8, a+' != '+b);

test('分享會 g 與 mL 分開算成本，不猜密度或顯示濃度',()=>{
 const ps=prices.map(p=>({...p,density:null,dropsPerMl:null}));
 const r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:'',items:[{materialId:'base',priceId:'pb',quantity:100,unit:'g'},{materialId:'oil',priceId:'po',quantity:.5,unit:'mL'}]};
 const out=c.calculate(r,materials,ps,[]);near(out.material,90);near(out.batch,94);near(out.perUnit,47);
 assert.equal(out.total,null);assert.equal(out.quantityPerUnit,null);assert.equal(out.oilPercent,null);assert.equal(out.items[0].percent,null);assert.equal(out.totals.g,100);assert.equal(out.totals.mL,.5);assert.equal(out.safety,'待驗證');
 assert.throws(()=>c.scaleRecipe(r,200,materials,ps),/分開計量/);
 assert.throws(()=>c.calculate({...r,items:[{...r.items[0],unit:'%',quantity:50},r.items[1]]},materials,ps,[]),/不計濃度/);
});
test('滴數只使用本次製作設定，缺資料拒絕且不修改原價',()=>{
 const ps=prices.map(p=>({...p,density:null,dropsPerMl:null})),r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:'',items:[{materialId:'oil',priceId:'po',quantity:10,unit:'滴',dropsPerMl:25}]};
 const out=c.calculate(r,materials,ps,[]);near(out.items[0].amount,.4);near(out.material,8);assert.equal(ps[0].dropsPerMl,null);
 assert.throws(()=>c.calculate({...r,items:[{...r.items[0],dropsPerMl:null}]},materials,ps,[]),/滴數/);
 assert.throws(()=>c.calculate({...r,items:[{...r.items[0],quantity:.5}]},materials,ps,[]),/整數/);
});
test('本次滴數保存讀回與歷史快照隔離',()=>{
 const h=createHarness();h.setup();ok(h,'importCatalog');const b=ok(h,'bootstrap'),p=b.prices.find(p=>p.materialId==='yl-354876');
 const r={name:'合成製作測試',type:'融製精油皂',quantityUnit:'mixed',targetQuantity:null,units:2,baseId:'',cost,version:0,requestId:'mix-drop-1',items:[{materialId:p.materialId,priceId:p.id,quantity:10,unit:'滴',dropsPerMl:25},{materialId:'demo-soap',priceId:'demo-soap-price',quantity:100,unit:'g'}]};
 const first=ok(h,'saveRecipe',r);near(first.snapshot.items[0].amount,.4);assert.equal(first.items[0].dropsPerMl,25);assert.equal(first.snapshot.total,null);
 const second=ok(h,'saveRecipe',{...first,requestId:'mix-drop-2',items:first.items.map(i=>i.unit==='滴'?{...i,dropsPerMl:50}:i)});near(second.snapshot.items[0].amount,.2);
 const frozen=ok(h,'loadRecipe',{id:first.id,version:1});near(frozen.snapshot.items[0].amount,.4);assert.equal(frozen.items[0].dropsPerMl,25);
});
test('配方移除可恢復，舊版本與製作紀錄不刪除，衝突及未授權拒絕',()=>{
 const h=createHarness();h.setup();const r=ok(h,'saveRecipe',{name:'封存合成測試',type:'融製精油皂',units:1,items:[{materialId:'demo-soap',priceId:'demo-soap-price',grams:100}],cost,version:0,requestId:'archive-save-1'});
 ok(h,'saveLog',{recipeId:r.id,version:1,date:'2026-10-13',units:1,requestId:'archive-log-1'});
 assert.equal(h.call('archiveRecipe',{id:r.id,version:2,archived:true}).ok,false);
 ok(h,'archiveRecipe',{id:r.id,version:1,archived:true});assert.equal(ok(h,'bootstrap').recipes[0].archived,true);assert.equal(ok(h,'bootstrap').logs.length,1);assert.equal(ok(h,'loadRecipe',{id:r.id,version:1}).name,r.name);
 assert.equal(h.call('saveRecipe',{...r,requestId:'archive-save-2'}).ok,false);
 ok(h,'archiveRecipe',{id:r.id,version:1,archived:false});assert.equal(ok(h,'bootstrap').recipes[0].archived,false);assert.equal(h.sheets.size,8);
 h.state.active=h.state.effective='outsider@example.test';assert.equal(h.call('archiveRecipe',{id:r.id,version:1,archived:true}).ok,false);
});
test('簡單商品設定一次存名稱容量價格，失敗重試不重複且舊價格保留',()=>{
 const h=createHarness();h.setup();const d={id:'simple-product',revision:0,name:'合成商品',category:'精油',note:'',active:true,amount:15,unit:'mL',paid:300,requestId:'product-setting-1'};
 assert.equal(h.call('saveProduct',{...d,paid:-1}).ok,false);assert.equal(ok(h,'bootstrap').materials.length,4);
 h.state.failWrite='原料價格';assert.equal(h.call('saveProduct',d).ok,false);ok(h,'saveProduct',d);ok(h,'saveProduct',d);
 let b=ok(h,'bootstrap');assert.equal(b.materials.filter(m=>m.id===d.id).length,1);assert.equal(b.prices.filter(p=>p.materialId===d.id).length,1);
 ok(h,'saveProduct',{...d,revision:1,paid:250,requestId:'product-setting-2'});b=ok(h,'bootstrap');assert.equal(b.prices.filter(p=>p.materialId===d.id).length,2);assert.equal(Number(b.prices.find(p=>p.id===d.requestId).paid),300);
});
test('原生 mL 成本不需密度；跨 g／mL 及滴數必須有資料',()=>{
 near(c.price({amount:15,unit:'mL',paid:3180},'mL').perMl,212);assert.throws(()=>c.price({amount:15,unit:'mL',paid:3180},'g'),/密度/);
 near(c.convert(2,'mL','g',{density:.9}),1.8);near(c.convert(1.8,'g','mL',{density:.9}),2);near(c.convert(10,'滴','mL',{dropsPerMl:20}),.5);
 assert.throws(()=>c.convert(1,'滴','mL'),/滴數/);assert.throws(()=>c.convert(1.5,'滴','mL',{dropsPerMl:20}),/整數/);
 for(const value of ['',NaN,Infinity,-1])assert.throws(()=>c.convert(value,'g','g'));
 for(const v of [0,-1,Infinity])assert.throws(()=>c.metadata({density:v}));
});
test('固定 mL 總量補足、混合輸入成本與每份量一致',()=>{
 const r=c.balance(recipe(),materials,prices),result=c.calculate(r,materials,prices,[]);near(r.items[1].quantity,29.5);near(result.total,30);near(result.quantityPerUnit,15);assert.equal(result.gramsPerUnit,null);
 near(result.material,28.88);near(result.batch,32.88);near(result.items.reduce((sum,i)=>sum+i.percent,0),100);
 const changed=c.editQuantity(r,'oil',20,'滴',materials,prices);near(changed.items[1].quantity,29);assert.equal(r.items[1].quantity,29.5);
});
test('百分比依固定總量換算，拒絕未知分母與超量',()=>{
 const r=c.editQuantity(recipe(),'oil',2,'%',materials,prices);near(c.itemAmount(r.items[0],r,prices),.6);near(r.items[1].quantity,29.4);near(c.calculate(r,materials,prices,[]).oilPercent,2);
 assert.throws(()=>c.editQuantity({...recipe(),targetQuantity:null},'oil',2,'%',materials,prices),/固定總量/);
 assert.throws(()=>c.editQuantity(recipe(),'oil',101,'%',materials,prices),/100/);
 assert.throws(()=>c.editQuantity(recipe(),'oil',31,'mL',materials,prices),/超過/);
 assert.throws(()=>c.editQuantity(c.balance(recipe(),materials,prices),'base',28,'mL',materials,prices),/補足原料/);
});
test('取消固定總量保留百分比的實量；縮放不四捨五入滴數',()=>{
 const r=c.editQuantity(recipe(),'oil',2,'%',materials,prices),free=c.releaseTarget(r,prices);assert.equal(free.targetQuantity,null);assert.equal(free.baseId,'');near(c.calculate(free,materials,prices,[]).total,30);assert.equal(free.items[0].unit,'mL');
 const scaled=c.scaleRecipe(c.balance(recipe(),materials,prices),45,materials,prices);near(c.calculate(scaled,materials,prices,[]).total,45);near(scaled.items[0].quantity,.75);assert.equal(scaled.items[0].unit,'mL');
});
test('自由總量反算百分比；固定總量不一致或用量欄位歧義拒絕',()=>{
 const r=c.balance(recipe(),materials,prices);r.targetQuantity=null;r.baseId='';near(c.calculate(r,materials,prices,[]).items[0].percent,.5/30*100);
 r.targetQuantity=31;assert.throws(()=>c.calculate(r,materials,prices,[]),/不一致/);
 r.targetQuantity=null;r.items[0].grams=99;assert.throws(()=>c.calculate(r,materials,prices,[]),/一種用量/);
 const s=recipe();s.quantityUnit='kg';assert.throws(()=>c.calculate(s,materials,prices,[]),/基準/);
});
test('固定總量浮點容差只容許數值誤差，不接受實際超量',()=>{
 assert.equal(c.sameTotal(.1+.2,.3),true);assert.equal(c.sameTotal(1e9+.01,1e9),false);assert.equal(c.sameTotal(1e-12,2e-12),false);
 const r=recipe();r.targetQuantity=.3;r.baseId='';r.items[0]={materialId:'oil',priceId:'po',quantity:.1,unit:'mL'};r.items[1]={materialId:'base',priceId:'pb',quantity:.2,unit:'mL'};near(c.calculate(r,materials,prices,[]).total,.3);
});
test('體積百分比不能套用舊重量安全規則',()=>{
 const r=c.balance(recipe(),materials,prices),rules=[{type:'按摩油',materialId:'oil',maxPercent:.1,status:'已核對',source:'合成測試，不是安全規範'}];const result=c.calculate(r,materials,prices,rules);assert.equal(result.safety,'待驗證');assert(result.messages.some(m=>m.includes('基準不符')));
 rules[0].basis='mL';assert.equal(c.calculate(r,materials,prices,rules).safety,'超出限制');
});
function ok(h,action,payload){const r=h.call(action,payload);assert.equal(r.ok,true,r.error);return r.value;}
test('mL／滴數保存與讀回一致，批次換算值和製作快照凍結',()=>{
 const h=createHarness();h.setup();const mat={id:'volume-oil',revision:0,name:'合成液體',category:'精油',active:true,note:''};ok(h,'saveMaterial',mat);
 ok(h,'savePrice',{requestId:'volume-price',materialId:mat.id,label:'測試',amount:10,unit:'mL',paid:100,density:.9,dropsPerMl:20});
 const r={id:'',version:0,requestId:'save-volume',name:'體積測試',type:'按摩油',quantityUnit:'mL',targetQuantity:1,baseId:'',units:1,notes:'',cost,items:[{materialId:mat.id,priceId:'volume-price',quantity:20,unit:'滴'}]};const saved=ok(h,'saveRecipe',r);near(saved.snapshot.total,1);assert.equal(saved.items[0].unit,'滴');assert.equal(saved.items[0].quantity,20);near(saved.snapshot.material,10);assert.equal(saved.quantityUnit,'mL');assert.equal(saved.targetQuantity,1);
 const log=ok(h,'saveLog',{requestId:'volume-log',recipeId:saved.id,version:1,date:'2026-10-13',units:2,notes:''});assert.equal(log.snapshot.quantityUnit,'mL');near(log.snapshot.quantityPerUnit,.5);assert.equal(log.snapshot.gramsPerUnit,null);const freeze=JSON.stringify(log.snapshot);
 ok(h,'savePrice',{requestId:'volume-price-new',materialId:mat.id,label:'換算更動',amount:10,unit:'mL',paid:200,density:1,dropsPerMl:10});assert.equal(JSON.stringify(ok(h,'bootstrap').logs[0].snapshot),freeze);near(ok(h,'loadRecipe',{id:saved.id,version:1}).snapshot.items[0].dropsPerMl,20);
 assert.equal(h.call('saveRecipe',{...r,requestId:'bad-total',targetQuantity:2}).ok,false);
});
test('追加欄位遷移保留舊 g 資料、可重跑且非管理員拒絕',()=>{
 const h=createHarness();h.ctx.setupDatabase();const r={id:'',version:0,requestId:'legacy-g',name:'舊版',type:'融製精油皂',units:1,notes:'',baseId:'',cost,items:[{materialId:'demo-soap',priceId:'demo-soap-price',grams:100}]};const saved=ok(h,'saveRecipe',r);const original=h.sheets.get('配方明細').values[1].slice();ok(h,'migrateUnits');ok(h,'migrateUnits');assert.deepEqual(h.sheets.get('配方明細').values[1],original);assert.equal(ok(h,'loadRecipe',{id:saved.id}).items[0].grams,100);
 h.state.active=h.state.effective='other@example.test';assert.equal(h.call('migrateUnits').ok,false);assert.equal(h.call('importCatalog').ok,false);
});
test('遷移欄位位置衝突先中止；官網匯入重試不重複',()=>{
 const h=createHarness();h.ctx.setupDatabase();h.sheets.get('安全規則').values[0][7]='其他資料';const before=JSON.stringify(h.sheets.get('原料價格').values[0]);assert.equal(h.call('migrateUnits').ok,false);assert.equal(JSON.stringify(h.sheets.get('原料價格').values[0]),before);
 const good=createHarness();good.setup();const a=ok(good,'importCatalog');assert(a.added>0);assert.equal(ok(good,'importCatalog').added,0);const p=ok(good,'bootstrap').prices.find(p=>p.materialId==='yl-354876');assert.equal(p.unit,'mL');assert.equal(p.density,'');near(good.loadCore().price(p,'mL').perMl,212);
});

test('切換輸入單位保留實量，非整滴不偷偷四捨五入',()=>{
 const r=recipe();near(c.convertInput(.45,'g','mL',prices[0],r),.5);assert.equal(c.convertInput(.45,'g','滴',prices[0],r),10);near(c.convertInput(10,'滴','%',prices[0],r),.5/30*100);
 near(c.convertInput(2,'%', 'mL',prices[0],r),.6);assert.throws(()=>c.convertInput(.51,'mL','滴',prices[0],r),/整滴/);
 assert.throws(()=>c.convertInput(.5,'mL','%',prices[0],{...r,targetQuantity:null}),/固定總量/);
});

test('表頭空白但新增欄位有資料時拒絕遷移，不猜測單位型態',()=>{const h=createHarness();h.ctx.setupDatabase();h.sheets.get('原料價格').values[1][10]='人工備註';assert.equal(h.call('migrateUnits').ok,false);assert.equal(h.sheets.get('原料價格').values[0].length,10);assert.throws(()=>c.basisOf({quantityUnit:false}));});


test('原表實體欄數不足時安全擴充，升級前仍可讀取舊資料',()=>{
 const h=createHarness();h.ctx.setupDatabase();for(const name of ['原料價格','配方資料','配方明細','安全規則']){const sheet=h.sheets.get(name);sheet.maxColumns=sheet.values[0].length;sheet.getMaxColumns=()=>sheet.maxColumns;sheet.insertColumnsAfter=(start,n)=>{assert.equal(start,sheet.maxColumns);sheet.maxColumns+=n;};const original=sheet.getRange.bind(sheet);sheet.getRange=(r,c,n=1,m=1)=>{if(c+m-1>sheet.maxColumns)throw Error('超出實體欄數');return original(r,c,n,m);};}
 assert.equal(ok(h,'bootstrap').materials.length,4);ok(h,'migrateUnits');assert.equal(h.sheets.get('配方明細').maxColumns,8);assert.equal(ok(h,'bootstrap').unitSchema,true);
});

test('濃度依各瓶實際換算合計，整滴上限向下取整且不修改原料',()=>{
 const ms=[...materials,{id:'oil2',name:'合成測試第二瓶',category:'精油'}],ps=[...prices,{id:'po2',materialId:'oil2',amount:5,unit:'mL',paid:100,dropsPerMl:40}];
 const r={...recipe(),quantityUnit:'mixed',baseId:'',targetQuantity:null,concentration:{totalMl:30,maxPercent:2},items:[{materialId:'oil',priceId:'po',unit:'滴',quantity:5},{materialId:'oil2',priceId:'po2',unit:'滴',quantity:4},{materialId:'base',priceId:'pb',unit:'g',quantity:10}]};
 const out=c.concentration(r,ms,ps,'oil');near(out.oilMl,.35);near(out.percent,.35/30*100);assert.equal(out.maxDrops,10);assert.equal(out.remainingDrops,5);
 assert.equal(c.concentration(r,ms,ps,'oil2').remainingDrops,10);assert.equal(c.concentration(r,ms,ps).totalMismatch,true);
 const unknown=ps.map(p=>({...p,density:null}));assert.equal(c.concentration(r,ms,unknown).totalMismatch,false);
 assert.throws(()=>c.editQuantity(r,'oil',11,'滴',ms,unknown),/超過/);assert.equal(r.items[0].quantity,5);
 const boundary={...r,items:r.items.map(i=>i.materialId==='oil'?{...i,quantity:10}:i)};assert.equal(c.concentration(boundary,ms,unknown,'oil').remainingDrops,0);assert.equal(c.concentration(boundary,ms,unknown).overLimit,false);
});
test('濃度缺資料不猜值；重量比例不冒充體積；錯誤容量不可保存',()=>{
 const r={...recipe(),quantityUnit:'mixed',baseId:'',targetQuantity:null,concentration:{totalMl:30,maxPercent:2},items:[{materialId:'oil',priceId:'po',quantity:10,unit:'滴',dropsPerMl:20},{materialId:'base',priceId:'pb',quantity:29.5,unit:'mL'}]};
 near(c.validateConcentration(r,materials,prices).percent,.5/30*100);
 assert.throws(()=>c.validateConcentration({...r,concentration:{totalMl:100,maxPercent:2}},materials,prices),/總容量不同/);
 assert.throws(()=>c.validateConcentration({...r,concentration:{maxPercent:2}},materials,prices),/請填成品/);
 assert.throws(()=>c.concentration({...r,concentration:{maxPercent:101}},materials,prices),/範圍/);
 const ps=prices.map(p=>({...p,density:null,dropsPerMl:null}));const missing={...r,items:[{materialId:'oil',priceId:'po',quantity:10,unit:'滴'}]};assert.equal(c.concentration(missing,materials,ps).percent,null);assert.throws(()=>c.validateConcentration(missing,materials,ps),/換算/);
 assert.equal(c.concentration({...missing,concentration:null,items:[{materialId:'oil',priceId:'po',quantity:1,unit:'g'}]},materials,ps).percent,null);
 assert.equal(c.concentration({...r,items:[{materialId:'oil',priceId:'po',quantity:'',unit:'mL'}]},materials,prices).percent,null);
});
test('濃度設定保存讀回，API 超標拒絕且歷史快照保留',()=>{
 const h=createHarness();h.setup();ok(h,'importCatalog');const b=ok(h,'bootstrap'),p=b.prices.find(p=>p.materialId==='yl-354876');
 const r={name:'合成濃度測試，非安全建議',type:'按摩油',quantityUnit:'mixed',targetQuantity:null,baseId:'',units:1,cost,version:0,requestId:'concentration-test-1',concentration:{totalMl:30,maxPercent:2},items:[{materialId:p.materialId,priceId:p.id,quantity:10,unit:'滴',dropsPerMl:20},{materialId:'demo-soap',priceId:'demo-soap-price',quantity:100,unit:'g'}]};
 const saved=ok(h,'saveRecipe',r);assert.equal(saved.concentration.maxPercent,2);near(saved.snapshot.concentration.percent,.5/30*100);
 const reject=h.call('saveRecipe',{...saved,requestId:'concentration-test-2',items:saved.items.map(i=>i.unit==='滴'?{...i,quantity:13}:i)});assert.equal(reject.ok,false);assert.match(JSON.stringify(reject),/超過/);assert.equal(ok(h,'bootstrap').recipes.length,1);
 const updated=ok(h,'saveRecipe',{...saved,requestId:'concentration-test-3',concentration:{totalMl:30,maxPercent:3}});assert.equal(updated.concentration.maxPercent,3);assert.equal(ok(h,'loadRecipe',{id:saved.id,version:1}).concentration.maxPercent,2);
});

test('三步驟混合投入與份數驗收，不猜密度也不改整批用量',()=>{
 const ms=[{id:'soap',name:'測試皂基',category:'皂基'},{id:'base',name:'測試油',category:'基底油'},{id:'oil',name:'測試精油',category:'精油'}],ps=[{id:'s',materialId:'soap',amount:1000,unit:'g',paid:200},{id:'b',materialId:'base',amount:100,unit:'mL',paid:300},{id:'o',materialId:'oil',amount:15,unit:'mL',paid:600,dropsPerMl:20}];
 const r={name:'三步驟合成驗收',type:'無水精油膏',quantityUnit:'mixed',units:5,cost:{...cost,packaging:0},concentration:{auto:true,totalMl:999},items:[{materialId:'soap',priceId:'s',quantity:100,unit:'g'},{materialId:'base',priceId:'b',quantity:10,unit:'mL'}]};
 const out=c.calculate(r,ms,ps,[]);near(out.material,50);near(out.batch,50);near(out.perUnit,10);assert.equal(out.totals.g,100);assert.equal(out.totals.mL,10);assert.equal(out.total,null);assert.equal(out.concentration.noOil,true);assert.equal(r.items[0].quantity,100);
 const oil={materialId:'oil',priceId:'o',quantity:10,unit:'滴'};near(c.calculate({...r,items:[oil]},ms,ps,[]).material,20);
 const weight={...r,items:[r.items[0],oil]};near(c.calculate(weight,ms,ps,[]).concentration.percent,.45/100.45*100);near(c.concentration(weight,ms,ps).dropsPer100g,10);assert.equal(c.validateConcentration({...weight,concentration:{auto:true,maxPercent:1}},ms,ps).available,true);
 const missing=ps.map(p=>p.id==='o'?{...p,dropsPerMl:null}:p);const partial=c.calculate(weight,ms,missing,[]);near(partial.knownMaterial,20);assert.equal(partial.batch,null);assert.equal(partial.concentration.dropsPer100g,10);assert.match(partial.missingPrices[0].reason,/滴數/);
 assert.throws(()=>c.calculate({...weight,items:[{...oil,quantity:1.5}]},ms,ps,[]),/整數/);assert.throws(()=>c.calculate({...r,units:1.5},ms,ps,[]),/整數/);
});
test('採購同類單位、可選用量單位與零元／缺價區分',()=>{
 near(c.convert(1,'kg','g',{}),1000);near(c.convert(.5,'L','mL',{}),500);near(c.price({amount:1,unit:'L',paid:200},'mL').perUnit,.2);
 assert.deepEqual(Array.from(c.availableUnits({unit:'g'},'皂基')),['g','kg']);assert.deepEqual(Array.from(c.availableUnits({unit:'mL'},'基底油')),['mL','L']);assert(c.availableUnits({unit:'mL',density:.9},'精油').includes('g'));assert.throws(()=>c.convert(1,'g','mL',{}),/密度/);
 const r={...recipe(),quantityUnit:'mixed',baseId:'',targetQuantity:null,units:1,concentration:{auto:true},items:[{materialId:'base',priceId:'pb',quantity:10,unit:'g'}]};const zero=prices.map(p=>({...p,paid:0}));assert.equal(c.calculate(r,materials,zero,[]).costComplete,true);near(c.calculate(r,materials,zero,[]).material,0);
 const missing=prices.map(p=>({...p,paid:''}));const out=c.calculate(r,materials,missing,[]);assert.equal(out.costComplete,false);assert.equal(out.batch,null);assert.equal(out.missingPrices[0].name,'合成基底');
 const volume={...r,items:[{materialId:'oil',priceId:'po',quantity:1,unit:'mL'},{materialId:'base',priceId:'pb',quantity:9,unit:'mL'}]};near(c.concentration(volume,materials,prices).percent,10);assert.equal(c.concentration(volume,materials,prices).basis,'mL');
});

test('三步驟無價格批次可統計用量並明示未完整；自動基準設定保存及歷史容量不清除',()=>{
 const r={name:'缺價合成測試',type:'按摩油',quantityUnit:'mixed',units:1,cost,concentration:{auto:true,totalMl:30,maxPercent:2,limitBasis:'g'},items:[{materialId:'oil',priceId:'',unit:'mL',quantity:1}]};const out=c.calculate(r,materials,[],[]);assert.equal(out.costComplete,false);assert.equal(out.batch,null);assert.equal(out.totals.mL,1);assert.equal(out.missingPrices[0].name,'合成測試精油');
 const h=createHarness();h.setup();const b=ok(h,'bootstrap'),p=b.prices.find(p=>p.materialId==='demo-soap');const d={...r,name:'自動濃度保存合成測試',requestId:'automatic-save-1',items:[{materialId:'demo-soap',priceId:p.id,quantity:100,unit:'g'}]};const saved=ok(h,'saveRecipe',d);assert.equal(saved.concentration.auto,true);assert.equal(saved.concentration.totalMl,30);assert.equal(saved.concentration.limitBasis,'g');assert.equal(saved.snapshot.concentration.basis,'g');
});


test('作品基準、零用量、具名缺資料與添加比例',()=>{
 const ps=prices.map(p=>({...p,density:null,dropsPerMl:null}));
 const r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:'',concentration:{auto:true,basis:'mL'},items:[{materialId:'oil',priceId:'po',quantity:1,unit:'mL'},{materialId:'base',priceId:'pb',quantity:0,unit:'g'}]};
 assert.equal(c.productBasis('按摩油'),'mL');assert.equal(c.productBasis('融製精油皂'),'g');
 near(c.concentration(r,materials,ps).percent,100);
 const mixed={...r,concentration:{auto:true,basis:'g'},items:[r.items[0],{...r.items[1],quantity:100}]};
 const result=c.concentration(mixed,materials,ps);assert.equal(result.available,true);assert.equal(result.densityEstimated,true);assert.match(result.message,/含估算密度/);
 const drop={...mixed,items:[{...mixed.items[0],quantity:10,unit:'滴'},mixed.items[1]]};near(c.concentration(drop,materials,ps).dropsPer100g,10);
 const partial={...drop,items:[...drop.items,{materialId:'oil2',priceId:'po2',quantity:1,unit:'mL'}]};
 assert.equal(c.concentration(partial,[...materials,{id:'oil2',name:'另一瓶',category:'精油'}],[...ps,{...ps[0],id:'po2',materialId:'oil2'}]).dropsPer100g,null);
});
test('實秤重量只補濃度不雙算成本，用量變動後失效',()=>{
 const ps=prices.map(p=>({...p,density:null}));
 const r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:'',units:1,concentration:{auto:true,basis:'g',measuredWeights:{oil:{grams:.9,quantity:1,unit:'mL',priceId:'po'}}},items:[{materialId:'oil',priceId:'po',quantity:1,unit:'mL'},{materialId:'base',priceId:'pb',quantity:99,unit:'g'}]};
 const result=c.calculate(r,materials,ps,[]);near(result.concentration.percent,.9/99.9*100);near(result.material,20+99*.8);
 near(c.calculate({...r,units:5},materials,ps,[]).concentration.percent,result.concentration.percent);
 const changed=c.concentration({...r,items:[{...r.items[0],quantity:2},r.items[1]]},materials,ps);assert.equal(changed.densityEstimated,true);assert.ok(Math.abs(changed.percent-.9/99.9*100)>0.1);
 assert.throws(()=>c.concentration({...r,concentration:{...r.concentration,measuredWeights:{oil:{...r.concentration.measuredWeights.oil,grams:-1}}}},materials,ps),/實秤重量/);
});
test('自由總量滴數上限使用包含精油的分母，各瓶換算分開',()=>{
 const ps=[{...prices[0],density:null,dropsPerMl:20},{...prices[1],unit:'mL',density:null}];
 const r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:'',concentration:{auto:true,basis:'mL',limitBasis:'mL',maxPercent:1},items:[{materialId:'oil',priceId:'po',quantity:0,unit:'滴'},{materialId:'base',priceId:'pb',quantity:30,unit:'mL'}]};
 const result=c.concentration(r,materials,ps,'oil');assert.equal(result.maxDrops,6);assert.equal(result.remainingDrops,6);
 const withOil={...r,items:[{...r.items[0],quantity:6},r.items[1]]};near(c.concentration(withOil,materials,ps).percent,.3/30.3*100);
 const multi={...r,concentration:{auto:true,basis:'mL'},items:[{...r.items[0],quantity:20},{materialId:'oil2',priceId:'po2',quantity:40,unit:'滴'},r.items[1]]};
 const out=c.concentration(multi,[...materials,{id:'oil2',name:'第二瓶',category:'精油'}],[...ps,{...ps[0],id:'po2',materialId:'oil2',dropsPerMl:40}]);near(out.percent,2/32*100);
});
test('補充重量經伺服器保存讀回，價格更新不改歷史比例快照',()=>{
 const h=createHarness();h.setup();h.call('migrateUnits');
 const b=h.call('bootstrap').value,base=b.materials.find(m=>m.category==='基底油'),oil=b.materials.find(m=>m.category==='精油');
 const bp=b.prices.find(p=>p.materialId===base.id),op=b.prices.find(p=>p.materialId===oil.id);
 const r={...recipe(),id:'',version:0,requestId:'ratio-save-001',quantityUnit:'mixed',targetQuantity:null,baseId:'',concentration:{auto:true,basis:'g',measuredWeights:{[oil.id]:{grams:.9,quantity:1,unit:'mL',priceId:op.id}}},items:[{materialId:oil.id,priceId:op.id,quantity:1,unit:'mL'},{materialId:base.id,priceId:bp.id,quantity:99,unit:'g'}]};
 const saved=h.call('saveRecipe',r);assert.equal(saved.ok,true,saved.error);assert.equal(saved.value.concentration.measuredWeights[oil.id].grams,.9);near(saved.value.snapshot.concentration.percent,.9/99.9*100);
 const loaded=h.call('loadRecipe',{id:saved.value.id,version:1});assert.equal(loaded.ok,true);near(loaded.value.snapshot.concentration.percent,saved.value.snapshot.concentration.percent);
});


test('日常精油預設20滴換算，個別設定優先且不影響其他原料',()=>{
 const ps=prices.map(p=>({...p,density:null,dropsPerMl:null}));
 const r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:'',concentration:{auto:true,useDefaultDrops:true,basis:'mL'},items:[{materialId:'oil',priceId:'po',quantity:10,unit:'滴'},{materialId:'base',priceId:'pb',quantity:29.5,unit:'mL'}]};
 const pp=[ps[0],{...ps[1],unit:'mL'}];const out=c.calculate(r,materials,pp,[]);near(out.items[0].amount,.5);near(out.items[0].cost,10);near(out.concentration.percent,.5/30*100);assert.match(out.concentration.message,/估算/);
 const custom=c.calculate({...r,items:[{...r.items[0],dropsPerMl:40},r.items[1]]},materials,pp,[]);near(custom.items[0].amount,.25);
 const byPrice=c.calculate(r,materials,[{...pp[0],dropsPerMl:25},pp[1]],[]);near(byPrice.items[0].amount,.4);
 assert.equal(c.applyDropDefaults(r,materials,pp).items[1].dropsPerMl,undefined);assert.equal(ps[0].dropsPerMl,null);
 const weight={...r,concentration:{...r.concentration,basis:'g'},items:[r.items[0],{...r.items[1],unit:'g',quantity:100}]};assert.equal(c.concentration(weight,materials,ps).available,true);near(c.concentration(weight,materials,ps).dropsPer100g,10);
});
test('預設滴數由伺服器重新計算並保存至配方，舊快照不追溯更新',()=>{
 const h=createHarness();h.setup();h.call('migrateUnits');const b=h.call('bootstrap').value,oil=b.materials.find(m=>m.category==='精油'),op=b.prices.find(p=>p.materialId===oil.id);
 const r={...recipe(),id:'',version:0,requestId:'default-drops-001',quantityUnit:'mixed',targetQuantity:null,baseId:'',concentration:{auto:true,useDefaultDrops:true,basis:'mL'},items:[{materialId:oil.id,priceId:op.id,quantity:10,unit:'滴'}]};
 const saved=h.call('saveRecipe',r);assert.equal(saved.ok,true,saved.error);assert.equal(saved.value.items[0].dropsPerMl,20);assert.equal(saved.value.concentration.useDefaultDrops,true);
});


test('分開計量下已填用量可切換mL與滴，不以mixed當換算基準',()=>{
 const r={...recipe(),quantityUnit:'mixed',targetQuantity:null,baseId:''};
 const p={...prices[0],density:null,dropsPerMl:20};
 assert.equal(c.convertInput(2,'mL','滴',p,r),40);near(c.convertInput(40,'滴','mL',p,r),2);near(c.convertInput(1000,'mL','L',p,r),1);
 assert.throws(()=>c.convertInput(.51,'mL','滴',p,r),/整滴/);
 assert.throws(()=>c.convertInput(10,'g','mL',p,r),/密度/);
 assert.throws(()=>c.convertInput(1,'mL','%',p,r),/分開計量/);
});

test('精油膏依可用基準計算容量濃度，混合重量不捏造百分比',()=>{
 const ps=prices.map(p=>({...p,unit:'mL',density:null,dropsPerMl:null}));
 const r={...recipe(),type:'精油膏',quantityUnit:'mixed',targetQuantity:null,baseId:'',concentration:{auto:true,useDefaultDrops:true,basis:'g',limitBasis:'g'},items:[{materialId:'oil',priceId:'po',quantity:6,unit:'滴'},{materialId:'base',priceId:'pb',quantity:30,unit:'mL'}]};
 const before=JSON.stringify(r),out=c.concentration(r,materials,ps);assert.equal(out.available,true);assert.equal(out.basis,'mL');near(out.percent,.3/30.3*100);assert.equal(JSON.stringify(r),before);
 const mixed=c.concentration({...r,items:[r.items[0],{...r.items[1],unit:'g',quantity:100}]},materials,ps);assert.equal(mixed.available,true);assert.equal(mixed.densityEstimated,true);near(mixed.percent,.27/100.27*100);near(mixed.dropsPer100g,6);
 const weight=c.concentration({...r,items:[{...r.items[0],unit:'g',quantity:1},{...r.items[1],unit:'g',quantity:99}]},materials,ps);assert.equal(weight.basis,'g');near(weight.percent,1);
 const limited=c.concentration({...r,concentration:{...r.concentration,maxPercent:2,limitBasis:'g'}},materials,ps);assert.equal(limited.overLimit,false);assert.match(limited.message,/基準不同/);
});


test('精油膏容量與滴數濃度由後端重算保存，讀回基準一致',()=>{
 const h=createHarness();h.setup();ok(h,'importCatalog');const b=ok(h,'bootstrap');
 const oil=b.prices.find(p=>p.materialId==='yl-354876'),base=b.prices.find(p=>p.materialId==='demo-oil');
 const r={name:'容量膏合成測試',type:'精油膏',quantityUnit:'mixed',targetQuantity:null,baseId:'',units:1,cost,concentration:{auto:true,basis:'g',limitBasis:'g',useDefaultDrops:true},items:[{materialId:'yl-354876',priceId:oil.id,quantity:6,unit:'滴'},{materialId:'demo-oil',priceId:base.id,quantity:30,unit:'mL'}],requestId:'volume-balm'};
 const saved=ok(h,'saveRecipe',r),loaded=ok(h,'loadRecipe',{id:saved.id,version:saved.version});assert.equal(loaded.snapshot.concentration.basis,'mL');near(loaded.snapshot.concentration.percent,.3/30.3*100);assert.equal(loaded.items.find(i=>i.materialId==='yl-354876').unit,'滴');
});

test('按摩膏：滴數＋mL＋g 混合時，缺密度只點名蜂蠟，補密度後可算容量估算',()=>{
 const oils=[['馬鬱蘭',1450,4],['薰衣草',1020,4],['薄荷',940,2],['迷迭香',680,2]];
 const ms=[...oils.map((o,i)=>({id:'o'+i,name:o[0],category:'精油'})),{id:'wax',name:'蜂蠟',category:'蜂蠟'},{id:'bo',name:'基底油',category:'基底油'}];
 const waxPrice={id:'pw',materialId:'wax',amount:100,unit:'g',paid:0};
 const ps=[...oils.map((o,i)=>({id:'p'+i,materialId:'o'+i,amount:15,unit:'mL',paid:o[1]})),waxPrice,{id:'pb',materialId:'bo',amount:100,unit:'mL',paid:0}];
 const r={name:'按摩膏',type:'無水精油膏',units:1,quantityUnit:'mixed',targetQuantity:null,concentration:{auto:true,useDefaultDrops:true,basis:'g',limitBasis:'g'},cost:{packaging:0,minutes:0,hourly:0,other:0,loss:0,margin:0,sale:null},
  items:[...oils.map((o,i)=>({materialId:'o'+i,priceId:'p'+i,unit:'滴',quantity:o[2]})),{materialId:'wax',priceId:'pw',unit:'g',quantity:5},{materialId:'bo',priceId:'pb',unit:'mL',quantity:25}]};
 const miss=c.concentration(r,ms,ps);
 assert.equal(miss.available,true);assert.equal(miss.basis,'g');assert.equal(miss.densityEstimated,true);near(miss.percent,.54/(.54+25*.92+5)*100);assert.match(miss.message,/含估算密度/);
 const ok=c.concentration({...r,concentration:{...r.concentration,measuredWeights:{}}},ms,ps.map(p=>({...p,density:p.materialId==='bo'?0.92:p.materialId==='wax'?null:0.9})));
 assert.equal(ok.available,true);assert.equal(ok.densityEstimated,false);near(ok.percent,.54/(.54+25*.92+5)*100);
});
