/* 靜態發布沿用相同計算與服務程式，在瀏覽器儲存本機表格，不連線 Google。 */
const fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('./gas-mock.cjs');
const root=path.join(__dirname,'..'),src=path.join(root,'src');
function build(){
 const h=createHarness();h.setup();h.call('importCatalog');
 const seed=Object.fromEntries([...h.sheets].map(([name,s])=>[name,s.values]));
 const sources=Object.fromEntries(['Core','CatalogData'].map(n=>[n,fs.readFileSync(path.join(src,n+'.html'),'utf8')]));
 const server=fs.readFileSync(path.join(src,'Code.gs'),'utf8');
 const runtime=fs.readFileSync(path.join(__dirname,'standalone-provider.js'),'utf8');
 const provider='<script>\n'+runtime.replace('__AROMA_CLOUD_PROTOCOL__',()=>fs.readFileSync(path.join(__dirname,'cloud-protocol.js'),'utf8')).replace('__AROMA_SEED__',()=>JSON.stringify(seed)).replace('__AROMA_SOURCES__',()=>JSON.stringify(sources).replace(/</g,'\\u003c')).replace('__AROMA_SERVER__',()=>server)+'\n</script>';
 const html=fs.readFileSync(path.join(src,'Index.html'),'utf8').replace(/<\?!= include_\('([^']+)'\); \?>/g,(_,name)=>(name==='Client'?provider:'')+fs.readFileSync(path.join(src,name+'.html'),'utf8'));
 fs.writeFileSync(path.join(root,'index.html'),html,'utf8');return html;
}
if(require.main===module)console.log('已產生靜態發布網頁：'+build().length+' 字元');
module.exports={build};
