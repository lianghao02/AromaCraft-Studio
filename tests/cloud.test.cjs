const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const protocol=require('../tools/cloud-protocol.js');const {build}=require('../tools/build-standalone.cjs');
function mock(){const docs=new Map(),listeners=new Set();let tail=Promise.resolve(),fail=false;const snap=p=>({exists:()=>docs.has(p),data:()=>structuredClone(docs.get(p))});const sdk={doc:(db,...parts)=>parts.join('/'),getDoc:async p=>snap(p),serverTimestamp:()=>123,onSnapshot:(p,next,error)=>{const l={p,next,error};listeners.add(l);return()=>listeners.delete(l);},runTransaction:(db,fn)=>{const run=tail.then(async()=>{if(fail){const e=Error('拒絕寫入');e.code='permission-denied';throw e;}const writes=[];await fn({get:async p=>snap(p),set:(p,d)=>writes.push([p,structuredClone(d)])});for(const [p,d]of writes){docs.set(p,d);for(const l of listeners)if(l.p===p)l.next(snap(p));}});tail=run.catch(()=>{});return run;}};return {sdk,docs,listeners,set fail(v){fail=v;},get fail(){return fail;}};}
const tables={test:[['id','quantity'],['x',10]]};
test('雲端二維表格轉 JSON，驗證無效與超量資料，保留原值',()=>{const json=protocol.encode(tables,['test']);assert.equal(typeof json,'string');assert.deepEqual(protocol.decode({schemaVersion:2,tablesJson:json},['test']),tables);assert.deepEqual(protocol.decode({tables},['test']),tables);assert.throws(()=>protocol.decode({schemaVersion:2,tablesJson:'{}'},['test']));assert.throws(()=>protocol.encode({test:[['id'],['x'.repeat(900001)]]},['test']),/大小/);assert.equal(tables.test[1][1],10);});
test('兩台裝置版本交易防覆蓋、不可變快照及即時監聽',async()=>{const m=mock(),a=protocol.create({sdk:m.sdk,db:{},family:'home_sharing',uid:'a',keys:['test']}),b=protocol.create({sdk:m.sdk,db:{},family:'home_sharing',uid:'b',keys:['test']});assert.equal((await a.read()).revision,0);const updates=[];const stop=b.listen(v=>updates.push(v),e=>{throw e;});const results=await Promise.allSettled([a.write(tables,0,'r1_a'),b.write({test:[['id'],['b']]},0,'r1_b')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'sync/conflict');await new Promise(setImmediate);assert.equal(updates[0].revision,1);assert.equal(m.docs.has('families/home_sharing/backup/r1_b'),false);const frozen=structuredClone(m.docs.get('families/home_sharing/backup/r1_a'));await a.write(tables,1,'r2_a');assert.deepEqual(m.docs.get('families/home_sharing/backup/r1_a'),frozen);assert.equal((await b.read()).revision,2);stop();assert.equal(m.listeners.size,0);m.fail=true;await assert.rejects(a.write(tables,2,'r3_a'));assert.equal(m.docs.has('families/home_sharing/backup/r3_a'),false);});
test('實際移轉入口寫入失敗不得顯示成功，bootstrap 不回寫雲端',async()=>{
 const m=mock(),events={},storage=new Map(),alerts=[],nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',className:''});return nodes.get(id);};let authCallback;
 let googleEmail='tpc0941101090@gmail.com',popupError=null,parameters;
 const modules={app:{initializeApp:()=>({})},auth:{getAuth:()=>({}),onAuthStateChanged:(a,fn)=>authCallback=fn,GoogleAuthProvider:class{setCustomParameters(p){parameters=p;}},signInWithPopup:async()=>{if(popupError)throw popupError;const user={uid:'a',email:googleEmail};await authCallback(user);return {user};},signInWithEmailAndPassword:async(a,email)=>{await authCallback({uid:'a',email});},signOut:async()=>authCallback(null)},firestore:{...m.sdk,getFirestore:()=>({})}};
 const provider=[...build().matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const KEY='));
 const code=provider.replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/10.14.1\/firebase-(app|auth|firestore).js'\)/g,(_,name)=>'Promise.resolve(testModules.'+name+')');
 const ctx=vm.createContext({console:{warn(){},error(){}},crypto,TextEncoder,structuredClone,testModules:modules,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>fn(),confirm:()=>true,alert:s=>alerts.push(s),Event:class{constructor(type){this.type=type;}},window:{addEventListener:(name,fn)=>events[name]=fn,dispatchEvent(){}},document:{getElementById:node,querySelector:()=>null}});
 vm.runInContext(code,ctx);events.DOMContentLoaded();await new Promise(setImmediate);
 await ctx.window.AromaSync.loginGoogle();assert.equal(parameters.prompt,'select_account');assert.equal(node('syncStatusText').textContent,'本機待移轉');assert.equal(m.docs.size,0);
 const before=storage.get('aromacraft_standalone_tables_v2');
 popupError=Object.assign(Error('取消'),{code:'auth/popup-closed-by-user'});await node('btnGoogleLogin').onclick();assert.match(node('authLoginStatus').textContent,/已取消登入/);assert.equal(node('btnGoogleLogin').disabled,false);assert.equal(storage.get('aromacraft_standalone_tables_v2'),before);
 popupError=Object.assign(Error('未允許'),{code:'auth/unauthorized-domain'});await node('btnGoogleLogin').onclick();assert.match(node('authLoginStatus').textContent,/此網址尚未允許/);
 popupError=null;googleEmail='outsider@example.test';await assert.rejects(ctx.window.AromaSync.loginGoogle(),/未授權/);assert.equal(m.docs.size,0);assert.equal(storage.get('aromacraft_standalone_tables_v2'),before);
 await ctx.window.AromaSync.login('tpc0941101090@gmail.com','合成測試密碼');m.fail=true;await assert.rejects(ctx.window.AromaSync.migrateToCloud());assert.equal(alerts.some(s=>s.includes('成功')),false);assert.equal(node('syncStatusCapsule').className,'sync-capsule error');assert(storage.has('aromacraft_standalone_tables_v2_pre_firebase_backup'));let response;ctx.window.google.script.run.withSuccessHandler(r=>response=r).api({action:'bootstrap'});assert.equal(response.ok,true);assert.equal(m.docs.size,0);
});

function device(m,storage=new Map()){
 const events={},nodes=new Map();let authCallback,offline=false;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',className:''});return nodes.get(id);};
 const network=fn=>async(...args)=>{if(offline)throw Object.assign(Error('離線'),{code:'unavailable'});return fn(...args);};
 const modules={app:{initializeApp:()=>({})},auth:{getAuth:()=>({}),onAuthStateChanged:(a,fn)=>authCallback=fn,signOut:async()=>authCallback(null),signInWithEmailAndPassword:async(a,email)=>authCallback({uid:'test',email})},firestore:{...m.sdk,getDoc:network(m.sdk.getDoc),runTransaction:network(m.sdk.runTransaction),getFirestore:()=>({})}};
 const provider=[...build().matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const KEY='));
 const code=provider.replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/10.14.1\/firebase-(app|auth|firestore).js'\)/g,(_,n)=>'Promise.resolve(testModules.'+n+')');
 const ctx=vm.createContext({console:{warn(){},error(){}},crypto,TextEncoder,structuredClone,testModules:modules,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>fn(),confirm:()=>true,alert(){},Event:class{constructor(type){this.type=type;}},window:{AromaDraftPending:()=>true,addEventListener:(name,fn)=>events[name]=fn,dispatchEvent(){}},document:{getElementById:node,querySelector:()=>null}});
 vm.runInContext(code,ctx);events.DOMContentLoaded();
 return {storage,node,events,ctx,set offline(v){offline=v;},async login(){await new Promise(setImmediate);await ctx.window.AromaSync.login('tpc0941101090@gmail.com','測試密碼');},api(action,data={}){let out;ctx.window.google.script.run.withSuccessHandler(r=>out=r).withFailureHandler(e=>{throw e;}).api({action,data});assert(out.ok,out.error);return out.value;}};
}
async function settled(){for(let n=0;n<20;n++)await new Promise(setImmediate);}
test('離線操作重啟保留、連線合併不同配方、同配方最後寫入為準且草稿不阻擋同步',async()=>{
 const m=mock(),a=device(m);await a.login();await a.ctx.window.AromaSync.migrateToCloud();const b=device(m);await b.login();
 const r=(id,name)=>({id,version:0,policyVersion:2,name,type:'精油皂',units:1,cost:{packaging:0,minutes:0,hourly:0,other:0,loss:0,margin:0,sale:null},quantityUnit:'mixed',concentration:{auto:true,useDefaultDrops:true},planning:{mode:'free',sizing:'batch',packagingId:''},items:[{materialId:'demo-soap',priceId:'demo-soap-price',quantity:10,unit:'g'}],requestId:id+'-first'});
 a.api('saveRecipe',r('same','初始配方'));await settled();assert.equal(b.api('bootstrap').recipes.length,1);
 a.offline=true;const local=a.api('loadRecipe',{id:'same'});a.api('saveRecipe',{...local,name:'離線最後修改',requestId:'offline-edit',policyVersion:2});await settled();assert.match(a.node('syncStatusText').textContent,/待同步/);
 b.api('saveRecipe',r('other','另一台新增'));const shared=b.api('loadRecipe',{id:'same'});b.api('saveRecipe',{...shared,name:'另一台先儲存',requestId:'b-update',policyVersion:2});await settled();
 const reopened=device(m,a.storage);await reopened.login();await settled();const data=reopened.api('bootstrap');assert.equal(new Set(data.recipes.map(r=>r.id)).size,2);assert.equal(data.recipes.filter(r=>r.id==='same').sort((a,b)=>b.version-a.version)[0].name,'離線最後修改');assert.equal(JSON.parse(a.storage.get('aromacraft_standalone_tables_v2_outbox_v1')).length,0);assert.equal(reopened.node('syncStatusText').textContent,'已同步');
 const count=m.docs.size;reopened.api('bootstrap');await settled();assert.equal(m.docs.size,count);
});
test('離線製作快照不按同步時價格重算，永久刪除保留紀錄且不被舊編輯復活',async()=>{
 const m=mock(),a=device(m);await a.login();await a.ctx.window.AromaSync.migrateToCloud();
 const r=a.api('saveRecipe',{id:'frozen',version:0,policyVersion:2,requestId:'first',name:'實作紀錄',type:'精油皂',units:1,quantityUnit:'mixed',concentration:{auto:true},planning:{mode:'free',sizing:'batch',packagingId:''},cost:{packaging:0,minutes:0,hourly:0,other:0,loss:0,margin:0,sale:null},items:[{materialId:'demo-soap',priceId:'demo-soap-price',quantity:10,unit:'g'}]});await settled();const b=device(m);await b.login();
 a.offline=true;const log=a.api('saveLog',{policyVersion:2,requestId:'offline-log',recipeId:r.id,version:r.version,date:'2026-10-15',units:1,actualRecipe:r});a.api('saveRecipe',{...r,policyVersion:2,name:'舊編輯',requestId:'stale'});await settled();
 b.api('savePrice',{materialId:'demo-soap',requestId:'price-changed',label:'新價',amount:100,unit:'g',paid:500});b.api('deleteRecipe',{id:r.id,requestId:'deleted'});await settled();
 a.offline=false;a.events.online();await settled();const result=a.api('bootstrap');assert.equal(result.recipes.length,0);assert.equal(result.logs.length,1);assert.deepEqual(JSON.parse(JSON.stringify(result.logs[0].snapshot)),JSON.parse(JSON.stringify(log.snapshot)));assert.equal(result.logs[0].snapshot.material,0);assert.equal(JSON.parse(a.storage.get('aromacraft_standalone_tables_v2_outbox_v1')).length,0);
});

test('瓶數庫存：離線持久化、兩裝置同步與備份包含庫存，不新增價格',async()=>{
 const m=mock(),a=device(m);await a.login();await a.ctx.window.AromaSync.migrateToCloud();const b=device(m);await b.login();
 const id='yl-360276',prices=a.api('bootstrap').prices.length;
 a.api('saveInventory',{requestId:'stock-initial',items:[{materialId:id,count:2,revision:0}]});await settled();assert.equal(b.api('bootstrap').inventory[id].count,2);
 a.offline=true;a.api('saveInventory',{requestId:'stock-offline',items:[{materialId:id,count:1,revision:1}]});await settled();
 const reopened=device(m,a.storage);await reopened.login();await settled();assert.equal(reopened.api('bootstrap').inventory[id].count,1);assert.equal(b.api('bootstrap').inventory[id].count,1);assert.equal(reopened.api('bootstrap').prices.length,prices);
 const exported=reopened.api('export');assert(exported.tables['系統設定'].some(r=>r.key==='庫存:'+id));assert.equal(JSON.parse(a.storage.get('aromacraft_standalone_tables_v2_outbox_v1')).length,0);
});
test('庫存同項目離線衝突：保留待同步操作，不覆蓋另一台瓶數；不同項目可合併',async()=>{
 const m=mock(),a=device(m);await a.login();await a.ctx.window.AromaSync.migrateToCloud();const b=device(m);await b.login();
 a.offline=true;a.api('saveInventory',{requestId:'offline-stock',items:[{materialId:'yl-360276',count:2,revision:0}]});await settled();
 b.api('saveInventory',{requestId:'other-stock',items:[{materialId:'yl-353876',count:1,revision:0}]});await settled();a.offline=false;a.events.online();await settled();assert.equal(b.api('bootstrap').inventory['yl-360276'].count,2);assert.equal(a.api('bootstrap').inventory['yl-353876'].count,1);
 a.offline=true;a.api('saveInventory',{requestId:'stale-stock',items:[{materialId:'yl-360276',count:1,revision:1}]});await settled();
 b.api('saveInventory',{requestId:'new-stock',items:[{materialId:'yl-360276',count:3,revision:1}]});await settled();a.offline=false;a.events.online();await settled();
 assert.equal(b.api('bootstrap').inventory['yl-360276'].count,3);assert.equal(a.api('bootstrap').inventory['yl-360276'].count,1);assert.equal(JSON.parse(a.storage.get('aromacraft_standalone_tables_v2_outbox_v1')).length,1);assert.match(a.node('syncStatusText').textContent,/失敗|同步|衝突|庫存|修改/);
});

test('離線新增未定價精油與庫存能一起同步，不會產生猜測價格',async()=>{
 const m=mock(),a=device(m);await a.login();await a.ctx.window.AromaSync.migrateToCloud();const b=device(m);await b.login();const priceCount=b.api('bootstrap').prices.length;
 a.offline=true;a.api('saveMaterial',{id:'inventory-offline-new',name:'合成未定價原料',category:'精油',revision:0,active:true,note:'容量與價格待補'});a.api('saveInventory',{requestId:'new-material-stock',items:[{materialId:'inventory-offline-new',count:1,revision:0,oilType:'單方',storageGroup:'測試收納區',note:''}]});await settled();a.offline=false;a.events.online();await settled();
 const data=b.api('bootstrap');assert.equal(data.inventory['inventory-offline-new'].count,1);assert.equal(data.inventory['inventory-offline-new'].oilType,'單方');assert(data.materials.some(r=>r.id==='inventory-offline-new'));assert.equal(data.prices.length,priceCount);
});
