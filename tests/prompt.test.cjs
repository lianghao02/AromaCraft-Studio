const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'src/Index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const m=html.match(/<script type="text\/plain" id="catalogRefreshPrompt">([\s\S]*?)<\/script>/);
test('更新官網價格提示詞存在，且與專案實際的指令、檔案、結束碼一致（避免提示詞與工具脫節）',()=>{
  assert.ok(m,'設定頁需內嵌提示詞');const prompt=m[1];
  // 提示詞提到的 npm 指令與工具檔都必須存在
  for(const s of ['build:catalog','build','test','check'])assert.ok(pkg.scripts[s],'package.json 缺少指令 '+s);
  for(const f of ['tools/refresh-catalog.cjs','tools/bump-version.cjs','data/young-living-tw.json','AGENTS.md','HANDOFF.md','CHANGELOG.md'])assert.ok(fs.existsSync(path.join(root,f)),'缺少檔案 '+f);
  for(const k of ['node tools/refresh-catalog.cjs','--write','node tools/bump-version.cjs','npm run build:catalog','npm run build','npm test','npm run check','git push origin main','gh run'])assert.ok(prompt.includes(k),'提示詞缺少：'+k);
  // 結束碼與停止條件需對應腳本實作
  const src=fs.readFileSync(path.join(root,'tools/refresh-catalog.cjs'),'utf8');
  assert.match(src,/blocked==='fail'\?2/);assert.match(src,/blocked==='anomaly'\?3/);assert.match(prompt,/結束碼 2/);assert.match(prompt,/結束碼 3/);assert.match(prompt,/SUMMARY/);assert.match(prompt,/--accept-anomalies/);
  // 授權範圍與安全底線
  assert.match(prompt,/已授權/);assert.match(prompt,/不要 force push/);assert.match(prompt,/不要編造任何價格/);assert.match(prompt,/不要碰 Apps Script/);assert.match(prompt,/git status/);
  // 不含私人路徑、帳號、金鑰
  assert.doesNotMatch(prompt,/[A-Z]:\|@gmail|api[_-]?key|password|secret/i);
  assert.ok(prompt.length>800&&prompt.length<6000);
});
test('設定頁有按鈕、對話框與複製流程',()=>{
  for(const id of ['showRefreshPrompt','promptDialog','promptText','copyPrompt','closePrompt','catalogSnapshotInfo'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'#'+id+' 需出現一次');
  const client=fs.readFileSync(path.join(root,'src/Client.html'),'utf8');
  assert.match(client,/navigator\.clipboard\.writeText/);assert.match(client,/execCommand\('copy'\)/,'需有舊瀏覽器備援');
});
