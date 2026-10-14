
globalThis.AromaCatalog = (()=>{
 'use strict';
 const categories=['單方精油','配方精油','滾珠','按摩油','精油套裝'];
 const ready=r=>r.ml>0&&r.wholesale!==null&&r.perMl!==null&&!r.categories.includes('精油套裝');
 function find(category,query='',pending=false){const q=query.trim().toLowerCase();return data.filter(r=>(category==='全部'||r.categories.includes(category))&&(pending||ready(r))&&(r.name+' '+r.id).toLowerCase().includes(q));}
 function estimate(items){return items.reduce((total,i)=>{const r=data.find(r=>r.id===i.id);if(!r||!ready(r))throw Error('此品項尚無完整容量與價格');if(i.ml===''||i.ml===null||!Number.isFinite(Number(i.ml))||Number(i.ml)<0)throw Error('請填寫各項用量（mL），可填 0');return total+Number(i.ml)*r.wholesale/r.ml;},0);}
 // 分類沿用官網目錄；容量及金額使用目前採購批次，避免混用舊價。
 function materialInfo(m,p){
  const r=data.find(r=>'yl-'+r.id===m.id);
  const kinds=(r?.categories||[]).filter(c=>c==='單方精油'||c==='配方精油');
  const kind=m.category==='精油'?(kinds.length===1?(kinds[0]==='單方精油'?'單方':'複方'):'待分類'):m.category;
  const shortName=m.name.replace(/\s*\d+(?:\.\d+)?\s*ml\s*$/i,'').replace(/精油/g,'');
  const name=m.category==='精油'?((kind==='複方'?shortName.replace(/配方/g,''):shortName).trim()||m.name):m.name;
  const official=Boolean(r&&p?.id?.startsWith(m.id+'-catalog-'));
  const image=r&&m.category==='精油'&&r?.image==='https://static.youngliving.com/productimages/large/'+r.id+'.jpg'?r.image:null;
  return {kind,name,image,amount:p?.amount,unit:p?.unit,paid:p?.paid,priceLabel:official?'批發價':'採購價'};
 }
 return {data,categories,ready,find,estimate,materialInfo};
})();
if(typeof document!=='undefined')(()=>{
 const $=id=>document.getElementById(id);if(!$('ylCards'))return;
 let category='單方精油',limit=24;const chosen=new Map();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:'TWD'}).format(n);
 function render(){const list=AromaCatalog.find(category,$('ylSearch').value,$('ylPending').checked);
 $('ylCategories').innerHTML=AromaCatalog.categories.map(c=>'<button type="button" data-yl-category="'+esc(c)+'" aria-pressed="'+(c===category)+'">'+esc(c)+' ('+AromaCatalog.find(c,'',$('ylPending').checked).length+')</button>').join('');
 $('ylCount').textContent='找到 '+list.length+' 筆，顯示 '+Math.min(limit,list.length)+' 筆';
 $('ylCards').innerHTML=list.slice(0,limit).map(r=>'<article class="yl-card'+(chosen.has(r.id)?' selected':'')+'"><button type="button" class="yl-pick" data-yl-pick="'+esc(r.id)+'" aria-pressed="'+chosen.has(r.id)+'" '+(!AromaCatalog.ready(r)?'disabled':'')+'><span class="badge">'+esc(r.categories[0])+'</span><strong>'+esc(r.name)+'</strong><span>'+ (r.ml===null?'容量待核對':r.ml+' mL')+'</span><span>'+ (r.wholesale===null?'價格待補':'批發 '+money(r.wholesale))+'</span><small>'+ (AromaCatalog.ready(r)?money(r.wholesale/r.ml)+'/mL':esc(r.status))+'</small><small>'+ (chosen.has(r.id)?'✓ 已選取，點擊移除':AromaCatalog.ready(r)?'點擊加入精油試算':'暫不可試算')+'</small></button><details><summary>價格與來源</summary><p>零售 '+(r.retail===null?'待補':money(r.retail))+'；'+(r.inStock===undefined?'庫存待核對':r.inStock?'有庫存':'無庫存')+'</p><small>'+esc(r.at?'查價：'+new Date(r.at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'公開查價無規格')+'</small><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">官網商品頁</a></details></article>').join('')||'<p class="empty">沒有符合的品項，請換分類或縮短關鍵字。</p>';
 $('ylMore').hidden=limit>=list.length;
 }
 function renderChosen(){ $('ylChosen').innerHTML=[...chosen].map(([id,ml])=>{const r=AromaCatalog.data.find(r=>r.id===id);return '<label>'+esc(r.name)+' 用量（mL）<input data-yl-amount="'+esc(id)+'" type="number" min="0" step="any" inputmode="decimal" value="'+esc(ml)+'"><button type="button" data-yl-remove="'+esc(id)+'">移除</button></label>';}).join('')||'<p class="muted">點選精油卡片，再填本次使用的 mL 數。</p>';updateCost(); }
 function updateCost(){try{$('ylTotal').textContent=chosen.size?'精油估算合計 '+money(AromaCatalog.estimate([...chosen].map(([id,ml])=>({id,ml})))):'尚未選取精油';}catch(e){$('ylTotal').textContent=e.message;}}
 $('ylCategories').onclick=e=>{const b=e.target.closest('[data-yl-category]');if(b){category=b.dataset.ylCategory;limit=24;render();}};
 $('ylSearch').oninput=$('ylPending').onchange=()=>{limit=24;render();};$('ylMore').onclick=()=>{limit+=24;render();};
 $('ylCards').onclick=e=>{const b=e.target.closest('[data-yl-pick]');if(!b||b.disabled)return;const id=b.dataset.ylPick;if(chosen.has(id))chosen.delete(id);else chosen.set(id,'');render();renderChosen();};
 $('ylChosen').oninput=e=>{if(e.target.dataset.ylAmount){chosen.set(e.target.dataset.ylAmount,e.target.value);updateCost();}};
 $('ylChosen').onclick=e=>{const b=e.target.closest('[data-yl-remove]');if(b){chosen.delete(b.dataset.ylRemove);render();renderChosen();}};
 $('ylClear').onclick=()=>{chosen.clear();render();renderChosen();};render();renderChosen();
})();
