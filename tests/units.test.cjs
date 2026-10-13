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
 const out=c.calculate(r,ms,ps,[]);near(out.material,50);near(out.batch,50);near(out.perUnit,10);assert.equal(out.totals.g,100);assert.equal(out.totals.mL,10);assert.equal(out.total,null);assert.equal(out.concentration.percent,null);assert.equal(r.items[0].quantity,100);
 const oil={materialId:'oil',priceId:'o',quantity:10,unit:'滴'};near(c.calculate({...r,items:[oil]},ms,ps,[]).material,20);
 const weight={...r,items:[r.items[0],oil]};assert.equal(c.calculate(weight,ms,ps,[]).concentration.percent,null);near(c.concentration(weight,ms,ps).dropsPer100g,10);assert.equal(c.validateConcentration({...weight,concentration:{auto:true,maxPercent:1}},ms,ps).available,false);
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
