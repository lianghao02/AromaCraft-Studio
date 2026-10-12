const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

const styles = fs.readFileSync(path.join(src, 'Styles.html'), 'utf8');
const core = fs.readFileSync(path.join(src, 'Core.html'), 'utf8');
const client = fs.readFileSync(path.join(src, 'Client.html'), 'utf8');
const indexTmpl = fs.readFileSync(path.join(src, 'Index.html'), 'utf8');

// 本機離線引擎：當在純靜態瀏覽器環境執行時接管 API 呼叫，支援完整的本機離線運作與持久化
const localProviderScript = `
<script>
/**
 * AromaCraft Studio - 本機離線獨立引擎 (Local Standalone Engine)
 * 支援無伺服器環境直接雙擊開啟、GitHub Pages 線上直接操作與 LocalStorage 持久化
 */
(() => {
  'use strict';
  // 若已在 Google Apps Script iframe 環境中，不進行攔截
  if (window.google?.script?.run && !window.AROMA_FORCE_LOCAL) {
    return;
  }

  const STORAGE_KEY = 'aromacraft_standalone_db_v1';
  const CONFIG_KEY = 'aromacraft_cloud_settings_v1';

  function getNow() {
    return new Date().toISOString();
  }

  function getCloudConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function setCloudConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  function initDefaultDB() {
    const now = getNow();
    const materials = [
      { id: 'm-soap-clear', name: '透明甘油皂基', category: '皂基', active: true, note: '植物性透明 MP 皂基，高保濕熔點約 50°C', revision: 1 },
      { id: 'm-soap-white', name: '白色甘油皂基', category: '皂基', active: true, note: '添加二氧化鈦之不透明白皂基', revision: 1 },
      { id: 'm-oil-sweet-almond', name: '甜杏仁油', category: '基底油', active: true, note: '質地輕盈溫和，富含維生素 E', revision: 1 },
      { id: 'm-oil-jojoba', name: '黃金荷荷芭油', category: '基底油', active: true, note: '冷壓植物蠟，親膚性極佳不易氧化變質', revision: 1 },
      { id: 'm-oil-shea', name: '未精製乳油木果脂', category: '基底油', active: true, note: '深層滋潤修護，常溫呈膏狀', revision: 1 },
      { id: 'm-oil-olive', name: '特級初榨橄欖油', category: '基底油', active: true, note: '滋潤度高，適合乾性修護', revision: 1 },
      { id: 'm-wax-bees', name: '天然黃蜂蠟', category: '蜂蠟', active: true, note: '純天然蜜蠟顆粒，熔點約 62-65°C', revision: 1 },
      { id: 'm-eo-lavender', name: '真正薰衣草精油', category: '精油', active: true, note: '高地安撫放鬆，產地法國', revision: 1 },
      { id: 'm-eo-orange', name: '甜橙精油', category: '精油', active: true, note: '壓榨法萃取，香氣甜美愉悅', revision: 1 },
      { id: 'm-eo-tea-tree', name: '澳洲茶樹精油', category: '精油', active: true, note: '淨化防護，澳洲互葉白千層', revision: 1 },
      { id: 'm-eo-eucalyptus', name: '藍膠尤加利精油', category: '精油', active: true, note: '清新通暢呼吸，澳洲原生', revision: 1 },
      { id: 'm-eo-peppermint', name: '歐薄荷精油', category: '精油', active: true, note: '清涼提神，含薄荷腦', revision: 1 }
    ];

    const prices = [
      { id: 'p-soap-clear', materialId: 'm-soap-clear', label: '1kg 大包裝批次', amount: 1000, unit: 'g', paid: 180, density: '', gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-soap-white', materialId: 'm-soap-white', label: '1kg 大包裝批次', amount: 1000, unit: 'g', paid: 190, density: '', gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-oil-sweet-almond', materialId: 'm-oil-sweet-almond', label: '500mL 瓶裝', amount: 500, unit: 'mL', paid: 420, density: 0.915, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-oil-jojoba', materialId: 'm-oil-jojoba', label: '250mL 滴管瓶', amount: 250, unit: 'mL', paid: 750, density: 0.865, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-oil-shea', materialId: 'm-oil-shea', label: '500g 罐裝', amount: 500, unit: 'g', paid: 380, density: '', gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-oil-olive', materialId: 'm-oil-olive', label: '1000mL 玻璃瓶', amount: 1000, unit: 'mL', paid: 350, density: 0.918, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-wax-bees', materialId: 'm-wax-bees', label: '500g 袋裝顆粒', amount: 500, unit: 'g', paid: 280, density: '', gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-eo-lavender', materialId: 'm-eo-lavender', label: '10mL 避光精油瓶', amount: 10, unit: 'mL', paid: 550, density: 0.885, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-eo-orange', materialId: 'm-eo-orange', label: '10mL 避光精油瓶', amount: 10, unit: 'mL', paid: 320, density: 0.845, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-eo-tea-tree', materialId: 'm-eo-tea-tree', label: '10mL 避光精油瓶', amount: 10, unit: 'mL', paid: 420, density: 0.895, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-eo-eucalyptus', materialId: 'm-eo-eucalyptus', label: '10mL 避光精油瓶', amount: 10, unit: 'mL', paid: 350, density: 0.915, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' },
      { id: 'p-eo-peppermint', materialId: 'm-eo-peppermint', label: '10mL 避光精油瓶', amount: 10, unit: 'mL', paid: 380, density: 0.900, gramsPerUnit: '', createdAt: now, createdBy: '本地預設' }
    ];

    const rules = [
      { id: 'r-soap-total', materialId: '*', type: '融製精油皂', maxPercent: '2.0', source: 'IFRA 51st 安全指引', status: '已核對', note: '洗卸皂類沖洗式產品精油建議上限 2%' },
      { id: 'r-balm-total', materialId: '*', type: '無水精油膏', maxPercent: '1.5', source: 'IFRA 51st 安全指引', status: '已核對', note: '留膚型油膏精油建議上限 1.5%' }
    ];

    const cost = { packaging: 12, minutes: 20, hourly: 180, other: 5, loss: 3, margin: 35, sale: 120 };

    const r1 = {
      id: 'demo-balm-01',
      version: 1,
      name: '經典甜橙修護潤唇膏',
      type: '無水精油膏',
      units: 5,
      notes: '蜂蠟與乳油木果脂隔水融化，降溫至約 55°C 加入甜橙精油，入模靜置凝固',
      baseId: '',
      cost: { packaging: 10, minutes: 25, hourly: 180, other: 5, loss: 3, margin: 40, sale: 80 },
      items: [
        { materialId: 'm-oil-shea', priceId: 'p-oil-shea', grams: 8 },
        { materialId: 'm-wax-bees', priceId: 'p-wax-bees', grams: 6 },
        { materialId: 'm-oil-sweet-almond', priceId: 'p-oil-sweet-almond', grams: 10 },
        { materialId: 'm-eo-orange', priceId: 'p-eo-orange', grams: 0.24 }
      ]
    };
    try {
      const snap1 = AromaCore.calculate(r1, materials, prices, rules);
      snap1.calculatedAt = now;
      r1.snapshot = snap1;
    } catch {}

    const r2 = {
      id: 'demo-soap-01',
      version: 1,
      name: '薰衣草舒緩修護香皂',
      type: '融製精油皂',
      units: 1,
      notes: '切丁融化甘油皂基，輕微攪拌避免氣泡，加入甜杏仁油與薰衣草精油後注入矽膠模',
      baseId: 'm-soap-clear',
      cost: { packaging: 12, minutes: 15, hourly: 180, other: 5, loss: 2, margin: 35, sale: 150 },
      items: [
        { materialId: 'm-soap-clear', priceId: 'p-soap-clear', grams: 95 },
        { materialId: 'm-oil-sweet-almond', priceId: 'p-oil-sweet-almond', grams: 3 },
        { materialId: 'm-eo-lavender', priceId: 'p-eo-lavender', grams: 1.5 }
      ]
    };
    try {
      const snap2 = AromaCore.calculate(r2, materials, prices, rules);
      snap2.calculatedAt = now;
      r2.snapshot = snap2;
    } catch {}

    const initialDB = {
      version: '1.1.0',
      materials,
      prices,
      rules,
      recipes: [r1, r2],
      recipeDetails: [
        ...r1.items.map(i => ({ recipeId: r1.id, version: 1, ...i })),
        ...r2.items.map(i => ({ recipeId: r2.id, version: 1, ...i }))
      ],
      logs: [],
      cost,
      costRevision: 'local-init',
      createdAt: now
    };

    saveDB(initialDB);
    return initialDB;
  }

  function loadDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('無法解析本機資料，將重新初始化：', e);
    }
    return initDefaultDB();
  }

  function saveDB(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('儲存至 LocalStorage 失敗：', e);
    }
  }

  // 純前端 API 處理器
  function handleLocalApi(request) {
    const action = request.action;
    const d = request.data || {};
    const db = loadDB();
    const now = getNow();

    switch (action) {
      case 'bootstrap': {
        const recipesSummary = db.recipes.map(r => ({
          id: r.id,
          version: r.version,
          name: r.name,
          type: r.type,
          createdAt: r.createdAt || now,
          safety: r.snapshot?.safety || '待驗證'
        }));
        return {
          materials: db.materials,
          prices: db.prices,
          rules: db.rules,
          recipes: recipesSummary,
          logs: db.logs || [],
          cost: db.cost,
          costRevision: db.costRevision || 'local-rev',
          serverTime: now,
          email: 'local-user@device',
          admin: true
        };
      }

      case 'loadRecipe': {
        const found = db.recipes.find(r => r.id === d.id && (!d.version || r.version === Number(d.version)));
        if (!found) throw Error('配方不存在');
        const details = (db.recipeDetails || []).filter(i => i.recipeId === found.id && Number(i.version) === found.version);
        return {
          id: found.id,
          version: found.version,
          name: found.name,
          type: found.type,
          units: found.units,
          notes: found.notes || '',
          baseId: found.baseId || '',
          cost: found.cost,
          items: details.map(i => ({ materialId: i.materialId, priceId: i.priceId, grams: Number(i.grams) })),
          snapshot: found.snapshot
        };
      }

      case 'saveRecipe': {
        const id = d.id || ('recipe-' + Date.now().toString(36));
        const prev = db.recipes.filter(r => r.id === id).sort((a, b) => b.version - a.version)[0];
        const version = prev ? prev.version + 1 : 1;
        const name = String(d.name || '未命名配方').trim();

        const snap = AromaCore.calculate({ ...d, name }, db.materials, db.prices, db.rules);
        snap.calculatedAt = now;

        const newRecipe = {
          id,
          version,
          name,
          type: d.type,
          units: snap.units,
          notes: d.notes || '',
          baseId: d.baseId || '',
          cost: snap.cost,
          snapshot: snap,
          createdAt: now,
          createdBy: '本機使用者'
        };

        db.recipes = db.recipes.filter(r => !(r.id === id && r.version === version));
        db.recipes.push(newRecipe);

        db.recipeDetails = (db.recipeDetails || []).filter(i => !(i.recipeId === id && Number(i.version) === version));
        snap.items.forEach(i => {
          db.recipeDetails.push({
            recipeId: id,
            version,
            materialId: i.materialId,
            grams: i.grams,
            priceId: i.priceId
          });
        });

        saveDB(db);
        return {
          id,
          version,
          name,
          type: d.type,
          units: snap.units,
          notes: d.notes || '',
          baseId: d.baseId || '',
          cost: snap.cost,
          items: snap.items.map(i => ({ materialId: i.materialId, priceId: i.priceId, grams: i.grams })),
          snapshot: snap
        };
      }

      case 'saveMaterial': {
        const id = d.id || ('mat-' + Date.now().toString(36));
        const idx = db.materials.findIndex(m => m.id === id);
        const revision = idx >= 0 ? (db.materials[idx].revision || 1) + 1 : 1;
        const mat = {
          id,
          name: String(d.name).trim(),
          category: d.category,
          active: d.active !== false,
          note: String(d.note || '').trim(),
          revision
        };
        if (idx >= 0) db.materials[idx] = mat;
        else db.materials.push(mat);
        saveDB(db);
        return mat;
      }

      case 'savePrice': {
        const id = 'price-' + Date.now().toString(36);
        const p = AromaCore.price({
          id,
          materialId: d.materialId,
          label: String(d.label || '').trim(),
          amount: d.amount,
          unit: d.unit,
          paid: d.paid,
          density: d.density,
          gramsPerUnit: d.gramsPerUnit,
          createdAt: now,
          createdBy: '本機使用者'
        });
        db.prices.push(p);
        saveDB(db);
        return p;
      }

      case 'saveLog': {
        const id = 'log-' + Date.now().toString(36);
        const r = db.recipes.find(r => r.id === d.recipeId && r.version === Number(d.version));
        if (!r) throw Error('查無對應配方版本');
        const units = Number(d.units);
        const s = JSON.parse(JSON.stringify(r.snapshot));
        s.units = units;
        s.gramsPerUnit = s.total / units;
        s.packaging = s.cost.packaging * units;
        s.batch = s.material + s.lossCost + s.packaging + s.labor + s.other;
        s.perUnit = s.batch / units;
        s.suggested = s.perUnit / (1 - s.cost.margin / 100);
        s.grossMargin = !s.cost.sale ? null : (s.cost.sale - s.perUnit) / s.cost.sale * 100;

        const logEntry = {
          id,
          recipeId: r.id,
          version: r.version,
          date: d.date,
          units,
          notes: d.notes || '',
          snapshot: s,
          createdAt: now,
          createdBy: '本機使用者'
        };
        db.logs = db.logs || [];
        db.logs.push(logEntry);
        saveDB(db);
        return logEntry;
      }

      case 'saveCost': {
        db.cost = AromaCore.settings(d.cost);
        db.costRevision = 'cost-' + Date.now().toString(36);
        saveDB(db);
        return db.costRevision;
      }

      case 'export': {
        return {
          exportedAt: now,
          version: '1.1.0',
          database: db
        };
      }

      default:
        throw Error('不支援的操作：' + action);
    }
  }

  // 掛載 window.google.script.run 虛擬執行器
  window.google = {
    script: {
      get run() {
        let successHandler = null;
        let failureHandler = null;
        const runner = {
          withSuccessHandler(fn) {
            successHandler = fn;
            return runner;
          },
          withFailureHandler(fn) {
            failureHandler = fn;
            return runner;
          },
          api(request) {
            setTimeout(() => {
              try {
                // 若使用者設定了遠端 Google Apps Script Web App URL，則嘗試轉發
                const cfg = getCloudConfig();
                if (cfg.webAppUrl && request.action !== 'bootstrap') {
                  fetch(cfg.webAppUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request)
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.ok) successHandler?.(data);
                      else failureHandler?.(Error(data.error || '遠端回應錯誤'));
                    })
                    .catch(() => {
                      // 遠端失敗時回退本機離線處理
                      try {
                        const val = handleLocalApi(request);
                        successHandler?.({ ok: true, value: val });
                      } catch (err) {
                        failureHandler?.(err);
                      }
                    });
                  return;
                }

                // 預設本機處理
                const val = handleLocalApi(request);
                successHandler?.({ ok: true, value: val });
              } catch (err) {
                console.error('[AromaCraft Local] 執行錯誤：', err);
                if (failureHandler) failureHandler(err);
                else if (successHandler) successHandler({ ok: false, error: err.message });
              }
            }, 10);
          }
        };
        return runner;
      }
    }
  };

  // 待 DOM 就緒後，將狀態與匯入備份按鈕注入介面
  window.addEventListener('DOMContentLoaded', () => {
    // 1. 調整連線狀態文字
    const connEl = document.getElementById('connection');
    if (connEl) {
      connEl.innerHTML = '🌿 <strong>瀏覽器本機離線模式</strong>（資料自動保存於 LocalStorage，免安裝開箱即用）';
    }

    // 2. 在頂部標籤列標記模式
    const badgeEl = document.querySelector('header .badge');
    if (badgeEl) {
      badgeEl.textContent = '🌿 離線開箱即用';
      badgeEl.title = '免安裝隨開隨用，資料安全存放於本機瀏覽器';
    }

    // 3. 在資料與備份區塊加入「匯入備份」與「雲端同步設定」按鈕
    const backupToolbar = document.querySelector('#viewManage details:last-of-type .toolbar');
    if (backupToolbar && !document.getElementById('importBackupBtn')) {
      // 匯入備份
      const importBtn = document.createElement('button');
      importBtn.id = 'importBackupBtn';
      importBtn.type = 'button';
      importBtn.textContent = '📥 匯入 JSON 備份';
      importBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = evt => {
            try {
              const parsed = JSON.parse(evt.target.result);
              const dataToSave = parsed.database || parsed;
              if (!dataToSave.materials || !dataToSave.prices) {
                throw Error('無效的備份檔案格式');
              }
              localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
              alert('備份資料已成功匯入！即將重新載入頁面…');
              window.location.reload();
            } catch (err) {
              alert('匯入失敗：' + err.message);
            }
          };
          reader.readAsText(file);
        };
        input.click();
      };
      backupToolbar.appendChild(importBtn);

      // 清空重設
      const resetBtn = document.createElement('button');
      resetBtn.id = 'resetLocalBtn';
      resetBtn.type = 'button';
      resetBtn.className = 'danger';
      resetBtn.textContent = '⚠️ 重設預設原料';
      resetBtn.onclick = () => {
        if (confirm('確定要清除所有本機修改並重設回預設原料庫嗎？建議先匯出備份。')) {
          localStorage.removeItem(STORAGE_KEY);
          alert('已重設回預設原料庫！');
          window.location.reload();
        }
      };
      backupToolbar.appendChild(resetBtn);
    }
  });
})();
</script>
`;

// 組裝 standalone index.html
let html = indexTmpl;
html = html.replace("<?!= include_('Styles'); ?>", () => styles);
html = html.replace("<?!= include_('Core'); ?>", () => core);
html = html.replace("<?!= include_('Client'); ?>", () => localProviderScript + '\n' + client);

// 將產出的 HTML 寫入根目錄 index.html
const outPath = path.join(root, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('✅ 成功產出單一免伺服器靜態網頁：' + outPath + ' (' + fs.statSync(outPath).size + ' bytes)');
