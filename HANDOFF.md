# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：f21f7b39c09bf87ad751225da38656d0a7900b95（本輪開始基準；最新以 Git log 為準）
- **Skill Version**：v1.0.0
- **Task Type**：IMPROVE
- **Local Path Hint**：18_AromaCraft-Studio
- **交接日期**：2026-10-13

---

## 目前狀態
完成商業級 UI/UX 完整修訂與 Firebase 家庭雲端雙軌同步整合。GitHub Pages 靜態前端保留，整合 Firebase Auth 登入與 Cloud Firestore，實現使用者與太太跨手機與不同電腦即時共用同一份配方與原料；本機離線模式無縫支援，資料無損移轉精靈完備。全套 44 項測試與檢查通過。

## 本輪目標
收斂專案定位為家庭精油分享會專用工具，兼顧電腦網頁版與手機版直覺操作；整合 Firebase 提供即時雲端共用，強化精油兒童安全防護，排除商業銷售雜訊，完成全套驗證並推送至 GitHub。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- **專案定位**：使用者與太太的家庭精油分享會工具，估算材料及包材大約成本；完全不需要工時、毛利或售價。
- **線上網站**：https://lianghao02.github.io/AromaCraft-Studio/
- **Firebase 專案**：`aromacraft-studio`，已配置 Web Config 與家庭白名單（`tpc0941101090@gmail.com` 與 `amethyst72@gmail.com`）。
- **資料安全與權限**：已建立 `firestore.rules` 生產級安全規則，嚴格限制非白名單登入者或未登入者無法讀寫，歷史配方快照防覆寫。
- **計算核心保留**：沿用 v1.1.0 的單位換算（g/mL）、每 mL 滴數換算、成品體積濃度、配方版本控制（v1, v2...）與歷史快照。

## 已完成 (Completed)
1. **商業級 UI/UX 升級與雙棲最佳化**：
   - 頂部新增四態同步膠囊指示燈（🟢 已同步 / 🟡 同步中 / ⚡ 離線暫存 / 🔴 同步失敗），即時反映連線與儲存狀態。
   - 桌機寬螢幕（≥1100px）左右雙欄齊頭飽滿排版，右側配方工作檯與大約成本面板黏滯吸頂（Sticky），徹底解決右側空白缺角。
   - 手機直式單欄（390px）深度適配：卡片熱區觸控放大，底部摘要欄增加毛玻璃半透明效果，主視圖預留安全間距，滾動到底部不遮擋任何按鈕。
2. **專案定位收斂與純粹化**：
   - 介面徹底移除工時、時薪、損耗率、預計售價、毛利率，成本結構固定為「材料費 ＋ 包材費 ＝ 大約總成本／每份成本」。
3. **精油兒童安全防護提醒**：
   - 精油濃度區塊顯目新增重要警語：「濃度低或未超過目標上限，不代表適合兒童使用」，杜絕虛假安全感。
4. **Firebase 雙軌同步與資料移轉**：
   - 在「設定與資料」->「資料與維護」新增家庭雲端登入與帳號狀態面板。
   - 登入時自動校驗家庭白名單，非名單成員自動拒絕並登出。
   - 實作本機資料移轉精靈：支援將本機 LocalStorage 原料與配方上傳至雲端，確認成功前絕不刪除本機舊資料，並提供永久歷史備份。
   - 離線時自動退回 LocalStorage 本機保存，絕不白屏或卡死。
5. **生產級安全規則**：
   - 撰寫 `firestore.rules` 與 `firebase.json`，鎖定 `/families/{familyId}/...` 白名單授權與資料型別防護。
6. **測試與建置**：
   - 執行 `npm run build` 生成最新 `index.html`。
   - 執行 `npm test`，44/44 項測試全數通過（44 pass, 0 fail）。
   - 執行 `npm run check`，語法、檔案引用與目錄檢查全數通過。

## 異動檔案 (Changed Files)
- `src/Index.html`：Header 同步狀態膠囊、兒童安全警語、Firebase 家庭登入與移轉精靈面板。
- `src/Styles.html`：同步膠囊微動態、兒童安全警示框、毛玻璃底部摘要與雙螢幕適配樣式。
- `tools/standalone-provider.js`：整合 Firebase Auth & Firestore 雙模態資料提供者、白名單驗證、狀態管理與本機移轉方法。
- `firestore.rules`：生產級 Cloud Firestore 安全規則。
- `firebase.json`：Firebase 專案規則設定。
- `index.html`：重新編譯生成之發布靜態頁。
- `CHANGELOG.md`：新增 v1.2.0 版本紀錄。
- `HANDOFF.md`：記錄本輪成果與驗證狀態。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 不引入重型前端框架（Vue/React），維持純原生 HTML/CSS/JS 極致效能與零建置相依性。
- 未覆寫或刪除本機瀏覽器原有 LocalStorage 資料，提供多重安全備份防線。
- 不捏造通用兒童安全濃度或各精油密度，維持嚴謹安全基準。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無阻斷性問題。
- **P2 (重要/待使用者體驗)**：請使用者與太太在手機與電腦上實際登入 Firebase 帳號體驗跨裝置即時同步。
- **P3 (改善建議/暫緩)**：未來若有大量配方歷史，可擴充依日期範圍篩選製作紀錄。

## 驗證結果 (Validation)
### 已執行測試與結果
1. `npm test`：44/44 項單元測試全數通過（核心計算、伺服器模擬、用戶端互動、目錄分批、單位換算、靜態持久化）。
2. `npm run check`：Code.gs、Core.html、Client.html、Catalog.html 語法通過，檔案引用與官網資料一致性通過。
3. `npm run build`：成功編譯生成 `index.html`（312,227 字元）。

### 尚未驗證項目
- 需由使用者與太太輸入真實 Google 帳號密碼進行最終真機連線驗收。

## Git 狀態
- 本輪修訂包含程式碼、規則、文件與靜態打包成品，準備執行提交與推送。

## 下一步建議動作 (Next Recommended Action)
1. 檢視最新 GitHub Pages 線上版本。
2. 前往「設定與資料」->「資料與維護」，使用 `tpc0941101090@gmail.com` 或 `amethyst72@gmail.com` 登入家庭雲端。
3. 點擊「匯入本機資料至家庭雲端」，即可將目前瀏覽器建立的原料與配方同步至雲端，太太在手機登入即可看見！