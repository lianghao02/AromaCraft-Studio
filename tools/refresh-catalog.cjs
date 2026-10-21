#!/usr/bin/env node
/* 更新內建官網價格快照（data/young-living-tw.json）。
 * 預設只預覽（dry run），列出「價格變動清單」；加 --write 才寫入。
 * 只更新有官網介面網址（api 欄位）的品項；沒有公開價格的品項原樣保留，不補、不猜。
 * 用法：node tools/refresh-catalog.cjs [--write] [--delay 400] [--limit N] [--accept-anomalies]
 * 結束碼：0 正常；2 失敗比例過高（未寫入）；3 有異常變動（未寫入，需人工確認）；1 其他錯誤。 */
const fs=require('node:fs'),path=require('node:path');
const DATA=path.join(__dirname,'..','data','young-living-tw.json');
const MAX_CHANGE_RATIO=0.3;   // 單筆批發價變動超過 30% 視為異常
const MAX_CHANGED_ITEMS=30;   // 一次變動超過 30 筆視為異常（可能是官網改版或解析錯誤）
const MAX_FAIL_RATIO=0.1;     // 失敗超過 10% 不寫入

const parsePrice=s=>{const n=Number(String(s??'').replace(/[,\s]/g,''));return Number.isFinite(n)&&n>0?n:null;};
const parseMl=name=>{const m=String(name||'').match(/(\d+(?:\.\d+)?)\s*ml/i);return m?Number(m[1]):null;};
const pct=(a,b)=>a>0?((b-a)/a*100).toFixed(1)+'%':'—';
const fmt=n=>n===null||n===undefined?'—':Number(n).toLocaleString('zh-TW');

/** 比對一筆原資料與官網回傳的商品，回傳變動、異常與要寫入的新內容（沒有任何變動則 next 為 null）。 */
function evaluate(record,sku,now){
  const out={id:record.id,name:record.name,changes:[],anomalies:[],failed:false,next:null,priceBatchChanged:false};
  if(!sku){out.failed=true;out.anomalies.push('官網回傳找不到對應的商品編號');return out;}
  const next={...record};
  const wholesale=parsePrice(sku.wholesalePriceString),retail=parsePrice(sku.retailPriceString),mlParsed=parseMl(sku.name);
  if(wholesale===null){if(record.wholesale!==null)out.anomalies.push('官網目前沒有批發價，保留原價格');}
  else if(record.wholesale!==wholesale){
    out.changes.push({field:'批發價',from:record.wholesale,to:wholesale});next.wholesale=wholesale;out.priceBatchChanged=true;
    if(record.wholesale>0&&Math.abs(wholesale-record.wholesale)/record.wholesale>MAX_CHANGE_RATIO)out.anomalies.push('批發價變動超過 '+MAX_CHANGE_RATIO*100+'%：'+fmt(record.wholesale)+'→'+fmt(wholesale));
  }
  if(retail!==null&&record.retail!==retail){out.changes.push({field:'零售價',from:record.retail,to:retail});next.retail=retail;}
  if(mlParsed!==null&&record.ml!==mlParsed){
    out.changes.push({field:'容量(mL)',from:record.ml,to:mlParsed});next.ml=mlParsed;out.priceBatchChanged=true;
    if(record.ml>0)out.anomalies.push('容量變動：'+record.ml+'→'+mlParsed+' mL，請確認是否為同一商品');
  }
  const inStock=Boolean(sku.inStock);
  if(record.inStock!==inStock){out.changes.push({field:'庫存',from:record.inStock,to:inStock});next.inStock=inStock;}
  if(next.ml>0&&next.wholesale>0){const perMl=Math.round(next.wholesale/next.ml*1e6)/1e6;if(perMl!==record.perMl){next.perMl=perMl;}}
  if(record.status==='容量或價格待核對'&&next.ml>0&&next.wholesale>0)next.status='容量與價格已取得';
  // 只有批發價或容量改變才換查價時間：查價時間決定是否新增一批價格（舊批次保留），庫存或零售價變動不需要
  if(out.priceBatchChanged)next.at=now;
  if(JSON.stringify(next)!==JSON.stringify(record))out.next=next;
  return out;
}

async function fetchSkus(url,{retries=3,timeoutMs=15000}={}){
  let last;
  for(let i=0;i<=retries;i++){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeoutMs);
    try{
      const res=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json','User-Agent':'AromaCraft-price-refresh (personal family tool; low rate)'}});
      if(!res.ok)throw Error('HTTP '+res.status);
      return await res.json();
    }catch(e){last=e;await new Promise(r=>setTimeout(r,600*(i+1)));}
    finally{clearTimeout(timer);}
  }
  throw last;
}

async function run({write=false,delayMs=400,limit=Infinity,acceptAnomalies=false,fetchImpl=fetchSkus,now=new Date().toISOString(),dataPath=DATA,log=()=>{}}={}){
  const rows=JSON.parse(fs.readFileSync(dataPath,'utf8'));
  const targets=rows.filter(r=>r.api).slice(0,limit);
  const results=[];
  for(const [i,record] of targets.entries()){
    let sku=null,error='';
    try{const list=await fetchImpl(record.api);sku=Array.isArray(list)?list.find(x=>String(x.partNumber)===String(record.id))||null:null;}
    catch(e){error=e.message;}
    const r=error?{id:record.id,name:record.name,changes:[],anomalies:['抓取失敗：'+error],failed:true,next:null,priceBatchChanged:false}:evaluate(record,sku,now);
    results.push(r);
    log((i+1)+'/'+targets.length+' '+record.id+' '+(r.failed?'失敗':r.changes.length?'有變動':'無變動'));
    if(delayMs&&i<targets.length-1)await new Promise(res=>setTimeout(res,delayMs));
  }
  const failed=results.filter(r=>r.failed),changed=results.filter(r=>r.next),anomalies=results.filter(r=>r.anomalies.length&&!r.failed);
  const summary={total:targets.length,skippedNoApi:rows.length-rows.filter(r=>r.api).length,failed:failed.length,changed:changed.length,anomalies:anomalies.length,batchChanges:results.filter(r=>r.priceBatchChanged).length,wrote:false,blocked:''};
  if(targets.length&&failed.length/targets.length>MAX_FAIL_RATIO)summary.blocked='fail';
  else if(changed.length>MAX_CHANGED_ITEMS||(anomalies.length&&!acceptAnomalies))summary.blocked='anomaly';
  if(write&&!summary.blocked&&changed.length){
    const byId=new Map(changed.map(r=>[r.id,r.next]));
    fs.writeFileSync(dataPath,JSON.stringify(rows.map(r=>byId.get(r.id)||r),null,2)+'\n','utf8');summary.wrote=true;
  }
  return {summary,results,failed,changed,anomalies};
}

function report({summary,failed,changed,anomalies},write){
  const L=[];
  L.push('官網價格更新預覽（'+(write?'--write 模式':'dry run，未寫入')+'）');
  L.push('檢查 '+summary.total+' 筆（另有 '+summary.skippedNoApi+' 筆沒有官網介面，原樣保留）｜有變動 '+summary.changed+'｜異常 '+summary.anomalies+'｜失敗 '+summary.failed);
  if(changed.length){L.push('','【變動清單】');for(const r of changed)L.push('- '+r.id+' '+r.name+'：'+r.changes.map(c=>c.field+' '+fmt(c.from)+'→'+fmt(c.to)+(c.field==='批發價'?'（'+pct(c.from,c.to)+'）':'')).join('；'));}
  if(anomalies.length){L.push('','【異常，需人工確認】');for(const r of anomalies)L.push('- '+r.id+' '+r.name+'：'+r.anomalies.join('；'));}
  if(failed.length){L.push('','【失敗】');for(const r of failed)L.push('- '+r.id+' '+r.name+'：'+r.anomalies.join('；'));}
  if(summary.blocked==='fail')L.push('','已停止寫入：失敗比例超過 '+MAX_FAIL_RATIO*100+'%，請稍後重試或檢查官網介面是否改版。');
  if(summary.blocked==='anomaly')L.push('','已停止寫入：有異常變動或一次變動超過 '+MAX_CHANGED_ITEMS+' 筆。確認無誤後可加 --accept-anomalies 重跑。');
  if(summary.wrote)L.push('','已寫入 data/young-living-tw.json；下一步請執行 npm run build:catalog 與 npm run build。');
  else if(!write&&changed.length)L.push('','確認變動清單後，加 --write 寫入。');
  else if(!changed.length)L.push('','沒有任何變動，不需要更新。');
  return L.join('\n');
}

async function main(argv){
  const opt={write:argv.includes('--write'),acceptAnomalies:argv.includes('--accept-anomalies')};
  const num=(flag,def)=>{const i=argv.indexOf(flag);return i>=0&&argv[i+1]!==undefined?Number(argv[i+1]):def;};
  opt.delayMs=num('--delay',400);opt.limit=num('--limit',Infinity);
  opt.log=m=>process.stderr.write(m+'\n');
  const res=await run(opt);
  console.log(report(res,opt.write));
  console.log('SUMMARY '+JSON.stringify(res.summary));
  return res.summary.blocked==='fail'?2:res.summary.blocked==='anomaly'?3:0;
}

module.exports={parsePrice,parseMl,evaluate,run,report,MAX_CHANGE_RATIO,MAX_CHANGED_ITEMS,MAX_FAIL_RATIO};
if(require.main===module)main(process.argv.slice(2)).then(code=>process.exit(code),e=>{console.error('錯誤：'+e.message);process.exit(1);});
