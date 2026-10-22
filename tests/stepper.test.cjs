/* 三步驟進度（redesign-v2）：面板開合是唯一狀態來源，進度列與步驟顯示由它推導。
   DOM 替身不能代替瀏覽器版面驗收；版面另以 Chromium 三種寬度截圖逐張核對。 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHarness}=require('../tools/gas-mock.cjs');
const src=path.join(__dirname,'..','src');
const index=fs.readFileSync(path.join(src,'Index.html'),'utf8'),styles=fs.readFileSync(path.join(src,'Styles.html'),'utf8');

async function boot(){
  const h=createHarness();h.setup();h.call('importCatalog');
  const catalogCtx=vm.createContext({Intl,Date,Map});
  vm.runInContext(fs.readFileSync(path.join(src,'Catalog.html'),'utf8').replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,''),catalogCtx);
  const nodes=new Map();
  function node(id){if(!nodes.has(id))nodes.set(id,{dataset:{},value:'',textContent:'',hidden:false,disabled:false,isConnected:true,innerHTML:'',open:false,addEventListener(event,handler){this[event+'Handler']=handler;},append(child){child.parentId=id;},insertBefore(child){child.parentId=id;},setAttribute(k,v){this[k]=v;},scrollIntoView(){},focus(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(id);}
  const works=['精油皂','精油膏'].map(type=>({...node(type),dataset:{type}}));
  const runner={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},api(r){setImmediate(()=>this.success(h.call(r.action,r.data)));}};
  const ctx=vm.createContext({Intl,Date,JSON,setTimeout:()=>0,clearTimeout:()=>{},crypto:require('node:crypto'),confirm:()=>true,
    document:{getElementById:node,querySelectorAll:s=>s==='.work'?works:s==='button,input,select,textarea'?[...nodes.values()]:[]},
    localStorage:{setItem(){},removeItem(){},getItem(){}},google:{script:{run:runner}},AromaCore:h.loadCore(),AromaCatalog:catalogCtx.AromaCatalog});
  const desktop={matches:true,addEventListener(){}};
  ctx.window=ctx;ctx.innerWidth=390;ctx.matchMedia=()=>desktop;ctx.addEventListener=()=>{};
  vm.runInContext(fs.readFileSync(path.join(src,'Client.html'),'utf8').replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,''),ctx);
  const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();await tick();
  return {node,tick,works,h};
}

test('進度列：新配方在步驟 1，步驟 3 不可點；選類別直接進入步驟 2',async()=>{
  const {node,tick,works}=await boot();
  assert.equal(node('viewRecipe').dataset.step,'1');
  assert.equal(node('stepBtn1').dataset.state,'active');assert.equal(node('stepBtn3').disabled,true);
  await works[1].onclick();await tick();await tick();
  assert.equal(node('workPanel').open,false);assert.equal(node('materialPicker').open,true);
  assert.equal(node('viewRecipe').dataset.step,'2');
  assert.equal(node('stepBtn1').dataset.state,'done');assert.equal(node('stepBtn2').dataset.state,'active');
  assert.equal(node('stepTitle').textContent,'加入原料與用量');
});

test('進度列：有待填用量時步驟 3 鎖定，填完後才能進入',async()=>{
  const {node,tick,works}=await boot();
  await works[1].onclick();await tick();await tick();
  const choose=id=>node('materials').onclick({target:{closest:q=>q==='[data-add]'?{dataset:{add:id}}:null}});
  choose('demo-soap');choose('demo-oil');
  assert.equal(node('stepBtn3').disabled,true,'還有用量沒填，不能進步驟 3');
  assert.match(node('selectionStatus').textContent,/已選 2 項 · 待填 2 項/);
  for(const id of ['demo-soap','demo-oil']){node('quantity-'+id).value='5';node('selectedItems').oninput({target:{closest:q=>q==='[data-quantity]'?{dataset:{quantity:id},value:'5'}:null}});}
  assert.equal(node('stepBtn3').disabled,false);
  assert.match(node('selectionStatus').textContent,/^已選 2 項$/);
  node('confirmQuantities').onclick();
  assert.equal(node('recipePanel').open,true);assert.equal(node('materialPicker').open,false);
  assert.equal(node('viewRecipe').dataset.step,'3');assert.equal(node('stepTitle').textContent,'確認並儲存');
});

test('進度列：點步驟只留一個面板開著，回步驟 1／2 保留已選原料',async()=>{
  const {node,tick,works}=await boot();
  await works[1].onclick();await tick();await tick();
  const choose=id=>node('materials').onclick({target:{closest:q=>q==='[data-add]'?{dataset:{add:id}}:null}});
  choose('demo-soap');choose('demo-oil');
  for(const id of ['demo-soap','demo-oil'])node('selectedItems').oninput({target:{closest:q=>q==='[data-quantity]'?{dataset:{quantity:id},value:'5'}:null}});
  node('confirmQuantities').onclick();
  node('stepBtn1').onclick();node('workPanel').toggleHandler&&node('workPanel').toggleHandler();
  assert.equal(node('workPanel').open,true);assert.equal(node('recipePanel').open,false);assert.equal(node('materialPicker').open,false);
  assert.equal(node('viewRecipe').dataset.step,'1');
  node('stepBtn2').onclick();
  assert.equal(node('materialPicker').open,true);assert.equal(node('workPanel').open,false);
  assert.match(node('selectedItems').innerHTML,/data-quantity="demo-soap"/);assert.match(node('items').innerHTML,/5 g/);assert.match(node('items').innerHTML,/5 mL/,'回到步驟 2 後，已填用量仍在配方內');
});

test('步驟 2 一律同列填用量：沒有集中填量按鈕，下一步在底部摘要列內',()=>{
  assert.doesNotMatch(index,/id="fillQuantities"|id="quantityStage"/);
  const bar=index.match(/<div id="stepBar"[\s\S]*?<\/div>\s*<\/div>/)[0];
  for(const id of ['confirmQuantities','selectionStatus','liveConcentration'])assert.match(bar,new RegExp('id="'+id+'"'),'底部摘要列需含 #'+id);
  assert.match(index,/<div id="pickSide"[\s\S]*id="selectedItems"[\s\S]*id="stepBar"[\s\S]*<div id="materialBrowse"/,'已選區與摘要列在原料列表之前');
});

test('步驟 3：成本與濃度在上、儲存可見；開始製作只在製作中出現；重新開始只留一處',()=>{
  const panel=index.slice(index.indexOf('id="recipePanel"'),index.indexOf('id="viewSaved"'));
  assert.ok(panel.indexOf('id="costPanel"')<panel.indexOf('id="name"'),'成本應在基本資料之前');
  assert.match(panel,/<details id="productionFold"[^>]*\bhidden\b/,'實際製作區預設隱藏，製作中才顯示');
  assert.equal((index.match(/id="blank"/g)||[]).length,1);assert.doesNotMatch(index,/btnResetRecipe/);
  assert.match(panel,/id="moreSettings"[\s\S]*id="recipeTypeSelect"[\s\S]*id="sizingMode"/,'類型與用量基準收進更多設定');
});

test('版面規則：每個步驟只顯示自己的面板；桌機步驟 2、3 為兩欄；v2 樣式字級不低於 12px',()=>{
  for(const n of ['1','2','3'])assert.match(styles,new RegExp('#viewRecipe\\.stepflow\\[data-step="'+n+'"\\]>#'),'缺少步驟 '+n+' 的隱藏規則');
  assert.match(styles,/@media\(min-width:1024px\)\{[\s\S]*?#pickSide\{display:flex[\s\S]*?position:sticky/,'桌機步驟 2 右欄固定');
  assert.match(styles,/#recipePanel \.confirm-grid\{display:grid;grid-template-columns:minmax\(0,1fr\) 380px/,'桌機步驟 3 兩欄');
  const v2=styles.slice(styles.indexOf('/* === v2 三步驟版面'));
  const small=[...v2.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)].map(m=>Number(m[1])).filter(n=>n<12);
  assert.deepEqual(small,[],'v2 樣式不得出現小於 12px 的字級');
  assert.match(styles,/\.stepper-btn\{[^}]*min-height:4[48]px/,'進度按鈕點擊區至少 44px');
});

async function targetSetup(count){
  const {node,tick,works,h}=await boot();
  await works[1].onclick();await tick();await tick();
  const bs=h.call('bootstrap').value;
  const oilIds=bs.materials.filter(m=>m.category==='精油'&&bs.prices.some(p=>p.materialId===m.id&&p.unit==='mL')).slice(0,count).map(m=>m.id);
  assert.equal(oilIds.length,count,'內建目錄需至少有 '+count+' 種以 mL 採購的精油');
  const choose=id=>node('materials').onclick({target:{closest:q=>q==='[data-add]'?{dataset:{add:id}}:null}});
  oilIds.forEach(choose);choose('demo-oil');
  node('planningMode').value='target';node('planningBasis').value='mL';node('planningTotal').value='100';node('planningPercent').value='1';node('planningBase').value='demo-oil';node('planningMode').onchange();
  return {node,oilIds};
}

test('精油平均分配：10 種精油、1% × 100 mL ＝ 20 滴，每種 2 滴，基底補足 99 mL',async()=>{
  const {node,oilIds}=await targetSetup(10);
  assert.ok(node('evenOils'),'規劃區需有「精油平均分配」按鈕');
  node('evenOils').onclick();
  const items=node('items').innerHTML;
  assert.equal((items.match(/<span>2 滴 ·/g)||[]).length,10,'10 種精油各 2 滴');
  assert.match(items,/99 mL/);
  assert.match(node('targetProgress').textContent,/已分配 20／約 20 滴/);
  assert.match(node('concentrationValue').textContent,/1\.00%/);
  assert.equal(node('stepBtn3').disabled,false,'平均分配後沒有待填用量');
  void oilIds;
});

test('精油平均分配：不能整除時餘數由前面幾種各多 1 滴，總滴數仍等於目標',async()=>{
  const {node}=await targetSetup(3);
  node('evenOils').onclick();
  const drops=[...node('items').innerHTML.matchAll(/<span>(\d+) 滴 ·/g)].map(m=>Number(m[1]));
  assert.deepEqual(drops,[7,7,6]);
  assert.equal(drops.reduce((a,b)=>a+b,0),20);
  assert.match(node('targetProgress').textContent,/已分配 20／約 20 滴/);
});
