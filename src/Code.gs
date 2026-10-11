/* 所有資料 API 均由 api 統一授權；底線結尾函式禁止 google.script.run 呼叫。 */
const SCHEMA_ = {
  '原料資料': ['id', 'name', 'category', 'active', 'note', 'revision'],
  '原料價格': ['id', 'materialId', 'label', 'amount', 'unit', 'paid', 'density', 'gramsPerUnit', 'createdAt', 'createdBy'],
  '配方資料': ['id', 'version', 'name', 'type', 'units', 'notes', 'baseId', 'costJson', 'snapshotJson', 'requestId', 'createdAt', 'createdBy'],
  '配方明細': ['recipeId', 'version', 'materialId', 'grams', 'priceId'],
  '安全規則': ['id', 'materialId', 'type', 'maxPercent', 'source', 'status', 'note'],
  '製作紀錄': ['id', 'recipeId', 'version', 'date', 'units', 'notes', 'snapshotJson', 'requestId', 'createdAt', 'createdBy'],
  '成本設定': ['id', 'valueJson', 'createdAt', 'createdBy'],
  '系統設定': ['key', 'value']
};
function core_() {
  // 只評估本專案固定檔案，絕不評估使用者輸入。
  const source = HtmlService.createHtmlOutputFromFile('Core').getContent().replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
  return eval(source + '\nAromaCore;');
}
function identity_(admin) {
  const p = PropertiesService.getScriptProperties();
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const effective = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  const owner = String(p.getProperty('ADMIN_EMAIL') || '').trim().toLowerCase();
  const allowed = String(p.getProperty('ALLOWED_EMAILS') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!email || email !== effective) throw Error('AUTH：無法確認存取者身分，請以存取者身分部署並完成 Google 授權。');
  if (!owner || !allowed.includes(owner)) throw Error('AUTH：管理員與家庭白名單尚未正確設定。');
  if (!allowed.includes(email) || (admin && email !== owner)) throw Error('AUTH：此 Google 帳號沒有操作權限。');
  return email;
}
function db_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw Error('SETUP：尚未設定 SPREADSHEET_ID。');
  try { return SpreadsheetApp.openById(id); } catch (e) { throw Error('ACCESS：無法開啟資料試算表，請確認 ID、共享權限與 Google 授權。'); }
}
function table_(name) {
  const sheet = db_().getSheetByName(name);
  if (!sheet) throw Error('SETUP：缺少「' + name + '」，請由管理員執行 setupDatabase。');
  const headers = sheet.getRange(1, 1, 1, SCHEMA_[name].length).getValues()[0];
  if (headers.join('|') !== SCHEMA_[name].join('|')) throw Error('SCHEMA：' + name + '欄位不相容，請勿更動欄位名稱。');
  return sheet;
}
function rows_(name) {
  const sheet = table_(name), keys = SCHEMA_[name];
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, keys.length).getValues().map((r, index) => {
    const object = Object.fromEntries(keys.map((k, i) => [k, r[i] instanceof Date ? r[i].toISOString() : r[i]]));
    Object.defineProperty(object, '_row', { value: index + 2 });
    return object;
  }).filter(r => r[keys[0]] !== '');
}
function cell_(v) {
  if (v === undefined || v === null) return '';
  // 防止名稱、備註、來源等使用者文字被試算表解讀為公式。
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}
function append_(name, objects) {
  if (!objects.length) return;
  const sheet = table_(name);
  const required = sheet.getLastRow() + objects.length;
  if (required > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), required - sheet.getMaxRows());
  sheet.getRange(sheet.getLastRow() + 1, 1, objects.length, SCHEMA_[name].length).setValues(objects.map(o => SCHEMA_[name].map(k => cell_(o[k]))));
}
function lock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw Error('BUSY：其他家人正在儲存，請稍後重試；編輯內容已保留。');
  try { return fn(); } finally { lock.releaseLock(); }
}
function stamp_() { return Utilities.formatDate(new Date(), 'Asia/Taipei', "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function id_() { return Utilities.getUuid(); }
function requestId_(v) { return core_().text(v, '請求識別碼', 100); }
function safeJson_(v) {
  const text = JSON.stringify(v);
  if (text.length > 45000) throw Error('LIMIT：快照過大，請減少原料數或備註長度。');
  return text;
}
function defaults_() { return { packaging: 0, minutes: 0, hourly: 0, other: 0, loss: 0, margin: 0, sale: null }; }
function setupDatabase() {
  const email = identity_(true);
  return lock_(() => {
    const db = db_();
    // 先驗證所有既有工作表，避免先變更才發現欄位衝突。
    Object.keys(SCHEMA_).forEach(name => {
      const s = db.getSheetByName(name);
      if (s && s.getLastRow() && s.getRange(1, 1, 1, SCHEMA_[name].length).getValues()[0].join('|') !== SCHEMA_[name].join('|')) throw Error('SCHEMA：既有工作表「' + name + '」不相容；請改用全新試算表。');
    });
    Object.keys(SCHEMA_).forEach(name => {
      const s = db.getSheetByName(name) || db.insertSheet(name);
      if (!s.getLastRow()) s.getRange(1, 1, 1, SCHEMA_[name].length).setValues([SCHEMA_[name]]);
      s.setFrozenRows(1);
      s.getRange(1, 1, 1, SCHEMA_[name].length).setFontWeight('bold').setBackground('#e3eee7');
    });
    db.setSpreadsheetTimeZone('Asia/Taipei');
    if (!rows_('系統設定').length) append_('系統設定', [{ key: '資料庫版本', value: '1.0.0' }, { key: '系統名稱', value: 'AromaCraft-Studio' }]);
    if (!rows_('成本設定').length) append_('成本設定', [{ id: id_(), valueJson: safeJson_(defaults_()), createdAt: stamp_(), createdBy: email }]);
    // 建立名稱與零元試算價格，絕不放入虛構安全濃度。
    if (!rows_('原料資料').length) {
      const materials = [
        { id: 'demo-soap', name: '皂基（試算）', category: '皂基' },
        { id: 'demo-oil', name: '基底油（試算）', category: '基底油' },
        { id: 'demo-wax', name: '蜂蠟（試算）', category: '蜂蠟' },
        { id: 'demo-essential', name: '精油（請改為實際品名）', category: '精油' }
      ].map(m => ({ ...m, active: true, note: '示範資料，請輸入實際價格與原料資訊', revision: 1 }));
      append_('原料資料', materials);
      append_('原料價格', materials.map(m => ({ id: m.id + '-price', materialId: m.id, label: '零元示範批次／必須更新', amount: 100, unit: 'g', paid: 0, density: '', gramsPerUnit: '', createdAt: stamp_(), createdBy: email })));
    }
    return '8 張繁體中文工作表已就緒；原始工作表保留，請自行確認空白預設工作表後移除。';
  });
}
function doGet() {
  try {
    identity_(false);
    return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('AromaCraft Studio｜手作配方').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (e) {
    return HtmlService.createHtmlOutput('<html lang="zh-Hant"><meta name="viewport" content="width=device-width,initial-scale=1"><h1>目前無法存取</h1><p>請確認使用家庭白名單中的 Google 帳號，完成授權，並由管理員依部署說明設定「以存取者身分執行」。若無法辨識帳號，系統將拒絕讀寫資料。</p></html>').setTitle('AromaCraft｜存取限制');
  }
}
function include_(name) {
  if (!['Core', 'Styles', 'Client'].includes(name)) throw Error('不支援的頁面');
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
function recipes_() {
  return rows_('配方資料').map(r => ({ ...r, version: Number(r.version), units: Number(r.units), cost: JSON.parse(r.costJson), snapshot: JSON.parse(r.snapshotJson) }));
}
function loadRecipe_(id, version) {
  const all = recipes_().filter(r => r.id === id);
  const r = version ? all.find(r => r.version === Number(version)) : all.sort((a, b) => b.version - a.version)[0];
  if (!r) throw Error('NOT_FOUND：配方版本不存在。');
  const items = rows_('配方明細').filter(i => i.recipeId === id && Number(i.version) === r.version).map(i => ({ materialId: i.materialId, priceId: i.priceId, grams: Number(i.grams) }));
  return { id: r.id, version: r.version, name: r.name, type: r.type, units: r.units, notes: r.notes, baseId: r.baseId, cost: r.cost, items, snapshot: r.snapshot };
}
function bootstrap_() {
  const cost = rows_('成本設定');
  return { materials: rows_('原料資料'), prices: rows_('原料價格'), rules: rows_('安全規則'),
    recipes: recipes_().map(r => ({ id: r.id, version: r.version, name: r.name, type: r.type, createdAt: r.createdAt, safety: r.snapshot.safety })),
    logs: rows_('製作紀錄').map(l => ({ ...l, snapshot: JSON.parse(l.snapshotJson) })),
    cost: cost.length ? JSON.parse(cost[cost.length - 1].valueJson) : defaults_(), costRevision: cost.length ? cost[cost.length - 1].id : '', serverTime: stamp_() };
}
function saveRecipe_(d, email) {
  const c = core_(), requestId = requestId_(d.requestId);
  const all = recipes_();
  const already = all.find(r => r.requestId === requestId);
  if (already) {
    if (already.createdBy !== email) throw Error('CONFLICT：請求識別碼衝突。');
    return loadRecipe_(already.id, already.version);
  }
  const id = d.id ? c.text(d.id, '配方識別碼', 100) : id_();
  const previous = all.filter(r => r.id === id).sort((a, b) => b.version - a.version)[0];
  if ((previous ? previous.version : 0) !== Number(d.version || 0)) throw Error('CONFLICT：此配方已有新版；請先複製本機草稿，或載入最新版後再編輯。');
  const version = previous ? previous.version + 1 : 1;
  const name = c.text(d.name, '配方名稱', 100), notes = c.text(d.notes || '', '製作說明', 3000, false);
  if (d.baseId && !d.items.some(i => i.materialId === d.baseId)) throw Error('補足原料不在配方內');
  const materials = rows_('原料資料'), prices = rows_('原料價格'), rules = rows_('安全規則');
  const snapshot = c.calculate({ ...d, name }, materials, prices, rules);
  snapshot.calculatedAt = stamp_();
  const row = { id, version, name, type: d.type, units: snapshot.units, notes, baseId: d.baseId || '', costJson: safeJson_(snapshot.cost), snapshotJson: safeJson_(snapshot), requestId, createdAt: stamp_(), createdBy: email };
  // 清除僅限尚未提交且同版本的孤兒明細；已提交版本永不修改。
  const sheet = table_('配方明細'), pending = rows_('配方明細');
  for (let i = pending.length - 1; i >= 0; i--) if (pending[i].recipeId === id && Number(pending[i].version) === version) sheet.deleteRow(pending[i]._row);
  append_('配方明細', snapshot.items.map(i => ({ recipeId: id, version, materialId: i.materialId, grams: i.grams, priceId: i.priceId })));
  SpreadsheetApp.flush();
  // 最後寫入配方標記；讀取端只顯示已提交的版本。
  append_('配方資料', [row]);
  SpreadsheetApp.flush();
  return loadRecipe_(id, version);
}
function saveMaterial_(d) {
  const c = core_(), all = rows_('原料資料');
  const old = all.find(m => m.id === d.id);
  if (d.id && !old && Number(d.revision) !== 0) throw Error('原料不存在');
  const categories = ['精油', '皂基', '蜂蠟', '基底油', '其他'];
  if (!categories.includes(d.category)) throw Error('原料類別不正確');
  const m = { id: old ? old.id : (d.id ? c.text(d.id, '原料識別碼', 100) : id_()), name: c.text(d.name, '原料名稱', 100), category: d.category,
    active: d.active !== false, note: c.text(d.note || '', '原料備註', 1000, false), revision: old ? Number(old.revision) + 1 : 1 };
  if (old && Number(old.revision) !== Number(d.revision)) {
    if (Number(old.revision) === Number(d.revision) + 1 && ['name','category','active','note'].every(k => old[k] === m[k])) return old;
    throw Error('CONFLICT：原料已由其他家人修改，請重新載入。');
  }
  if (old) table_('原料資料').getRange(old._row, 1, 1, SCHEMA_['原料資料'].length).setValues([SCHEMA_['原料資料'].map(k => cell_(m[k]))]);
  else append_('原料資料', [m]);
  return m;
}
function savePrice_(d, email) {
  const c = core_(), requestId = requestId_(d.requestId);
  const prior = rows_('原料價格').find(p => p.id === requestId);
  if (prior) { if (prior.createdBy !== email) throw Error('請求識別碼衝突'); return prior; }
  if (!rows_('原料資料').some(m => m.id === d.materialId)) throw Error('原料不存在');
  const p = c.price({ id: requestId, materialId: d.materialId, label: c.text(d.label, '批次名稱', 100), amount: d.amount,
    unit: d.unit, paid: d.paid, density: d.density, gramsPerUnit: d.gramsPerUnit, createdAt: stamp_(), createdBy: email });
  append_('原料價格', [p]);
  return p;
}
function saveLog_(d, email) {
  const c = core_(), requestId = requestId_(d.requestId);
  const prior = rows_('製作紀錄').find(l => l.requestId === requestId);
  if (prior) { if (prior.createdBy !== email) throw Error('請求識別碼衝突'); return { ...prior, snapshot: JSON.parse(prior.snapshotJson) }; }
  const r = loadRecipe_(d.recipeId, d.version);
  const units = c.number(d.units, '實際合格產量', 1, 100000);
  if (!Number.isInteger(units)) throw Error('合格產量必須為整數');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || new Date(d.date + 'T00:00:00Z').toISOString().slice(0, 10) !== d.date) throw Error('製作日期無效');
  const s = JSON.parse(JSON.stringify(r.snapshot));
  // 成本以該版本價格與設定凍結；實際產量改變時，重新分攤包材及每件成本。
  s.units = units; s.gramsPerUnit = s.total / units; s.packaging = s.cost.packaging * units;
  s.batch = s.material + s.lossCost + s.packaging + s.labor + s.other;
  s.perUnit = s.batch / units; s.suggested = s.perUnit / (1 - s.cost.margin / 100);
  s.grossMargin = !s.cost.sale ? null : (s.cost.sale - s.perUnit) / s.cost.sale * 100;
  const row = { id: id_(), recipeId: r.id, version: r.version, date: d.date, units,
    notes: c.text(d.notes || '', '製作備註', 3000, false), snapshotJson: safeJson_(s), requestId, createdAt: stamp_(), createdBy: email };
  append_('製作紀錄', [row]);
  return { ...row, snapshot: s };
}
function api(request) {
  try {
    const email = identity_(false);
    if (!request || typeof request.action !== 'string') throw Error('無效請求');
    const d = request.data || {};
    const value = lock_(() => {
      switch (request.action) {
        case 'bootstrap': return { ...bootstrap_(), email, admin: email === PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL').trim().toLowerCase() };
        case 'loadRecipe': return loadRecipe_(d.id, d.version);
        case 'saveRecipe': return saveRecipe_(d, email);
        case 'saveMaterial': return saveMaterial_(d);
        case 'savePrice': return savePrice_(d, email);
        case 'saveLog': return saveLog_(d, email);
        case 'saveCost': {
          const all = rows_('成本設定'), last = all.length ? all[all.length - 1].id : '';
          if (d.revision !== last) throw Error('CONFLICT：成本設定已更新，請重新載入。');
          const row = { id: id_(), valueJson: safeJson_(core_().settings(d.cost)), createdAt: stamp_(), createdBy: email };
          append_('成本設定', [row]); return row.id;
        }
        case 'export': return { exportedAt: stamp_(), version: '1.0.0', tables: Object.fromEntries(Object.keys(SCHEMA_).map(n => [n, rows_(n)])) };
        default: throw Error('不支援的操作');
      }
    });
    return { ok: true, value };
  } catch (e) {
    const message = String(e.message || e);
    const known = /^(AUTH|ACCESS|SETUP|SCHEMA|CONFLICT|BUSY|NOT_FOUND|LIMIT)：/.test(message);
    // 不把 Google 內部錯誤、資料 ID 或堆疊回傳到用戶端。
    return { ok: false, error: known ? message : '操作失敗：' + (message.length < 180 && !/Exception|https?:|spreadsheet|Service/i.test(message) ? message : '請檢查授權、資料格式與試算表權限，並重新讀取確認；編輯內容已保留。') };
  }
}
