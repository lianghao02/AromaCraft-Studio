/* 瀏覽器儲存介面：支援本機離線與 Firebase 家庭雲端雙軌同步，共用既有後端規則。 */
(() => {
 'use strict';
__AROMA_CLOUD_PROTOCOL__
 const KEY='aromacraft_standalone_tables_v2',OLD='aromacraft_standalone_db_v1';
 const seed=__AROMA_SEED__,sources=__AROMA_SOURCES__;
 let values;const raw=localStorage.getItem(KEY);
 if(raw){try{values=JSON.parse(raw);if(!values||typeof values!=='object'||Object.keys(seed).some(n=>!Array.isArray(values[n])))throw Error('格式異常');}catch(e){localStorage.setItem(KEY+'_unreadable_backup',raw);throw Error('本機資料格式不正確，原始內容已保留，請先匯出或復原備份。');}}
 else{values=JSON.parse(JSON.stringify(seed));const legacy=localStorage.getItem(OLD);if(legacy){
   try{
     const old=JSON.parse(legacy);if(Array.isArray(old.materials)&&Array.isArray(old.prices)){
       const rows=(name,list)=>{const keys=values[name][0];values[name]=[keys,...list.map(o=>keys.map(k=>o[k]??''))];};
       rows('原料資料',old.materials);rows('原料價格',old.prices);
       rows('配方資料',(old.recipes||[]).map(r=>({...r,costJson:JSON.stringify(r.cost),snapshotJson:JSON.stringify(r.snapshot),quantityUnit:r.quantityUnit||'g',concentrationJson:r.concentration?JSON.stringify(r.concentration):''})));
       rows('配方明細',old.recipeDetails||[]);rows('製作紀錄',(old.logs||[]).map(l=>({...l,snapshotJson:JSON.stringify(l.snapshot)})));
       rows('安全規則',(old.rules||[]).map(r=>({...r,status:'待核對'})));
       if(old.cost)rows('成本設定',[{id:old.costRevision||'legacy-cost',valueJson:JSON.stringify(old.cost)}]);
     }
   }catch(e){}
 }}
 class Sheet{
  constructor(name){this.name=name;this.values=values[name]||[];this.maxRows=Math.max(1000,this.values.length);}
  getLastRow(){return this.values.length;}getMaxRows(){return this.maxRows;}insertRowsAfter(row,n){this.maxRows+=n;}
  getRange(row,col,n=1,m=1){const s=this;return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.values[row+i-1]?.[col+j-1]??'')),setValues(rows){for(let i=0;i<n;i++){s.values[row+i-1]||=[];for(let j=0;j<m;j++){const v=rows[i][j];s.values[row+i-1][col+j-1]=typeof v==='string'&&v.startsWith("'")?v.slice(1):v;}}return this;},setFontWeight(){return this;},setBackground(){return this;}};}
  setFrozenRows(){}deleteRow(row){this.values.splice(row-1,1);}
 }
 const sheets=new Map(Object.keys(values).map(n=>[n,new Sheet(n)]));
 const db={getSheetByName:n=>sheets.get(n),insertSheet(n){const s=new Sheet(n);sheets.set(n,s);return s;},setSpreadsheetTimeZone(){}};
 const props={SPREADSHEET_ID:'local-device',ADMIN_EMAIL:'tpc0941101090@gmail.com',ALLOWED_EMAILS:'tpc0941101090@gmail.com,amethyst72@gmail.com'};
 const environment={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},Session:{getActiveUser:()=>({getEmail:()=>props.ADMIN_EMAIL}),getEffectiveUser:()=>({getEmail:()=>props.ADMIN_EMAIL})},SpreadsheetApp:{openById:()=>db,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{getUuid:()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2),formatDate:()=>new Date().toISOString()},HtmlService:{createHtmlOutputFromFile:n=>({getContent:()=>sources[n]})}};
 const call=(function({PropertiesService,Session,SpreadsheetApp,LockService,Utilities,HtmlService}){
__AROMA_SERVER__
 return api;
 })(environment);
 const persist=()=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries([...sheets].map(([n,s])=>[n,s.values]))));
 const upgrade=call({action:'migrateUnits'});if(!upgrade.ok)throw Error(upgrade.error);
 const imported=call({action:'importCatalog'});if(!imported.ok)throw Error(imported.error);persist();
 window.AROMA_DEMO=true;window.AROMA_LOCAL=true;

 /* === Firebase 雲端整合配置與白名單 === */
 const firebaseConfig = {
   apiKey: "AIzaSyCPc4wZAD22N2MLuDyJjgERKdwqvlUJsrE",
   authDomain: "aromacraft-studio.firebaseapp.com",
   projectId: "aromacraft-studio",
   storageBucket: "aromacraft-studio.firebasestorage.app",
   messagingSenderId: "1064983353321",
   appId: "1:1064983353321:web:e22c0fed594a8b60fd9d78",
   measurementId: "G-YVBW5X67WW"
 };
 const ALLOWED_EMAILS = ['tpc0941101090@gmail.com', 'amethyst72@gmail.com'];
 const FAMILY_DOC = 'home_sharing';
 let fbAuth = null, fbDb = null, currentFbUser = null, fbModules = null;
 const OUTBOX=KEY+'_outbox_v1';let outbox=JSON.parse(localStorage.getItem(OUTBOX)||'[]');if(!Array.isArray(outbox))throw Error('待同步資料格式異常，請先匯出備份');let flushing=null;
 const PENDING=KEY+'_pending_cloud';let cloud=null,cloudRevision=0,cloudConflict=false,stopCloud=null,ownSnapshotId=null,writeCount=0,writeQueue=Promise.resolve();
 if(raw&&localStorage.getItem(PENDING)===null&&(values['配方資料']?.length>1||values['製作紀錄']?.length>1))localStorage.setItem(PENDING,'true');
 const tables=()=>Object.fromEntries([...sheets].map(([n,s])=>[n,s.values]));
 const hasPending=()=>localStorage.getItem(PENDING)==='true'||writeCount>0||outbox.length>0;
 function applyRemote(remote,force=false){
   if(outbox.length&&!force){pushToFirestore().catch(()=>{});return;}
   if(!remote.tables){cloudRevision=remote.revision;updateSyncStatus('offline','本機待移轉');return;}
   if(!force&&remote.snapshotId===ownSnapshotId)return;
   if(hasPending()&&!force&&JSON.stringify(remote.tables)!==JSON.stringify(tables())){cloudConflict=true;updateSyncStatus('error','有未同步修改，請先備份');return;}
   localStorage.setItem(KEY+'_before_cloud_pull',JSON.stringify(tables()));
   for(const [n,rows] of Object.entries(remote.tables))if(sheets.has(n))sheets.get(n).values=rows;
   const upgraded=call({action:'migrateUnits'});if(!upgraded.ok)throw Error(upgraded.error);persist();cloudRevision=remote.revision;cloudConflict=false;localStorage.setItem(PENDING,'false');updateSyncStatus('synced','已同步');window.dispatchEvent?.(new Event('aroma-cloud-update'));
 }
 function cloudError(e){if(e.code==='sync/conflict')cloudConflict=true;localStorage.setItem(PENDING,'true');updateSyncStatus(e.code==='permission-denied'?'error':'offline',e.code==='permission-denied'?'同步權限不足':'待同步');}


 function updateSyncStatus(status, text){
   if(typeof document === 'undefined') return;
   const capsule = document.getElementById('syncStatusCapsule');
   const statusText = document.getElementById('syncStatusText');
   if(capsule && statusText){
     capsule.className = 'sync-capsule ' + status;
     statusText.textContent = text;
   }
   const stamp=document.getElementById('syncLastSuccess');
   if(stamp){if(status==='synced')stamp.textContent='本裝置最後成功同步：'+new Intl.DateTimeFormat('zh-TW',{dateStyle:'short',timeStyle:'medium'}).format(new Date());else if(status==='offline')stamp.textContent='目前僅保存在此裝置，登入後才會與家庭雲端同步。';}
   const conn = document.getElementById('connection');
   if(conn){
     if(status==='synced') conn.textContent = '已連接 Firebase 家庭雲端：資料與太太即時共用中。';
     else if(status==='syncing') conn.textContent = '正在同步家庭雲端資料…';
     else if(status==='error') conn.textContent = '雲端同步發生問題：' + text + '；本機已保存。';
     else conn.textContent = '本機離線保存模式：登入 Firebase 即可啟用家庭跨裝置同步。';
   }
 }

 async function initFirebase(){
   if(typeof window === 'undefined' || typeof document === 'undefined') return;
   try{
     const [appMod, authMod, fsMod] = await Promise.all([
       import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
       import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
       import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
     ]);
     const app = appMod.initializeApp(firebaseConfig);
     fbAuth = authMod.getAuth(app);
     fbDb = fsMod.getFirestore(app);
     fbModules = { appMod, authMod, fsMod };

     authMod.onAuthStateChanged(fbAuth, async user => {
       if(stopCloud){stopCloud();stopCloud=null;}cloud=null;cloudConflict=false;currentFbUser = user;
       const userBadge = document.getElementById('userBadge');
       const authSignedOut = document.getElementById('authSignedOut');
       const authSignedIn = document.getElementById('authSignedIn');
       const authUserEmail = document.getElementById('authUserEmail');

       if(user && user.email){
         const email = user.email.toLowerCase();
         if(!ALLOWED_EMAILS.includes(email)){
           await authMod.signOut(fbAuth);
           alert('此 Google/Firebase 帳號（' + email + '）不在家庭成員白名單中，已自動登出。');
           updateSyncStatus('offline', '非授權');
           return;
         }
         if(userBadge){
           userBadge.textContent = '🏠 ' + email.split('@')[0];
           userBadge.hidden = window.innerWidth < 600;
         }
         if(authSignedOut) authSignedOut.hidden = true;
         if(authSignedIn) authSignedIn.hidden = false;
         if(authUserEmail) authUserEmail.textContent = email;
         updateSyncStatus('syncing', '同步中');
         cloud=AromaCloudProtocol.create({sdk:fsMod,db:fbDb,family:FAMILY_DOC,uid:user.uid,keys:Object.keys(seed)});
         try{await pullFromFirestore();}catch(e){cloudError(e);}stopCloud=cloud.listen(remote=>{try{if(remote.revision!==cloudRevision||remote.snapshotId===null)applyRemote(remote);}catch(e){cloudError(e);}},cloudError);
       } else {
         if(userBadge) userBadge.hidden = true;
         if(authSignedOut) authSignedOut.hidden = false;
         if(authSignedIn) authSignedIn.hidden = true;
         updateSyncStatus('offline', '本機');
       }
     });
   }catch(e){
     console.warn('Firebase 離線或無法載入 SDK，持續使用本機 LocalStorage 保存。', e);
     updateSyncStatus('offline', '本機離線');
   }
 }

 async function pullFromFirestore(force=false){if(!cloud||!currentFbUser)throw Error('請先登入家庭雲端');const remote=await cloud.read();applyRemote(remote,force);if(cloudConflict)throw Error('本機有未同步修改，已保留原資料，請先匯出備份');return Boolean(remote.tables);}
 function installTables(value){for(const [name,rows]of Object.entries(value))if(sheets.has(name))sheets.get(name).values=JSON.parse(JSON.stringify(rows));}
 function replay(base,ops){
  const original=JSON.parse(JSON.stringify(tables()));
  try{
   installTables(base);const upgrade=call({action:'migrateUnits'});if(!upgrade.ok)throw Error(upgrade.error);
   for(const op of ops){
    if(op.action==='saveLog'){
     const name='製作紀錄',keys=sheets.get(name).values[0];
     if(!sheets.get(name).values.slice(1).some(row=>row[keys.indexOf('requestId')]===op.data.requestId))sheets.get(name).values.push(keys.map(k=>k==='snapshotJson'?JSON.stringify(op.result.snapshot):op.result[k]??''));
     continue;
    }
    const data={...op.data};
    if(op.action==='saveRecipe')data.policyVersion=2;
    if(['saveMaterial','saveProduct'].includes(op.action)){const b=call({action:'bootstrap'});data.revision=b.value.materials.find(m=>m.id===data.id)?.revision||0;}
    if(op.action==='saveCost')data.revision=call({action:'bootstrap'}).value.costRevision;
    const result=call({action:op.action,data});
    // 另一台已永久刪除時，不讓較舊的離線編輯復活配方。
    if(!result.ok&&op.action==='saveRecipe'&&result.error.includes('永久移除'))continue;
    if(!result.ok)throw Error(result.error);
   }
   return JSON.parse(JSON.stringify(tables()));
  }finally{installTables(original);}
 }
 function pushToFirestore(){
  if(!cloud||!currentFbUser)return Promise.reject(Error('請先登入家庭雲端'));
  if(flushing)return flushing;
  flushing=(async()=>{
   let attempts=0;
   do{
    const remote=await cloud.read(),ops=outbox.slice();
    if(!ops.length&&cloudConflict){const e=Error('舊版本機資料尚未移轉，請先備份並確認移轉');e.code='sync/conflict';throw e;}
    const payload=ops.length?replay(remote.tables||JSON.parse(JSON.stringify(seed)),ops):JSON.parse(JSON.stringify(tables()));
    updateSyncStatus('syncing','同步中');ownSnapshotId='r'+(remote.revision+1)+'_'+crypto.randomUUID();
    try{
     const result=await cloud.write(payload,remote.revision,ownSnapshotId);cloudRevision=result.revision;cloudConflict=false;
     const sent=new Set(ops.map(op=>op.key));outbox=outbox.filter(op=>!sent.has(op.key));localStorage.setItem(OUTBOX,JSON.stringify(outbox));
     const merged=outbox.length?replay(payload,outbox):payload;installTables(merged);persist();
     localStorage.setItem(PENDING,outbox.length?'true':'false');updateSyncStatus(outbox.length?'syncing':'synced',outbox.length?'待同步':'已同步');window.dispatchEvent?.(new Event('aroma-cloud-update'));
     attempts=0;
    }catch(e){if(e.code==='sync/conflict'&&++attempts<5)continue;throw e;}
   }while(outbox.length);
  })().catch(e=>{cloudError(e);throw e;}).finally(()=>{flushing=null;});return flushing;
 }

 window.AromaSync = {
   loginGoogle: async () => {
     if(!fbAuth || !fbModules) throw Error('Google 登入尚未準備完成，請稍後重試並確認網路連線。');
     const provider = new fbModules.authMod.GoogleAuthProvider();
     provider.setCustomParameters({prompt:'select_account'});
     const result = await fbModules.authMod.signInWithPopup(fbAuth, provider);
     if(!ALLOWED_EMAILS.includes((result.user?.email||'').toLowerCase())){
       await fbModules.authMod.signOut(fbAuth);
       throw Error('此 Google 帳號未授權使用家庭資料，請改選家庭帳號。');
     }
     return result;
   },
   login: async (email, password) => {
     if(!fbAuth || !fbModules) throw Error('Firebase 雲端模組尚未完成初始化，請檢查網路連線。');
     const clean = email.trim().toLowerCase();
     if(!ALLOWED_EMAILS.includes(clean)) throw Error('此帳號不在家庭白名單（tpc0941101090@gmail.com / amethyst72@gmail.com）中。');
     return await fbModules.authMod.signInWithEmailAndPassword(fbAuth, clean, password);
   },
   logout: async () => {
     if(!fbAuth || !fbModules) return;
     return await fbModules.authMod.signOut(fbAuth);
   },
   forceSync: async () => {
     if(outbox.length){await pushToFirestore();return;}
     if(hasPending()&&!confirm('讀回雲端會取代本機表格；將保留本機備份，是否繼續？'))return;const ok = await pullFromFirestore(true);
     if(ok) window.location.reload();
   },
   migrateToCloud: async () => {
     if(!currentFbUser) throw Error('請先登入家庭雲端帳號再執行移轉。');
     if(!confirm('即將將本機瀏覽器現有原料與配方上傳至 Firebase 家庭雲端，確定繼續？')) return;
     localStorage.setItem(KEY + '_pre_firebase_backup', localStorage.getItem(KEY));
     await pushToFirestore();
     alert('✅ 本機資料已成功同步至 Firebase 家庭雲端！您與太太登入後皆可即時共用。');
   }
 };

 const mutations=['saveInventory','saveRecipe','deleteRecipe','archiveRecipe','saveMaterial','saveProduct','savePrice','saveLog','savePackage','saveCost','migrateUnits','importCatalog'];
 window.google={script:{get run(){let success,failure;const runner={withSuccessHandler(fn){success=fn;return runner;},withFailureHandler(fn){failure=fn;return runner;},api(request){setTimeout(()=>{
  const before=JSON.parse(JSON.stringify(tables())),previous=outbox.slice();
  try{
   const result=call(request);
   if(result.ok&&mutations.includes(request.action)){
    const data=JSON.parse(JSON.stringify(request.data||{}));if(request.action==='saveRecipe')data.id=result.value.id;
    outbox.push({key:crypto.randomUUID(),action:request.action,data,result:result.value});
    localStorage.setItem(OUTBOX,JSON.stringify(outbox));persist();localStorage.setItem(PENDING,'true');
    if(currentFbUser)pushToFirestore().catch(()=>{});else updateSyncStatus('offline','待同步');
   }
   success?.(result);
  }catch(e){outbox=previous;installTables(before);try{localStorage.setItem(OUTBOX,JSON.stringify(previous));persist();}catch(ignore){}failure?.(Error('本機儲存失敗，資料已保留；請確認儲存空間並匯出備份。'));}
 },0);return runner;}};return runner;}}};

 if(typeof window !== 'undefined' && typeof document !== 'undefined'){
   window.addEventListener('DOMContentLoaded',()=>{
     initFirebase();window.addEventListener('offline',()=>{if(outbox.length)updateSyncStatus('offline','待同步');});window.addEventListener('online',()=>{if(!fbAuth)initFirebase();else if(currentFbUser&&outbox.length)pushToFirestore().catch(()=>{});});

     const btnLogin = document.getElementById('btnLogin');
     const btnGoogleLogin = document.getElementById('btnGoogleLogin');
     const btnLogout = document.getElementById('btnLogout');
     const btnForceSync = document.getElementById('btnForceSync');
     const btnMigrate = document.getElementById('btnMigrateToCloud');

     if(btnGoogleLogin){
       btnGoogleLogin.onclick = async () => {
         const status = document.getElementById('authLoginStatus');
         try{
           btnGoogleLogin.disabled = true;
           if(status) status.textContent = '請在 Google 視窗選擇家庭帳號…';
           await window.AromaSync.loginGoogle();
           if(status) status.textContent = '已登入，請查看上方同步狀態。';
         }catch(e){
           const messages = {
             'auth/popup-closed-by-user':'已取消登入，本機資料保留。',
             'auth/cancelled-popup-request':'登入視窗已取消，請重新點選登入。',
             'auth/popup-blocked':'瀏覽器阻擋登入視窗，請允許彈出式視窗後再點選登入。',
             'auth/unauthorized-domain':'此網址尚未允許 Google 登入，請使用正式網站或聯絡管理員。',
             'auth/operation-not-allowed':'家庭雲端尚未啟用 Google 登入，請聯絡管理員。',
             'auth/network-request-failed':'網路連線失敗，請稍後重試。本機資料保留。',
             'auth/account-exists-with-different-credential':'此帳號已有其他登入方式，請先使用下方原有密碼登入。'
           };
           if(status) status.textContent = messages[e.code] || ('登入失敗：'+e.message);
         }finally{
           btnGoogleLogin.disabled = false;
         }
       };
     }

     if(btnLogin){
       btnLogin.onclick = async () => {
         const email = document.getElementById('authEmail')?.value;
         const pwd = document.getElementById('authPassword')?.value;
         if(!email || !pwd){ alert('請輸入家庭成員 Email 與密碼'); return; }
         try{
           btnLogin.disabled = true;
           btnLogin.textContent = '登入中…';
           await window.AromaSync.login(email, pwd);
           alert('已登入，請查看同步狀態；待移轉或衝突時，資料仍保存在本機。');
         }catch(e){
           alert('登入失敗：' + (e.message || e));
         }finally{
           btnLogin.disabled = false;
           btnLogin.textContent = '登入家庭雲端';
         }
       };
     }

     if(btnLogout){
       btnLogout.onclick = async () => {
         await window.AromaSync.logout();
         alert('已登出家庭雲端，切換回本機離線保存模式。');
       };
     }

     if(btnForceSync){
       btnForceSync.onclick = () => window.AromaSync.forceSync();
     }

     if(btnMigrate){
       btnMigrate.onclick = async () => {
         try{
           await window.AromaSync.migrateToCloud();
         }catch(e){
           alert('移轉失敗：' + e.message);
         }
       };
     }

     const toolbar=document.querySelector('#backupPanel .toolbar');
     if(toolbar){
       const button=document.createElement('button');
       button.textContent='匯入備份';
       button.onclick=()=>{
         const input=document.createElement('input');
         input.type='file';
         input.accept='.json';
         input.onchange=async()=>{
           try{
             const data=JSON.parse(await input.files[0].text());
             if(!data.tables||Object.keys(seed).some(n=>!Array.isArray(data.tables[n])))throw Error('請選擇此版匯出的完整備份');
             const restored=Object.fromEntries(Object.keys(seed).map(n=>{const keys=seed[n][0];return[n,[keys,...data.tables[n].map(o=>{if(!o||typeof o!=='object'||Array.isArray(o))throw Error('備份格式不正確');return keys.map(k=>o[k]??'');})]];}));
             if(!confirm('匯入會取代這台裝置的資料，確定匯入？'))return;
             localStorage.setItem(KEY+'_before_import',localStorage.getItem(KEY));
             localStorage.setItem(KEY,JSON.stringify(restored));
             window.location.reload();
           }catch(e){
             alert('匯入失敗：'+e.message);
           }
         };
         input.click();
       };
       toolbar.append(button);
     }
   });
 }
})();
