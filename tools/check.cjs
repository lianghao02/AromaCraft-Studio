const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../src');
for(const file of ['Code.gs','Core.html','Client.html']){
  let source=fs.readFileSync(path.join(root,file),'utf8');
  if(file.endsWith('.html')) source=source.replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,'');
  new vm.Script(source,{filename:file});
  console.log('語法通過：'+file);
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'appsscript.json'),'utf8'));
if(manifest.webapp.executeAs!=='USER_ACCESSING'||manifest.webapp.access!=='ANYONE')throw Error('部署身分設定不符');
const html=fs.readFileSync(path.join(root,'Index.html'),'utf8');
for(const match of html.matchAll(/include_\('([^']+)'\)/g)) if(!fs.existsSync(path.join(root,match[1]+'.html')))throw Error('缺少引用檔案：'+match[1]);
console.log('部署設定與頁面引用通過');
