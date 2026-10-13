# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：a73f7ad7e46b9449fd9995ff2c320e7509bc50f6
- **Skill Version**：v1.0.0
- **Task Type**：HANDOFF
- **Local Path Hint**：18_AromaCraft-Studio
- **交接日期**：2026-10-13

---

## 目前狀態
v1.1.0 預覽版已發布，線上網站可操作。使用者決定先發布，回家再調整。接手應延續既有成果，不重新設計或自行切換後端。

## 本輪目標
整理目前版本、資料保存位置、驗證結果與接續工作，交給 Antigravity 或下一位 Agent。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 專案定位：家庭精油分享會，估算材料及包材成本；不是商業採購或銷售系統。
- 線上網站：https://lianghao02.github.io/AromaCraft-Studio/
- 發行版：https://github.com/lianghao02/AromaCraft-Studio/releases/tag/v1.1.0
- 已整合 Antigravity 遠端提交 8ad8ffa 的靜態網站發布功能，保留本輪 UI 與計算成果。
- 目前沒有 Firebase。GitHub Pages 沒有雲端資料後台，資料存在目前瀏覽器 LocalStorage。
- 「設定與資料」是產品、價格與包材的管理入口。不同裝置不自動同步；移轉使用匯出／匯入備份。
- 原本 Apps Script／Google Sheets 模式仍保留，但正式 Google 部署未更新；勿把兩種模式的資料混為一談。
- 原料與精油價格為官網批發估算或使用者輸入，不代表實際訂單金額。

## 已完成 (Completed)
- 流程：選作品 → 挑原料 → 確認配方與成本。桌機左原料、右配方與成本；手機分步收納。
- 五種空白作品：按摩油、無水精油膏、融製精油皂、日常清潔液、水垢清潔。未捏造配方比例。
- 精油單方／複方篩選、名稱精簡、容量與整瓶價格；94 筆官網可匯入規格及圖片。示範庫合計 95 筆精油包含 1 筆示範。
- 原料設定簡化為名稱、類別、容量／單位、價格。工作時長、毛利、預計售價不放主流程。
- g／mL 分開計價、製作時設定滴數換算、歷史版本與快照保存、配方編輯及移除／恢復。
- 配方區顯示體積濃度、成品總容量與自訂目標上限。各瓶精油分別換成 mL 後加總，用量視窗顯示所選瓶最多與剩餘整滴。
- 缺換算資料不猜測，超標拒絕套用／保存；未超過自訂目標不代表兒童可用。
- 靜態版沿用目前服務與計算規則，保存滴數及濃度設定，支援備份匯入。舊離線資料保留原鍵並遷移，舊通用安全預設改為待核對。

## 異動檔案 (Changed Files)
- 已發布成果：src/、data/、tools/、tests/、docs/、index.html、package.json、README.md、CHANGELOG.md、.github/workflows/pages.yml。
- 本次交接僅更新 HANDOFF.md，尚未提交或推送這次文件修改。
- src/Core.html：共用數學規則；src/Client.html、Index.html、Styles.html：介面；src/Code.gs：Google API。
- tools/build-standalone.cjs、standalone-provider.js：靜態版組裝及瀏覽器保存。修改來源後執行 npm run build，勿只修改生成的 index.html。
- tools/catalog-runtime.js 或目錄資料變動後，執行 npm run build:catalog，再建置靜態版。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 未更新真實 Google 部署、家庭資料或共享權限。
- 未建立 Firebase、登入系統或跨裝置雲端同步；需要使用者明確指定才實作。
- 不加入通用兒童安全濃度、猜測密度或統一滴數係數。
- 不重建另一套介面，不重引入工時、毛利、售價或專業採購表單。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：線上預覽發布無已知阻斷。若要更新正式 Google，仍需可操作的 Apps Script 登入入口或部署憑證。
- **P2 (重要/當次)**：手機／Safari 與桌機實際視覺、互動驗收；不得將 DOM 替身測試當作瀏覽器驗收。
- **P3 (改善建議/暫緩)**：等使用者回家後的介面回饋。是否需要跨裝置同步及採用何種後端尚未決定。

## 驗證結果 (Validation)
### 已執行測試與結果
- 發布輪 npm test：44／44 通過；包含單位、濃度、版本、靜態版重新開啟後保存讀回及超標拒絕。
- npm run check：語法、資訊清單、檔案引用與官網資料一致性通過。
- git diff --check、公開內容敏感資料掃描通過。
- 複製至另一磁碟中文空白路徑後，本機 HTTP 200，98 筆原料讀回成功。
- GitHub Pages 工作流程 38373454394 成功；線上 HTTP 200，讀回確認濃度欄位、瀏覽器保存引擎及 v1.1.0。
- 本次僅文件交接，沒有重跑產品測試；開始時 main 與 origin/main 對齊且工作目錄乾淨。
### 尚未驗證項目
- Browser 工具回報沒有可操作表面，未完成手機／Safari 視覺驗收。
- 新版正式 Google 寫入與家庭跨帳號驗收未完成。
### 已知風險 (Known Risks)
- GitHub Pages 資料只在目前瀏覽器；清除瀏覽器資料可能遺失，換裝置前請匯出備份。
- 本機 Node 預覽的示範資料存在記憶體，重啟會重設；與 GitHub Pages 的持久保存不同。
- 體積濃度依可換算資料或手填成品容量估算，不能直接判定兒童適用。

## Git 狀態
- Commit：a73f7ad7e46b9449fd9995ff2c320e7509bc50f6
- Push：已發布程式碼是；本次 HANDOFF.md 修改否
- Working Tree：Modified（僅 HANDOFF.md）
- Branch：main

## 下一步建議動作 (Next Recommended Action)
1. 先讀專案 AGENTS.md、本檔及目前 Git 狀態，確認本次未提交修改只有交接文件。
2. 依使用者的新回饋增量調整；不要自行遷移到 Firebase。
3. 需要 Google 模式時更新八份 src，執行 migrateUnits／升級單位欄位，追加 concentrationJson 等欄位，再以新版本更新既有部署並驗證真實保存。
4. 後續發布前建置 index.html，確認頁面、測試與下載包版本一致。

## 發布狀態 (Release Status)
GitHub Pages 與 v1.1.0 預覽發行版已發布；正式 Apps Script 尚未更新。使用者目前要求保留此版本，回家後再調整。