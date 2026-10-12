/* DOM 替身驗證主要互動；不能代替 Safari 或瀏覽器版面驗收。 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHarness}=require('../tools/gas-mock.cjs');
test('收納操作保留草稿；空白與未修改配方避免誤存；失敗保留並可重試',async()=>{
  const h=createHarness();h.setup();
  const nodes=new Map();
  function node(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',hidden:false,disabled:false,isConnected:true,innerHTML:'',open:false,setAttribute(k,v){this[k]=v;},scrollIntoView(){},focus(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(id);}
  const works=['融製精油皂','無水精油膏'].map(type=>({...node(type),dataset:{type}}));
  const storage=new Map();
  const runner={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},api(r){setImmediate(()=>this.success(h.call(r.action,r.data)));}};
  const ctx=vm.createContext({Intl,Date,JSON,crypto:require('node:crypto'),confirm:()=>true,
    document:{getElementById:node,querySelectorAll:s=>s==='.work'?works:s==='button,input,select,textarea'?[...nodes.values()]:[]},
    localStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),getItem:k=>storage.get(k)},
    google:{script:{run:runner}},AromaCore:h.loadCore()});
  ctx.window=ctx;ctx.addEventListener=()=>{};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/Client.html'),'utf8').replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,''),ctx);
  const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();await tick();
  assert.equal(node('quickSave').disabled,true);
  assert.equal(works[0]['aria-pressed'],'false');
  await works[0].onclick();
  assert.doesNotMatch(node('oilPercentBadge').className, /safe/);
  assert.match(node('oilPercentBadge').title, /安全來源/);
  assert.equal(node('workPanel').open,false);
  assert.equal(node('quickSave').disabled,false);
  node('name').value='收納流程驗證';
  for(const k of ['packaging','minutes','hourly','other','loss','margin'])node('cost-'+k).value='0';
  node('name').oninput();
  node('addMaterials').onclick();
  assert.equal(node('materialPicker').open,true);
  assert.equal(node('name').value,'收納流程驗證');
  const saving=node('quickSave').onclick();
  assert.equal(node('quickSave').disabled,true);
  assert.equal(node('quickSave').textContent,'處理中…');
  await saving;
  assert.equal(node('quickSave').disabled,true);
  assert.equal(node('draftState').textContent,'已儲存 · v1');
  node('name').value='修改後的配方';node('name').oninput();
  h.state.failWrite='配方資料';await node('quickSave').onclick();
  assert.equal(node('quickSave').disabled,false);
  assert.equal(node('name').value,'修改後的配方');
  assert.equal(storage.size,1);
  await node('quickSave').onclick();
  assert.equal(h.sheets.get('配方資料').values.length,3);
  assert.equal(node('draftState').textContent,'已儲存 · v2');
  assert.equal(node('savedCount').textContent,'1 份配方');
  assert.match(node('saved').innerHTML,/歷史版本（1）/);
  assert.match(node('saved').innerHTML,/data-version="1"/);
  await node('saved').onclick({target:{closest:()=>({dataset:{load:h.sheets.get('配方資料').values[1][0],version:'1'}})}});
  await tick();await tick();
  assert.equal(node('name').value,'收納流程驗證');
  assert.equal(node('quickSave').disabled,true);
  node('copy').onclick();
  assert.equal(node('quickSave').disabled,false);
  assert.match(node('name').value,/（複製）/);
  const before=node('name').value;
  const cancelSwitch=works[1].onclick();
  assert.equal(node('confirmDialog').open,true);
  assert.match(node('confirmMessage').textContent,/無水精油膏/);
  node('confirmKeep').onclick();await cancelSwitch;
  assert.equal(node('name').value,before);
  const confirmSwitch=works[1].onclick();node('confirmProceed').onclick();await confirmSwitch;
  assert.equal(node('name').value,'無水精油膏新配方');
  assert.match(node('costFields').innerHTML,/NT\$／件/);
  assert.match(node('breakdown').innerHTML,/零元採購批次/);
});
