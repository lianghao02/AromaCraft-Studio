#!/usr/bin/env node
/* 升版：一次改好 package.json、sw.js 的快取名稱（手機才會更新）、src/Index.html 頁尾與 README 標題。
 * 用法：node tools/bump-version.cjs [x.y.z] [--root 目錄]；不指定版本則 patch +1。
 * CHANGELOG.md 請另外手動寫（需要說明內容），本工具不改。 */
const fs=require('node:fs'),path=require('node:path');

function bump(root,explicit){
  const file=n=>path.join(root,n);
  const read=n=>fs.readFileSync(file(n),'utf8'),write=(n,s)=>fs.writeFileSync(file(n),s,'utf8');
  const pkg=JSON.parse(read('package.json'));
  const old=pkg.version;if(!/^\d+\.\d+\.\d+$/.test(old||''))throw Error('package.json 版本格式不正確：'+old);
  let next=explicit;
  if(next){if(!/^\d+\.\d+\.\d+$/.test(next))throw Error('版本格式需為 x.y.z：'+next);}
  else{const [a,b,c]=old.split('.').map(Number);next=a+'.'+b+'.'+(c+1);}
  if(next===old)throw Error('新版本與目前版本相同：'+old);
  const edits=[
    ['package.json',s=>s.replace('"version": "'+old+'"','"version": "'+next+'"'),'"version": "'+next+'"'],
    ['sw.js',s=>s.replace("'aromacraft-v"+old+"'","'aromacraft-v"+next+"'"),"'aromacraft-v"+next+"'"],
    ['src/Index.html',s=>s.replace('· v'+old+'</div>','· v'+next+'</div>'),'· v'+next+'</div>'],
  ];
  const results=[];
  for(const [name,fn,expect] of edits){const before=read(name),after=fn(before);if(!after.includes(expect))throw Error(name+' 找不到舊版本 '+old+' 的標示，未做任何修改');results.push([name,after]);}
  // README 標題（可選）：## vX.Y.Z 最新版
  let readme=null;if(fs.existsSync(file('README.md'))){const r=read('README.md'),re=/^(## v)\d+\.\d+\.\d+( 最新版)/m;if(re.test(r))readme=r.replace(re,'$1'+next+'$2');}
  for(const [name,after] of results)write(name,after);
  if(readme!==null)write('README.md',readme);
  return {from:old,to:next,files:[...results.map(r=>r[0]),...(readme!==null?['README.md']:[])]};
}

module.exports={bump};
if(require.main===module){
  try{
    const argv=process.argv.slice(2),ri=argv.indexOf('--root');
    const root=ri>=0?path.resolve(argv[ri+1]):path.join(__dirname,'..');
    const explicit=argv.find((a,i)=>!a.startsWith('--')&&argv[i-1]!=='--root');
    const r=bump(root,explicit);
    console.log('版本 '+r.from+' → '+r.to+'；已修改：'+r.files.join('、')+'。請另外更新 CHANGELOG.md 後重建（npm run build）。');
  }catch(e){console.error('錯誤：'+e.message);process.exit(1);}
}
