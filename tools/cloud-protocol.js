/* Firebase 快照格式及版本交易：純資料層，可注入 SDK 驗證。 */
var AromaCloudProtocol=(()=>{
 function validate(tables,keys){if(!tables||typeof tables!=='object'||keys.some(k=>!Array.isArray(tables[k])||!tables[k].length||!Array.isArray(tables[k][0])))throw Error('雲端備份格式不正確，不會取代本機資料');for(const k of keys)for(const row of tables[k]){if(!Array.isArray(row)||row.some(v=>v!==null&&!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v)))throw Error('雲端備份內容無效');}return tables;}
 function encode(tables,keys){validate(tables,keys);const json=JSON.stringify(tables);if(new TextEncoder().encode(json).length>900000)throw Error('資料超過單份雲端快照大小，請先匯出備份');return json;}
 function decode(data,keys){if(data.schemaVersion===2&&typeof data.tablesJson==='string')return validate(JSON.parse(data.tablesJson),keys);if(data.tables)return validate(data.tables,keys);throw Error('不支援的雲端備份版本');}
 function create({sdk,db,family,uid,keys}){
  const head=sdk.doc(db,'families',family,'settings','syncHead');
  async function read(){const h=await sdk.getDoc(head);if(!h.exists()){const legacy=await sdk.getDoc(sdk.doc(db,'families',family,'backup','snapshot'));return {revision:0,snapshotId:null,tables:legacy.exists()?decode(legacy.data(),keys):null};}const meta=h.data();if(!Number.isInteger(meta.revision)||meta.revision<1||typeof meta.snapshotId!=='string')throw Error('雲端同步版本格式不正確');const snap=await sdk.getDoc(sdk.doc(db,'families',family,'backup',meta.snapshotId));if(!snap.exists()||snap.data().revision!==meta.revision)throw Error('雲端快照與版本不一致');return {revision:meta.revision,snapshotId:meta.snapshotId,tables:decode(snap.data(),keys)};}
  async function write(tables,expected,snapshotId){const json=encode(tables,keys),revision=expected+1;await sdk.runTransaction(db,async tx=>{const h=await tx.get(head),actual=h.exists()?h.data().revision:0;if(actual!==expected){const e=Error('另一台裝置已更新資料；本機已保留，請先讀取雲端並確認修改');e.code='sync/conflict';throw e;}const updatedAt=sdk.serverTimestamp();tx.set(sdk.doc(db,'families',family,'backup',snapshotId),{schemaVersion:2,revision,tablesJson:json,updatedAt,updatedBy:uid});tx.set(head,{schemaVersion:2,revision,snapshotId,updatedAt,updatedBy:uid});});return {revision,snapshotId};}
  function listen(next,error){return sdk.onSnapshot(head,()=>{read().then(next).catch(error);},error);}
  return {read,write,listen};
 }
 return {validate,encode,decode,create};
})();
if(typeof module!=='undefined')module.exports=AromaCloudProtocol;
