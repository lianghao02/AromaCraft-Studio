# HANDOFF

## 2026-10-22 模組化評估：先補測試與模組地圖，不拆 Client.html（已提交）
- 起因：使用者貼入跨專案的「有條件地拆、分批拆、先補測試再拆」建議，要我處理 18 這個專案的部分（19 由另一個對話負責，未碰；02、04 等其他專案不在本工作階段資料夾，未碰）。
- 查證：根目錄 `index.html`（2,895 行、444KB）是 `tools/build-standalone.cjs` 的**建置產物**，不可手改。專案本來就已分層：`Core`（共用計算）、`Code.gs`（伺服器）、`Client`（畫面）、`Catalog`（資料）、`Styles`、`Index`。手寫最大檔是 `src/Client.html`（845 行、83KB），內有 40 個頂層函式共用 19 個頂層狀態與 `data`／`recipe`／`dirty`／`busy` 等可變變數，可抽的純函式只有 `money`／`fmt`／`escape` 幾行；純邏輯早在 `Core.html`。
- 結論：**目前不拆 `Client.html`**（風險：載入順序與閉包狀態；好處：僅可讀性）。改做兩件零風險的事：
  1. 新增 `tests/dom-contract.test.cjs`：Client 引用的元素 id 必須存在於 `Index.html` 或由 Client 動態產生；8 個遺留選用元素（`modeFormulate`、`modeCost`、`gotoSaved`、`manageMaterialsBtn`、`quickNewMaterial`、`btnReturnFormulate`、`backToSelection`、`save`）全有 `if` 保護，列入白名單。已用暫時注入不存在的元素驗證會失敗、還原後通過。這是拆檔或搬移程式碼的前置保護，也補上「假 DOM 會自動造元素、掩蓋缺元素」的缺口（曾發生 `#blank`）。
  2. 新增 `docs/模組地圖.md`（檔案分工、組裝與新增來源檔的步驟、`Client.html` 內部分區、改動類型對應測試、已踩過的坑、拆分準則）；`AGENTS.md` 加一行指向它與「`index.html` 是建置產物」。
- 日後要拆時：依模組地圖的拆分準則（傳統 script 檔、一次搬一組、每次單獨提交、先跑 `dom-contract` 與 `client`）；建議接縫為製作流程、原料清單、官網價格自動套用與提示詞對話框。
- 驗證：`npm test` 98/98（新增 3 項）、`npm run check` 通過；未改任何程式行為，`index.html` 未變。已於 `bb29971` 提交測試與模組地圖，`3e63cae` 補充建置注意事項；本機追蹤的 `origin/main` 與 HEAD 一致。
- **本輪接手驗證（Codex，2026-10-22）**：重新執行 `npm test`，98/98 通過；另獨立執行 DOM 契約測試，3/3 通過。本輪只更正前述提交狀態，未修改產品程式、未新增發布。

## 2026-10-21 v1.6.4 發布：一鍵複製提示詞更新官網價格（Claude）
- **發布結果**：使用者明確授權後，提交 affb648 並推送 origin/main；Pages 工作流程 39609999325 成功（GitHub 佇列排隊約 4 分多鐘，非程式問題）。正式站 `index.html`、`sw.js` HTTP 200，與 HEAD 逐位元組一致（SHA-256 前綴 7840f8fd／4f0595e8），快取名稱 `aromacraft-v1.6.4`，頁尾 v1.6.4；`#showRefreshPrompt`、`#promptDialog`、`#catalogRefreshPrompt`、`autoApplyCatalog`、`catalogStatus` 皆在正式站。
- **升版使用新工具**：本次以 `node tools/bump-version.cjs` 升版（package.json、sw.js、src/Index.html、README 標題一次更新），實測正常；CHANGELOG 另手寫。
- **未驗證**：真實 AI（Codex、Antigravity）照提示詞完整跑一次；自動匯入在真實家庭雲端的雙裝置行為；真實 iPhone 觸控手感。Apps Script 仍 v1.3.2，若要同步獨立部署需另更新 `Code.gs`（含 `catalogStatus`）。
- 以下為本次功能說明，原標「未提交、未部署」已隨本次發布提交部署。

### 功能說明（原記錄）
- 使用者需求：有需要時，在專案頁面按按鈕跳出提示詞，複製後交給 AI 完成更新，自己不必再手動做事。
- 新增：`tools/refresh-catalog.cjs`（逐筆查官網公開介面 `api`，預設 dry run；`--write` 寫入；結束碼 2 失敗過多、3 有異常；只在批發價或容量改變時換 `at`）、`tools/bump-version.cjs`（package.json、sw.js 快取、`src/Index.html` 頁尾、README 標題）；`package.json` 新增 `refresh:catalog`、`bump` 指令。
- 設定頁：按鈕 `#showRefreshPrompt`、對話框 `#promptDialog`（`#promptText` 唯讀、`#copyPrompt` 用 `navigator.clipboard`，失敗退回 `execCommand('copy')`）；提示詞內嵌 `#catalogRefreshPrompt`（`<script type="text/plain">`）；`#catalogSnapshotInfo` 顯示快照日期。
- 自動套用：`Code.gs` 新增唯讀 `catalogStatus`（`api()` 開頭已驗證身分；家庭成員可讀、名單外拒絕）與 `catalogPlan_` 重構；`Client.html` 的 `autoApplyCatalog()` 在管理者載入資料後若有缺項就呼叫 `importCatalog`（寫入 outbox → 家庭雲端），每次載入只做一次，失敗靜默。**注意**：不可加 `busy` 條件，首次載入就在忙碌狀態內，會被擋掉。
- 實測：真實官網 dry run 112 筆全部成功、0 筆變動、0 異常、0 失敗（內建快照與官網現價一致，目前不需要更新）；另有 42 筆無官網介面，原樣保留。
- 測試：新增 `refresh-catalog`（10）、`bump-version`（3）、`catalog-auto`（2）、`prompt`（2）與 `units` 的 `catalogStatus` 測試；`npm test` 95/95、`npm run check` 通過；預覽實測按鈕→對話框→複製（寫入 1431 字、提示顯示）。`tests/prompt.test.cjs` 會檢查提示詞提到的指令、檔案、結束碼確實存在。
- 文件：`docs/官網價格更新.md`；`AGENTS.md` 新增邊界（快照只能用腳本更新）。
- 未驗證：真實 AI（Codex、Antigravity）照提示詞完整跑一次；自動匯入在真實家庭雲端的雙裝置行為；Apps Script 獨立部署需另更新 `Code.gs`。
- 未提交、未部署；版本號未動。

## 2026-10-21 v1.6.3 發布：官網價格匯入說明修正（Claude）
- **發布結果**：使用者明確授權後，提交 78505d1 並推送 origin/main；Pages 工作流程 39603832933 成功。正式站 `index.html`、`sw.js` HTTP 200，與 HEAD 逐位元組一致（SHA-256 前綴 112c2dcf／fa3f9f28），快取名稱 `aromacraft-v1.6.3`，頁尾 v1.6.3；舊字樣「載入官網精油至原料庫」已不存在，`snapshotDate`、「不會連線官網」皆在正式站。
- **另一工作階段的提交**：`e74fa43`（README 版本標示 v1.6.2）非本輪所做，內容無害；本輪已再更新為 v1.6.3。
- **未部署／未驗證**：Apps Script 仍 v1.3.2；真實 iPhone 觸控手感、家庭雙裝置同步、自動匯入的 V-6 是否同步到家庭雲端（見下）尚未驗證。
- 以下為本次修改說明，原標「未提交、未部署」已隨本次發布提交部署。
- 起因：使用者在手機按「載入官網精油至原料庫」看到「已新增 0 筆官網 mL 價格批次」，詢問是否真的連線官網。查證：**不連線**。匯入來源是打包的 `CatalogData` 快照（`data/young-living-tw.json`，154 筆，查價時間 UTC 2026-10-12 22:35，台灣時間 **2026-10-13**）；`standalone-provider.js` 第 37 行每次開網頁就自動執行一次 `importCatalog`，按鈕只補缺漏，故常回報 0 筆。只有精油圖片由瀏覽器向官網圖片網址載入。
- 更正前述發布紀錄：V-6 在靜態網頁版開啟時會自動補入本機資料，**不必**管理者手動按匯入（先前寫「需再按一次」不精確）。尚未查證的是：這次自動匯入的項目是否會同步到家庭雲端（`pushToFirestore` 以 outbox 重放寫入，匯入是否進 outbox 未確認）；若太太的裝置看不到 V-6，再查此處。
- 修改：`src/Catalog.html` 新增 `AromaCatalog.snapshotDate`（台灣時間，失敗退回字串日期）；`src/Client.html` 提示分兩種（0 筆／N 筆）並帶快照日期；`src/Index.html` 按鈕改「載入內建官網價格」與說明、目錄區標示內建快照；文件同步。
- 測試：`catalog.test.cjs` 斷言快照日期 2026-10-13，`client.test.cjs` 靜態檢查按鈕文字與說明；`npm test` 77/77、`npm run check` 通過；預覽實按確認提示。
- 價格更新方式（待辦）：目前只能重新產生快照再部署（`npm run build:catalog`），沒有手機端更新價格的功能。

## 2026-10-21 v1.6.2 發布：原料卡精簡、手感與操作邏輯（Claude）
- **發布結果**：使用者明確授權後，提交 5cb6d8d 並推送 origin/main；Pages 工作流程 39600471580 成功。正式站 `index.html`、`sw.js` HTTP 200，與 HEAD 逐位元組一致（SHA-256 前綴 0809174d／7f5a3e99），快取名稱 `aromacraft-v1.6.2`，頁尾 v1.6.2；新功能標記（`#recipeTypeSelect`、`#saveHint`、`data-create`、`@media(hover:hover)`、`kb-open`、`touch-action:manipulation`、`.mat-drop`、`enterkeyhint`）皆在正式站。
- **內容**：原料卡精簡（平均高度約 182→97px，點選不跳動）、價格統一為每 mL／每 g、手感（hover、觸控、全選、Enter 跳欄、長按連加、鍵盤收列、44px 觸控區）、操作邏輯（搜尋空狀態新增並加入、排序、術語、單一主按鈕、類型與整批／每份移到步驟 3、儲存說明）。細節見下方「發布後追加」與「手感與操作邏輯第三批」。
- **未驗證／未部署**：真實 iPhone Safari 觸控手感（長按、鍵盤收列、hover 黏住只在桌機模擬測過）與家庭雙裝置同步未驗收；Apps Script 仍 v1.3.2；V-6 需管理者在正式站再按一次「載入官網精油至原料庫」。
- **待辦候選**：十聖套組與缺目錄品項（安息香、岩薔薇、桂皮）；46／154 筆價格待核對。
- 以下「發布後追加」「手感與操作邏輯第三批」原標「未提交、未部署」，已隨本次發布提交部署。

## 2026-10-21 v1.6.1 發布：濃度估算與調配體感（Claude）
- **發布結果**：使用者明確授權後，提交 e9b0d93 並推送 origin/main；Pages 工作流程 39595163793 成功。正式站 `index.html`、`sw.js` HTTP 200，內容與 HEAD 逐位元組一致（SHA-256 前綴 7849589e／4eb746d8），快取名稱 `aromacraft-v1.6.1`，頁尾 v1.6.1；新功能標記（`#blank`、`#plannerAdvanced`、`.qty-stepper`、`.recipe-settings`、重量估算）皆在正式站。
- **未部署**：Apps Script 仍 v1.3.2；V-6 需管理者在正式站「設定與資料」再按一次「載入官網精油至原料庫」才會出現；真實 iPhone Safari 與家庭雙裝置同步未驗收。
- 前一輪 2D Q 版收尾（110ac65）其實已部署（工作流程 39531531407 成功），下方「沒有推送」的舊記載已過期。

### 發布後追加（v1.6.1 之後，未提交、未部署）
- 使用者以實機截圖回報原料卡太大，並指出「點擊勾選」是贅字、價格標示不一致。已改：手機原料卡精簡（平均高度約 182→97px，390px 寬量測；`src/Styles.html` 末段 `@media(max-width:767px)` 區塊）；未選取時隱藏狀態列並以右下角 20px 圓形「＋」提示（`aria-label` 仍保留「點擊勾選原料」）；卡片價格統一為每 mL／每 g 單價（`AromaCore.price(...).perUnit`，原生基準），精油另列每滴約價，整瓶價放 `title`，管理模式（`data-manage`）仍顯示整瓶資料；價格標籤與金額以 `.nw` 不拆行。
- 手感與操作邏輯第三批（使用者要求「體感操作」與「操作邏輯」都要改，未提交、未部署）：
  - 手感（`src/Styles.html`、`src/Client.html`）：`:hover` 規則全部包進 `@media(hover:hover)`（16 條，含 `:focus` 者不動）；`touch-action:manipulation`、關閉預設點擊底色；原料卡右下角圓形提示（未選「＋」、已選實心「✓」），不再加狀態列，點選時卡片高度不變（實測 89→89px，下方位移 33→1px）；數字欄聚焦全選、Enter 跳下一欄（最後一欄觸發確認）、`enterkeyhint=next`；「＋／－」長按 450ms 後每 90ms 連加，放開後的 click 不重複；鍵盤彈出時 `body.kb-open` 收起 `#summaryBar`、`#primaryNav`；通知 ✕ 以 `::before` 擴大到 44px、`#toggleWork`／`#blank` 最小 44px。
  - 邏輯：搜尋空狀態 `[data-create]` 按鈕（`editMaterial(undefined, cb, {prefillName})`，儲存後 `addSelection` 自動加入；抽出共用函式 `addSelection`）；排序 `rank`（自己新增 0、`yl-` 目錄 1、「（試算）」範例 2）；「目前精油比例」統一為「精油濃度」；`#fillQuantities` 在填量模式去掉 `primary`；`#recipeTypeSelect`（未儲存配方可改類型並保留原料，已儲存者停用）與 `#sizingMode` 移到 `.recipe-settings`，進階摘要只剩調配方式；`#saveHint` 說明更新會取代、未儲存時隱藏 `#saveAsNew`。
  - 測試：更新 3 處舊斷言（進階摘要、兩處「已在配方」改為先搜尋，因範例品被排到最後），新增靜態檢查（設定區元素、術語、`#saveHint`）；`npm test` 77/77、`npm run check` 通過；預覽 390px 實測空狀態新增→自動加入、長按連加（0.9 秒→5）、Enter 跳欄、鍵盤收列、類型切換保留 3 項、儲存後說明與另存按鈕切換皆正常。
  - 限制：長按、鍵盤收列、hover 黏住是在桌機瀏覽器模擬（合成事件），**真實 iPhone 觸控手感未驗**。
- 量測注意：卡片有 `transition: all .12s`，預覽面板在背景時動畫不前進，量測要先把 transition 關掉，否則量到動畫中途值。
- 驗證：`npm test` 77/77、`npm run check` 通過；預覽 320／390／430px 實測兩欄、無橫向溢出。尚未在實機再驗。

### 本輪修改明細（原「未提交」記錄）
- 起因：使用者覺得操作與邏輯怪。以「按摩膏（馬鬱蘭／薰衣草／薄荷／迷迭香滴數＋蜂蠟 g＋基底油 mL）」實測，濃度顯示「資料不足」，且提示叫使用者補四種精油資料，真因是蜂蠟缺密度（蜂蠟只有 g／kg 單位，無法改 mL）。
- 本輪修改（`src/Core.html`、`src/Client.html`、`tests/units.test.cjs`，已重建 `index.html`）：
  - `automaticConcentration`：缺資料時改列「缺項最少」的基準（平手沿用配方宣告基準）；issue 新增 `kind`（density／drops／other），提示改為「補密度（g/mL）」等具體動作。
  - 缺密度的按鈕改為「補 X 的密度」，直接開原料編輯並展開密度區。
  - 原料編輯新增「套用常見估算值（標記為估算）」：蜂蠟 0.96、基底油 0.92 g/mL，來源註明一般常見值，且勾選「估算」；只在使用者按下時套用，不自動帶入，維持「不捏造密度」。
  - 成本明細新增「單價為 $0、成本未計入」提醒與補價格按鈕（0 元仍有效，不阻擋）。
- 驗證：`npm test` 77/77（新增按摩膏回歸測試）、`npm run check` 通過；本機預覽實測：補蜂蠟密度後顯示「約 1.95%・容量估算」，與手算 0.6÷(25＋5÷0.96＋0.6) 一致；375px 無橫向溢出。
- 同日追加（介面三項，使用者已同意繼續改）：
  - 換類別不再清空：未儲存的配方（`!recipe.id`、非實際製作）換製作類別時保留已選原料與用量，只更新類別、預設名稱與計算基準，不再跳「放棄並切換」確認；已儲存配方仍走原確認流程。要全新開始，請用製作類別面板內新增的「清空目前內容，重新開始」（`#blank`，會先確認）。〔更正：原先誤以為「＋ 新增自製配方」可重新開始，實際它只是開關類別面板；測試環境會自動造出任意 id，所以舊測試沒抓到真實頁面缺 `#blank`，已補按鈕並在 `client.test.cjs` 加靜態斷言檢查 `#blank`、`#plannerAdvanced`、`#plannerSummary`、`#toggleWork` 各出現一次。〕
  - 單位鎖死改為可解鎖：蜂蠟、基底油缺密度時，用量列出現「要改用 mL／g 填寫？補密度」，開原料編輯並展開密度區（可套用常見估算值）。補完密度後單位選項自動多出 mL／g。
  - 「調配方式」「用量基準」收進 `#plannerAdvanced`「進階」摺疊，摘要顯示目前設定（預設：自由填量・整批用量）；選依目標調配時自動展開。元件 id 不變。
  - 測試：`tests/client.test.cjs` 舊規則（換類別必跳確認並清空）改為新規則，另三處「用換類別當重新開始」改用「新增自製配方」按鈕；新增進階摘要與換類別保留原料斷言。`npm test` 77/77、`npm run check` 通過；預覽實測三項（桌機與 375px）正常。
- 同日再追加（使用者明確同意，推翻先前「不推測密度」邊界）：算濃度時，精油與基底油缺密度改用估算密度（精油 0.9、基底油 0.92 g/mL，常數 `DEFAULT_OIL_DENSITY`／`DEFAULT_BASE_OIL_DENSITY` 在 `src/Core.html`），結果標示「重量估算」與「含估算密度」。
  - 優先序：實秤重量 > 原料設定密度 > 估算密度；若某基準不需估算即可精確算出（例如全為滴與 mL），不改用估算的基準。
  - 蜂蠟、皂基維持 g，不需密度；上一輪的「補蜂蠟密度」入口與蜂蠟常見估算值已移除，基底油的「改用 g 填寫？補密度」入口保留。
  - 影響範圍刻意限制在 `automaticConcentration`：成本換算與安全規則判定不使用估算密度（安全規則判定本來就用另一套各項 percent，混合單位時不套用重量限制）。`Code.gs` 共用同一份 Core，後端重算結果一致。
  - 按摩膏案例（4/4/2/2 滴＋蜂蠟 5 g＋基底油 25 mL）實測顯示約 1.89%・重量估算，手算 0.54÷28.54 一致；成本仍 NT$43.73。
  - 舊測試中「缺密度即算不出濃度」的斷言（`units`、`planning` 共 7 處）已改為新規則；`npm test` 77/77、`npm run check` 通過。文件已同步：README、IMPLEMENTATION_PLAN、docs/資料與安全.md。
- 體感改善第一批（使用者指示：調配正常後改 UX，維持 Q 版 2D 風格，不重建介面）：
  - 用量列加「－／＋」步進按鈕（`.qty-stepper`／`.step-btn`，44px 觸控目標；滴／mL／g 每次 1，kg／L 每次 0.1，最低 0）；提示字縮為「用量」，窄螢幕（≤480px）單位欄縮為 84px，輸入框約 90px。
  - 底部摘要列在手機也顯示「精油濃度 約 X%（估算）」（原本手機直接隱藏該行）；長版「配方投入量」改放 tooltip 與成本區。
  - 精油原料卡新增「約 NT$X／滴」（採購價 ÷ 容量 ÷ 每 mL 滴數，預設 20）。
  - 測試：`client.test.cjs` 新增步進按鈕渲染與加減（含不低於 0）斷言；`npm test` 77/77、`npm run check` 通過；預覽實測手機 375px、桌機 1366px 皆無橫向溢出。
- 體感改善第二批：
  - 步驟 3 順序改為「濃度 → 成本 → 名稱、份數與包材（`.recipe-settings`）→ 註記」，先看結果；元件 id 不變。
  - 原料搜尋別名：原字串找不到時，自動改用去掉「甜／純正／真正／正宗／頂級」前綴的字串，或別名表（胡椒薄荷、歐薄荷→薄荷）再找，並在筆數後註明「已改用「X」搜尋」；原字串有結果時不改用，避免雜訊。刻意不把「桂皮」對應到「肉桂」（Cassia 與肉桂不同種，需使用者自行確認）。
  - V-6 綜合純植物油（236 mL、944 mL 補充裝）納入官網匯入，類別為「基底油」（`importCatalog_` 以名稱前綴 `V-6` 判定）。匯入仍是管理者手動按「載入官網精油至原料庫」、只補沒有的 id，不動既有家庭資料；**正式站需管理者再按一次匯入才會出現 V-6**。`standalone.test.cjs` 的匯入筆數由 94 改為 96（94 筆精油＋2 筆 V-6）。
  - 驗證：`npm test` 77/77、`npm run check` 通過；預覽實測手機 375px 與 1366px 無橫向溢出；V-6 實價參與成本（25 mL×$4.03＋4 滴馬鬱蘭＝$119.97）。
  - 尚未做：十聖套組與缺目錄品項（安息香、岩薔薇、桂皮）；46／154 筆價格待核對；Q 版元件狀態（空白、錯誤、過長文字）逐一檢查；Apps Script 未更新（`Code.gs` 匯入邏輯已改，獨立部署需另更新）。
- 仍未做：目錄缺安息香、岩薔薇、桂皮，十聖套組無價格，46／154 筆價格待核對；搜尋不支援別名（甜馬鬱蘭）。
- 已提交並部署，見上方發布結果；版本升為 v1.6.1。

## 2026-10-20 2D Q 版收尾（Claude）
- 前一輪（其他 Agent，已結束）未提交的 Q 版樣式本輪已驗收並一併提交。範圍：`src/Styles.html` 與重建的 `index.html`，差異約 +127／−109 行。
- 確認 `npm run build` 重建結果與手改版本一致，只有種子資料的時間戳與 UUID 不同。
- 本輪修正：
  - `--line` 改為 `#a8834f`，外框對比達 3:1 以上。
  - `--line-strong`／`--wood-border` 改為 `#a0773f`，`--wood-shadow` 改為 `#7a5a2e`，`--muted` 改為 `#4c5d51`。
  - `.works .work`、`.summary`、`.panel-save-card`、`#workPanel` 的外框改用 `var(--line)`。
  - 以上修改後已重建 `index.html`。
- 驗證：
  - `npm test` 76/76 通過，`npm run check` 通過。
  - 以 `tools/preview.cjs`（本機示範資料）實測電腦與手機兩種尺寸：
    - 選擇製作類別、加入原料都正常。
    - 三個分頁的文字對比掃描零項不合格。
- 未做：
  - 沒有部署 GitHub Pages／Google Apps Script、沒有推送。
  - 家庭同步與 Google 部署未驗收（本機驗證不能冒充真實部署）。

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：d3eec5634d19150ee100bc74a7fd413b0259e8a7（v1.6.0功能發布提交）
- **Skill Version**：lianghao-development v1.0.0
- **Task Type**：RELEASE / HANDOFF
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.6.0問答規格完整整合完成，原目錄與跨路徑副本各通過76項測試與語法檢查。內建瀏覽器功能實測通過。v1.6.0已提交、推送並部署至GitHub Pages，正式HTML與Service Worker核對一致；Apps Script仍v1.3.2。本機完整預覽：http://127.0.0.1:18861/ （示範資料只在記憶體，不是家庭資料）。

## 本輪目標
使用者已明確授權提交與部署v1.6.0。依逐項問答決策完成全部功能後一併驗收，規格單一來源為IMPLEMENTATION_PLAN.md的v1.6.0區段。

## 基準與已確認事實 (Baseline & Confirmed Facts)
開始為main、88d732a、Clean；原有69項測試。使用者明確選擇雙模式、自行分配滴數、超標仍可存、更新同一配方、製作紀錄獨立、最新價格、草稿僅本機、整批與每份並存、單種整套包材、永久移除、最後雲端儲存者為準、離線可存與實際用量可調整。舊專案邊界依當次明確需求更新，不保留與新規格矛盾的資料庫／刪除限制。

## 已完成 (Completed)
- 依使用者此次明確授權，提交d3eec56並推送origin/main；Pages工作流程38747137639成功。正式index.html與sw.js均HTTP200且SHA-256與本機一致。
- 自由填量／依目標調配、目標總量含精油、選擇基底補足、手動整滴與分配進度；超標提醒不擋保存。切回自由模式保留已補足的實量；自訂滴數換算不誤用20滴目標。
- 整批分裝／每份放大，計算副本只放大一次，保存輸入基準。密度、來源、估算標記與精油滴數集中管理；不捏造密度。
- 包材清單、每份單一整套包材或不用；配方與列表以最新原料／包材價格試算。缺價格顯示已知成本，0元有效。
- 更新同一配方、另存新配方、精簡分類卡片；確認後永久刪除配方與明細，保留獨立製作快照與防復活標記。
- 開始製作帶入整批實量並轉自由填量，不自動補足；完成製作才建立含實際用量、名稱、濃度、成本、日期與註記的快照，原配方不變。
- 離線操作佇列持久保存，連線時合併最新雲端再版本交易重試；同配方最後上傳者為準，其他配方與製作紀錄保留。實際製作快照重送不依同步時價格重算。草稿不進佇列，也不阻擋雲端更新。

## 異動檔案 (Changed Files)
AGENTS.md、IMPLEMENTATION_PLAN.md、HANDOFF.md、README.md、CHANGELOG.md、package.json、sw.js、index.html；src的Core、Code、Client、Index、Styles；tools/standalone-provider.js；tests/client、server、cloud及新增planning.test.cjs。未新增相依套件。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
未存取或遷移真實家庭資料，未改登入與Firestore安全規則，未部署Apps Script。Google保留八張表，新密度說明欄位只追加；新包材／配方設定使用既有系統設定表。內部版本仍追加，不覆寫歷史快照；配方永久刪除只由介面確認後執行。既有舊版本機整份移轉仍需使用者明確操作，不自動覆蓋雲端。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無已知阻斷性程式問題。
- **P2 (重要/當次)**：真實家庭雙裝置與iPhone Safari原生鍵盤／實機驗收未執行；不能以替身或桌機手機尺寸宣稱通過。
- **P3 (改善建議/暫緩)**：截圖擷取API失敗，未保存視覺截圖；不為此安裝其他瀏覽器框架。

## 驗證結果 (Validation)
### 已執行測試與結果
- 原目錄與未含.git/node_modules、含中文空白的新路徑，各76測試通過、0失敗。新增目標／超標、每份放大、防重複放大、密度／缺價／零元、最新包材與價格、刪除保留紀錄、實際用量快照、雙裝置合併、離線重啟及刪除防復活情境。
- 八種寬度320／375／390／430／768／1024／1366／1920的DOM替身案例擴充完整目標→每份放大→保存→實際改量製作，原配方保持原量。
- 內建瀏覽器實測30mL、1%、6滴顯示1.00%，保存後卡片有摘要、日期、成本與製作入口；實際改7滴後成本97.30、原配方仍6滴與83.40。390px的scrollWidth375未超出viewport390，用量卡右界341.65位於畫面內；無console error／warn。手機尺寸不代表iPhone Safari。
- 語法、部署引用、官網資料一致性、git diff --check及新增差異敏感值／私人路徑檢查通過。
### 尚未驗證項目
真實Firebase家庭帳號雙裝置、實機Safari與視覺截圖。本輪FireStore讀寫使用SDK替身，不是正式雲端驗收。
### 已知風險 (Known Risks)
密度與20滴／mL可能為估算，缺資料不顯示百分比。相同配方最後成功雲端寫入者覆蓋較早修改，這是使用者選定規則。永久刪除後無介面還原，既有不可變雲端備份未做資料清除服務。

## Git 狀態
- Commit：d3eec5634d19150ee100bc74a7fd413b0259e8a7
- Push：已推送origin/main
- Working Tree：功能提交後Clean；本檔發布結果另以文件提交保存
- Branch：main

## 下一步建議動作 (Next Recommended Action)
手機重新整理正式網站，確認頁尾v1.6.0；不要清除瀏覽器資料。驗收雙模式調配、實際製作與家庭雙裝置同步。Google獨立部署若需更新，另更新src及追加欄位，本輪不宣稱已更新Apps Script。

## 發布狀態 (Release Status)
v1.6.0已發布：https://lianghao02.github.io/AromaCraft-Studio/ 。Pages工作流程38747137639成功；正式HTML及Service Worker逐位元組一致。Apps Script仍v1.3.2；本輪未以測試操作寫入真實家庭資料。
