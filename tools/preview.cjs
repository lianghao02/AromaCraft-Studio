/* 離線預覽：記憶體中的示範資料，重新啟動後重設；不會連到 Google。 */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {createHarness}=require('./gas-mock.cjs');
const h=createHarness();h.setup();h.call('importCatalog');
const root=path.join(__dirname,'../src');
const bridge=`<script>
window.AROMA_DEMO=true;
let failNext=false;
const demoButton=document.createElement('button');demoButton.textContent='模擬下一次配方儲存失敗';demoButton.id='demoFailure';demoButton.onclick=()=>{failNext=true;demoButton.textContent='已排定模擬失敗，請儲存配方';};document.querySelector('#demoToolsSlot').append(demoButton);
window.google={script:{get run(){let success,failure;const runner={withSuccessHandler(fn){success=fn;return runner;},withFailureHandler(fn){failure=fn;return runner;},api(request){if(failNext && request.action==='saveRecipe'){failNext=false;demoButton.textContent='模擬下一次配方儲存失敗';success({ok:false,error:'示範：模擬寫入失敗，配方內容已保留，可再次儲存。'});return;}fetch('/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)}).then(r=>r.json()).then(r=>success(r)).catch(e=>failure(e));}};return runner;}}};
</script>`;
function renderPreview(){
  if(process.argv[2]) return fs.readFileSync(path.resolve(process.argv[2]),'utf8');
  return fs.readFileSync(path.join(root,'Index.html'),'utf8').replace(/<\?!= include_\('([^']+)'\); \?>/g,(_,name)=>(name==='Client'?bridge:'')+fs.readFileSync(path.join(root,name+'.html'),'utf8'));
}
if(process.argv[2]==='--build'){
  process.argv.splice(2,1);
  const destination=process.argv.splice(2,1)[0];
  if(!destination)throw Error('請指定前端 HTML 輸出路徑');
  fs.writeFileSync(path.resolve(destination),renderPreview(),'utf8');
  console.log('已產生單一前端預覽 HTML');
  return;
}
const port=Number(process.env.PORT || 8765);
const server=http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(req.method==='GET' && req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(renderPreview());return;}
  if(req.method==='POST' && req.url==='/api'){
    let body='';req.on('data',chunk=>{body+=chunk;if(body.length>250000)req.destroy();});
    req.on('end',()=>{try{const request=JSON.parse(body);const result=h.call(request.action,request.data);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(result));}catch(e){res.writeHead(400);res.end('{}');}});return;
  }
  res.writeHead(404);res.end('找不到頁面');
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log('AromaCraft 示範預覽已在運行中：http://localhost:' + port + '/（無須重複啟動，請直接於瀏覽器開啟操作）');
    process.exit(0);
  }
  console.error('伺服器啟動失敗：', err.message);
  process.exit(1);
});
server.listen(port,'127.0.0.1',()=>console.log('AromaCraft 示範預覽：http://localhost:'+port+'（示範資料僅存於記憶體，按 Ctrl+C 結束）'));
