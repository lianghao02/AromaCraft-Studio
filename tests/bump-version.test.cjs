const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {bump}=require('../tools/bump-version.cjs');
function project(version='1.2.3'){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aroma-bump-'));fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'package.json'),'{\n  "name": "x",\n  "version": "'+version+'"\n}\n');
  fs.writeFileSync(path.join(root,'sw.js'),"const CACHE_NAME = 'aromacraft-v"+version+"';\n");
  fs.writeFileSync(path.join(root,'src/Index.html'),'<div class="footer-brand"><strong>A</strong> · v'+version+'</div>\n');
  fs.writeFileSync(path.join(root,'README.md'),'# 專案\n\n## v'+version+' 最新版（含舊功能）\n內文\n');
  return root;
}
const read=(root,n)=>fs.readFileSync(path.join(root,n),'utf8');
test('預設 patch +1，四個地方一起更新',()=>{
  const root=project('1.2.3');const r=bump(root);
  assert.equal(r.to,'1.2.4');assert.match(read(root,'package.json'),/"version": "1\.2\.4"/);assert.match(read(root,'sw.js'),/aromacraft-v1\.2\.4/);
  assert.match(read(root,'src/Index.html'),/· v1\.2\.4<\/div>/);assert.match(read(root,'README.md'),/## v1\.2\.4 最新版（含舊功能）/);assert.equal(r.files.length,4);
});
test('可指定版本；格式錯誤或版本相同則拒絕',()=>{
  const root=project('1.2.3');assert.equal(bump(root,'1.3.0').to,'1.3.0');
  assert.throws(()=>bump(project('1.2.3'),'1.3'),/x\.y\.z/);assert.throws(()=>bump(project('1.2.3'),'1.2.3'),/相同/);
});
test('任一檔案找不到舊版本標示時，不改動任何檔案',()=>{
  const root=project('1.2.3');fs.writeFileSync(path.join(root,'sw.js'),"const CACHE_NAME = 'aromacraft-v9.9.9';\n");
  assert.throws(()=>bump(root),/sw\.js/);assert.match(read(root,'package.json'),/"version": "1\.2\.3"/);assert.match(read(root,'src/Index.html'),/· v1\.2\.3</);
});
