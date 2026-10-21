const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHarness}=require('../tools/gas-mock.cjs');
// 開啟網頁時，管理者自動套用內建官網價格快照；非管理者（家庭成員）不動作。
for(const admin of [true,false])test(`自動套用內建官網價格：${admin?'管理者會套用':'非管理者不動作'}`,async()=>{
  const h=createHarness();h.setup();
  if(!admin)h.state.active=h.state.effective='other@example.test';
  const catalogCtx=vm.createContext({Intl,Date,Map});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/Catalog.html'),'utf8').replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,''),catalogCtx);
  const nodes=new Map();
  function node(id){if(!nodes.has(id))nodes.set(id,{dataset:{},value:'',textContent:'',hidden:false,disabled:false,isConnected:true,innerHTML:'',open:false,addEventListener(event,handler){this[event+'Handler']=handler;},append(child){child.parentId=id;},insertBefore(child){child.parentId=id;},setAttribute(k,v){this[k]=v;},scrollIntoView(){},focus(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(id);}
  const storage=new Map(),calls=[];
  const runner={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},api(r){calls.push(r.action);setImmediate(()=>this.success(h.call(r.action,r.data)));}};
  const desktop={matches:false,addEventListener(){}};
  const ctx=vm.createContext({Intl,Date,JSON,setTimeout:()=>0,clearTimeout:()=>{},crypto:require('node:crypto'),confirm:()=>true,
    document:{getElementById:node,querySelectorAll:()=>[]},
    localStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),getItem:k=>storage.get(k)},
    google:{script:{run:runner}},AromaCore:h.loadCore(),AromaCatalog:catalogCtx.AromaCatalog});
  ctx.window=ctx;ctx.innerWidth=390;ctx.matchMedia=()=>desktop;ctx.addEventListener=()=>{};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/Client.html'),'utf8').replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,''),ctx);
  const tick=()=>new Promise(resolve=>setImmediate(resolve));for(let i=0;i<20;i++)await tick();
  const yl=h.call('bootstrap').value.materials.filter(m=>String(m.id).startsWith('yl-')).length;
  if(admin){assert.ok(yl>90,'管理者開網頁後應自動載入內建官網價格');assert.ok(calls.includes('catalogStatus')&&calls.includes('importCatalog'));
    const before=calls.filter(a=>a==='importCatalog').length;for(let i=0;i<10;i++)await tick();assert.equal(calls.filter(a=>a==='importCatalog').length,before,'只自動套用一次');}
  else{assert.equal(yl,0,'非管理者不可自動匯入');assert.ok(!calls.includes('importCatalog'));}
});
