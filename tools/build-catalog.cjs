const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const rows=JSON.parse(fs.readFileSync(path.join(root,'data/young-living-tw.json'),'utf8'));
const logic=fs.readFileSync(path.join(root,'tools/catalog-runtime.js'),'utf8');
fs.writeFileSync(path.join(root,'src/Catalog.html'),'<script>\n(()=>{const data='+JSON.stringify(rows).replace(/</g,'\\u003c')+';\n'+logic+'\n})();\n</script>\n','utf8');

fs.writeFileSync(path.join(root,'src/CatalogData.html'),JSON.stringify(rows),'utf8');
