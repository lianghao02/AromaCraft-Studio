/* 本機驗證用 Google 服務替身；不使用 Google 帳號或真實試算表。 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
function createHarness() {
  const sheets = new Map();
  const state = { active: 'family@example.test', effective: 'family@example.test', locked: false, failWrite: '', properties: { SPREADSHEET_ID:'test-sheet', ADMIN_EMAIL:'family@example.test', ALLOWED_EMAILS:'family@example.test,other@example.test' } };
  class Sheet {
    constructor(name) { this.name=name;this.values=[];this.maxRows=1000; }
    getLastRow() { return this.values.length; }
    getMaxRows() { return this.maxRows; }
    insertRowsAfter(row,n) { this.maxRows+=n; }
    getRange(row,col,n=1,m=1) {
      const s=this;
      return {
        getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.values[row+i-1]?.[col+j-1] ?? '')),
        setValues(values) {
          if(state.failWrite===s.name) { state.failWrite='';throw Error('Service failure'); }
          for(let i=0;i<n;i++){s.values[row+i-1] ||= [];for(let j=0;j<m;j++) {
            const v=values[i][j];s.values[row+i-1][col+j-1]=typeof v==='string' && v.startsWith("'") ? v.slice(1) : v;
          }}
          return this;
        }, setFontWeight(){return this;},setBackground(){return this;}
      };
    }
    setFrozenRows() {}
    deleteRow(row) { this.values.splice(row-1,1); }
  }
  const db = { getSheetByName:name=>sheets.get(name), insertSheet(name){const s=new Sheet(name);sheets.set(name,s);return s;}, setSpreadsheetTimeZone(){} };
  const ctx = vm.createContext({
    console, Date, JSON, Set, Map,
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>state.properties[key]})},
    Session:{getActiveUser:()=>({getEmail:()=>state.active}),getEffectiveUser:()=>({getEmail:()=>state.effective})},
    SpreadsheetApp:{openById:id=>{if(id!=='test-sheet')throw Error('Missing');return db;},flush(){}},
    LockService:{getScriptLock:()=>({tryLock:()=>!state.locked,releaseLock(){}})},
    Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:()=>new Date().toISOString()},
    HtmlService:{createHtmlOutputFromFile:name=>({getContent:()=>fs.readFileSync(path.join(__dirname,'../src',name+'.html'),'utf8')}),createHtmlOutput:html=>({html,setTitle(){return this;}}),createTemplateFromFile:()=>({evaluate:()=>({setTitle(){return this;},addMetaTag(){return this;}})})}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/Code.gs'),'utf8'),ctx,{filename:'Code.gs'});
  return {state,sheets,ctx,setup:()=>{ctx.setupDatabase();ctx.migrateUnitSchema();},call:(action,data={})=>ctx.api({action,data}),loadCore:()=>ctx.core_()};
}
module.exports={createHarness};
