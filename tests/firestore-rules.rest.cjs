/* 僅對本機 Firestore Emulator 執行；不使用真實帳號或資料。 */
const assert=require('node:assert/strict');
const host=process.env.FIRESTORE_EMULATOR_HOST;if(!host||!host.startsWith('127.0.0.1:'))throw Error('必須透過本機模擬器執行');
const project='demo-aromacraft',prefix='projects/'+project+'/databases/(default)/documents',base='http://'+host+'/v1/'+prefix;
const token=(email,uid)=>Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({iss:'https://securetoken.google.com/'+project,aud:project,sub:uid,user_id:uid,email,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:'custom'}})).toString('base64url')+'.';
const uid='synthetic-family',allowed=token('tpc0941101090@gmail.com',uid),denied=token('outside@example.test','synthetic-outsider');
const value=v=>typeof v==='number'?{integerValue:String(v)}:{stringValue:v};
function write(p,data){return {update:{name:prefix+'/'+p,fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,value(v)]))},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]};}
const batch=n=>[write('families/home_sharing/backup/r'+n+'_rules',{schemaVersion:2,revision:n,tablesJson:'{"合成測試":[["id"],["x"]]}',updatedBy:uid}),write('families/home_sharing/settings/syncHead',{schemaVersion:2,revision:n,snapshotId:'r'+n+'_rules',updatedBy:uid})];
const commit=async(writes,auth)=>fetch(base+':commit',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth},body:JSON.stringify({writes})});
(async()=>{let response=await commit(batch(1),denied);assert.equal(response.status,403,'非家庭成員須拒絕');response=await commit(batch(1),allowed);if(response.status!==200)throw Error('家庭首版交易失敗：'+await response.text());
response=await commit(batch(1),allowed);assert.equal(response.status,403,'舊快照不可覆寫');
response=await commit(batch(2).slice(1),allowed);assert.equal(response.status,403,'缺少配對快照的版本更新須拒絕');
response=await commit(batch(2),allowed);if(response.status!==200)throw Error('新版交易失敗：'+await response.text());
response=await fetch(base+'/families/home_sharing/backup/r1_rules',{headers:{Authorization:'Bearer '+allowed}});assert.equal(response.status,200,'舊版仍可讀');const old=await response.json();assert.equal(old.fields.revision.integerValue,'1');
response=await fetch(base+'/families/home_sharing/settings/syncHead',{headers:{Authorization:'Bearer '+denied}});assert.equal(response.status,403,'未授權不可讀取指標');
response=await fetch(base+'/families/home_sharing/backup/r1_rules',{method:'DELETE',headers:{Authorization:'Bearer '+allowed}});assert.equal(response.status,403,'歷史快照不可刪除');console.log('Firestore Emulator 規則驗證通過：未授權拒絕、首版及新版交易、舊快照防覆寫／刪除、配對快照與版本檢查。');})().catch(e=>{console.error(e.message);process.exitCode=1;});
