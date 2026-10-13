/* 瀏覽器儲存介面：共用既有後端規則，與真實 Google 授權及資料分離。 */
(() => {
 'use strict';
 const KEY='aromacraft_standalone_tables_v2',OLD='aromacraft_standalone_db_v1';
 const seed=__AROMA_SEED__,sources=__AROMA_SOURCES__;
 let values;const raw=localStorage.getItem(KEY);
 if(raw){values=JSON.parse(raw);if(!values||typeof values!=='object'||Object.keys(seed).some(n=>!Array.isArray(values[n])))throw Error('本機資料格式不正確，請保留備份，不會自動重設。');}
 else{values=JSON.parse(JSON.stringify(seed));const legacy=localStorage.getItem(OLD);if(legacy){
   const old=JSON.parse(legacy);if(!Array.isArray(old.materials)||!Array.isArray(old.prices))throw Error('舊資料格式不正確，請保留備份。');
   const rows=(name,list)=>{const keys=values[name][0];values[name]=[keys,...list.map(o=>keys.map(k=>o[k]??''))];};
   rows('原料資料',old.materials);rows('原料價格',old.prices);
   rows('配方資料',(old.recipes||[]).map(r=>({...r,costJson:JSON.stringify(r.cost),snapshotJson:JSON.stringify(r.snapshot),quantityUnit:r.quantityUnit||'g',concentrationJson:r.concentration?JSON.stringify(r.concentration):''})));
   rows('配方明細',old.recipeDetails||[]);rows('製作紀錄',(old.logs||[]).map(l=>({...l,snapshotJson:JSON.stringify(l.snapshot)})));
   // 舊預設的通用安全宣稱缺少逐油證據，移轉後保留文字但改為待核對。
   rows('安全規則',(old.rules||[]).map(r=>({...r,status:'待核對'})));
   if(old.cost)rows('成本設定',[{id:old.costRevision||'legacy-cost',valueJson:JSON.stringify(old.cost)}]);
 }}
 class Sheet{
  constructor(name){this.name=name;this.values=values[name]||[];this.maxRows=Math.max(1000,this.values.length);}
  getLastRow(){return this.values.length;}getMaxRows(){return this.maxRows;}insertRowsAfter(row,n){this.maxRows+=n;}
  getRange(row,col,n=1,m=1){const s=this;return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.values[row+i-1]?.[col+j-1]??'')),setValues(rows){for(let i=0;i<n;i++){s.values[row+i-1]||=[];for(let j=0;j<m;j++){const v=rows[i][j];s.values[row+i-1][col+j-1]=typeof v==='string'&&v.startsWith("'")?v.slice(1):v;}}return this;},setFontWeight(){return this;},setBackground(){return this;}};}
  setFrozenRows(){}deleteRow(row){this.values.splice(row-1,1);}
 }
 const sheets=new Map(Object.keys(values).map(n=>[n,new Sheet(n)]));
 const db={getSheetByName:n=>sheets.get(n),insertSheet(n){const s=new Sheet(n);sheets.set(n,s);return s;},setSpreadsheetTimeZone(){}};
 const props={SPREADSHEET_ID:'local-device',ADMIN_EMAIL:'local-user@device',ALLOWED_EMAILS:'local-user@device'};
 const environment={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},Session:{getActiveUser:()=>({getEmail:()=>props.ADMIN_EMAIL}),getEffectiveUser:()=>({getEmail:()=>props.ADMIN_EMAIL})},SpreadsheetApp:{openById:()=>db,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:()=>new Date().toISOString()},HtmlService:{createHtmlOutputFromFile:n=>({getContent:()=>sources[n]})}};
 const call=(function({PropertiesService,Session,SpreadsheetApp,LockService,Utilities,HtmlService}){
__AROMA_SERVER__
 return api;
 })(environment);
 const persist=()=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries([...sheets].map(([n,s])=>[n,s.values]))));
 const upgrade=call({action:'migrateUnits'});if(!upgrade.ok)throw Error(upgrade.error);
 const imported=call({action:'importCatalog'});if(!imported.ok)throw Error(imported.error);persist();
 window.AROMA_DEMO=true;window.AROMA_LOCAL=true;
 window.google={script:{get run(){let success,failure;const runner={withSuccessHandler(fn){success=fn;return runner;},withFailureHandler(fn){failure=fn;return runner;},api(request){setTimeout(()=>{const before=JSON.stringify(Object.fromEntries([...sheets].map(([n,s])=>[n,s.values])));try{const result=call(request);if(result.ok)persist();success?.(result);}catch(e){const original=JSON.parse(before);for(const [n,s]of sheets)s.values=original[n]||[];failure?.(Error('本機儲存失敗，請匯出備份並確認瀏覽器儲存空間。'));}},0);return runner;}};return runner;}}};
 window.addEventListener('DOMContentLoaded',()=>{
 const toolbar=document.querySelector('#backupPanel .toolbar');if(toolbar){const button=document.createElement('button');button.textContent='匯入備份';button.onclick=()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{const data=JSON.parse(await input.files[0].text());if(!data.tables||Object.keys(seed).some(n=>!Array.isArray(data.tables[n])))throw Error('請選擇此版匯出的完整備份');const restored=Object.fromEntries(Object.keys(seed).map(n=>{const keys=seed[n][0];return[n,[keys,...data.tables[n].map(o=>{if(!o||typeof o!=='object'||Array.isArray(o))throw Error('備份格式不正確');return keys.map(k=>o[k]??'');})]];}));if(!confirm('匯入會取代這台裝置的資料，確定匯入？'))return;localStorage.setItem(KEY+'_before_import',localStorage.getItem(KEY));localStorage.setItem(KEY,JSON.stringify(restored));window.location.reload();}catch(e){alert('匯入失敗：'+e.message);}};input.click();};toolbar.append(button);}
const node=document.getElementById('connection');if(node)node.textContent='瀏覽器本機模式：資料保存在這台裝置，請匯出備份帶回家；不會同步 Google。';});
})();
