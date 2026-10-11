const test=require('node:test');
const assert=require('node:assert/strict');
const {createHarness}=require('../tools/gas-mock.cjs');
function start(){const h=createHarness();h.setup();return h;}
function ok(h,action,d){const r=h.call(action,d);assert.equal(r.ok,true,r.error);return r.value;}
function recipe(){return {id:'',version:0,requestId:'request-1',name:'家庭測試皂',type:'融製精油皂',units:2,notes:'',baseId:'demo-soap',cost:{packaging:2,minutes:0,hourly:0,other:0,loss:0,margin:20,sale:null},items:[{materialId:'demo-soap',priceId:'demo-soap-price',grams:100}]};}
test('初始化八表、重跑不重複且保留既有資料',()=>{
  const h=start();assert.equal(h.sheets.size,8);h.setup();assert.equal(ok(h,'bootstrap').materials.length,4);assert.equal(ok(h,'bootstrap').prices.length,4);
});
test('空身分、未授權帳號、身分不符均無法讀寫與匯出',()=>{
  for(const mode of ['empty','stranger','mismatch']){
    const h=start();if(mode==='empty')h.state.active='';if(mode==='stranger')h.state.active=h.state.effective='stranger@example.test';if(mode==='mismatch')h.state.effective='other@example.test';
    for(const action of ['bootstrap','saveRecipe','saveMaterial','savePrice','saveCost','saveLog','export','loadRecipe'])assert.equal(h.call(action,recipe()).ok,false,action);
    assert.match(h.ctx.doGet().html,/目前無法存取/);
  }
});
test('初始化只允許管理員，白名單設定錯誤時拒絕',()=>{
  const h=start();h.state.active=h.state.effective='other@example.test';assert.throws(()=>h.setup());
  h.state.properties.ALLOWED_EMAILS='';assert.equal(h.call('bootstrap').ok,false);
});
test('配方版本不可覆寫、並行舊版本拒絕、重試不重複',()=>{
  const h=start(), r=ok(h,'saveRecipe',recipe());assert.equal(r.version,1);
  assert.equal(ok(h,'saveRecipe',recipe()).id,r.id);
  const next=ok(h,'saveRecipe',{...r,name:'新版',requestId:'request-2'});assert.equal(next.version,2);
  assert.equal(h.call('saveRecipe',{...r,requestId:'request-3'}).ok,false);
  assert.equal(ok(h,'loadRecipe',{id:r.id,version:1}).name,'家庭測試皂');
  assert.equal(ok(h,'loadRecipe',{id:r.id}).version,2);
});
test('寫入失敗後重試不留下重複明細，未提交版本不曝光',()=>{
  const h=start(), r=ok(h,'saveRecipe',recipe());h.state.failWrite='配方資料';
  const payload={...r,requestId:'retry-failure',items:[{...r.items[0],grams:200}]};
  assert.equal(h.call('saveRecipe',payload).ok,false);assert.equal(ok(h,'loadRecipe',{id:r.id}).version,1);
  assert.equal(ok(h,'saveRecipe',payload).version,2);
  const exported=ok(h,'export');assert.equal(exported.tables['配方明細'].filter(i=>i.recipeId===r.id && i.version===2).length,1);
});
test('新價格與原料名稱更新後，配方及製作成本快照不變',()=>{
  const h=start();ok(h,'savePrice',{requestId:'real-price',materialId:'demo-soap',label:'實際批次',amount:100,unit:'g',paid:100});
  const r=recipe();r.items[0].priceId='real-price';const saved=ok(h,'saveRecipe',r);
  const log=ok(h,'saveLog',{requestId:'log-1',recipeId:saved.id,version:1,date:'2026-10-11',units:4,notes:'測試'});
  const frozen=JSON.stringify(log.snapshot);
  ok(h,'savePrice',{requestId:'new-price',materialId:'demo-soap',label:'新批次',amount:100,unit:'g',paid:500});
  const material=ok(h,'bootstrap').materials.find(m=>m.id==='demo-soap');ok(h,'saveMaterial',{...material,name:'變更品名'});
  assert.equal(JSON.stringify(ok(h,'bootstrap').logs[0].snapshot),frozen);
  assert.equal(ok(h,'loadRecipe',{id:saved.id,version:1}).snapshot.items[0].name,'皂基（試算）');
  assert.equal(ok(h,'saveLog',{requestId:'log-1',recipeId:saved.id,version:1,date:'2026-10-11',units:4,notes:'測試'}).id,log.id);
  assert.equal(log.snapshot.perUnit,27);assert.equal(log.snapshot.units,4);
});
test('原料新增重試與修改衝突、停用不刪歷史、價格重試',()=>{
  const h=start(),d={id:'custom',revision:0,name:'自有原料',category:'其他',note:'',active:true};
  const m=ok(h,'saveMaterial',d);assert.equal(ok(h,'saveMaterial',d).id,m.id);
  assert.equal(h.call('saveMaterial',{...d,name:'不同修改'}).ok,false);
  const changed=ok(h,'saveMaterial',{...m,active:false});assert.equal(changed.active,false);
  const p={requestId:'p-unique',materialId:'custom',label:'批次',amount:10,unit:'g',paid:20};
  ok(h,'savePrice',p);ok(h,'savePrice',p);assert.equal(ok(h,'bootstrap').prices.filter(p=>p.id==='p-unique').length,1);
});
test('成本設定需最新修訂；錯誤日期與產量拒絕',()=>{
  const h=start(),data=ok(h,'bootstrap');ok(h,'saveCost',{revision:data.costRevision,cost:data.cost});
  assert.equal(h.call('saveCost',{revision:data.costRevision,cost:data.cost}).ok,false);
  const r=ok(h,'saveRecipe',recipe());
  assert.equal(h.call('saveLog',{requestId:'bad-date',recipeId:r.id,version:1,date:'2026-02-30',units:2}).ok,false);
  assert.equal(h.call('saveLog',{requestId:'bad-unit',recipeId:r.id,version:1,date:'2026-10-11',units:0}).ok,false);
});
test('鎖定失敗不寫入、公式開頭文字做字面處理、匯出涵蓋八表',()=>{
  const h=start();h.state.locked=true;assert.equal(h.call('saveRecipe',recipe()).ok,false);h.state.locked=false;
  assert.equal(h.ctx.cell_('=IMPORTXML("x")'),'\'=IMPORTXML("x")');
  const ex=ok(h,'export');assert.equal(Object.keys(ex.tables).length,8);assert.equal(ex.tables['配方資料'].length,0);
});
test('既有錯誤欄位使初始化中止，不覆寫或清空',()=>{
  const h=start(),s=h.sheets.get('原料資料');s.values[0][0]='錯誤欄位';const before=JSON.stringify(s.values);assert.throws(()=>h.setup());assert.equal(JSON.stringify(s.values),before);
});
test('表內空白列不造成編輯錯列，追加資料自動擴充列數',()=>{
  const h=start(),s=h.sheets.get('原料資料');s.values.splice(1,0,[]);const before=s.values[2][1];
  const wax=ok(h,'bootstrap').materials.find(m=>m.id==='demo-wax');ok(h,'saveMaterial',{...wax,name:'新蜂蠟'});assert.equal(s.values[2][1],before);assert.equal(s.values[4][1],'新蜂蠟');
  s.maxRows=s.values.length;ok(h,'saveMaterial',{id:'extra',revision:0,name:'新原料',category:'其他',active:true,note:''});assert.equal(s.maxRows,s.values.length);
});
