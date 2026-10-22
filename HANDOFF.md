# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：redesign-v2（由 main v1.6.5 `46fb453` 分出；main 未動，線上版不受影響）
- **Commit SHA**：本檔提交前基準為 687cfaa
- **Skill Version**：v1.0.0
- **Task Type**：IMPROVE / HANDOFF
- **Local Path Hint**：18_AromaCraft-Studio

---

## 目前狀態
進行中。介面重新設計已實作到可完整走完流程，npm test 105/105 通過；**尚未合併、尚未升版、尚未部署**，等使用者在手機實際操作後決定。

## 本輪目標
只重做畫面層與操作流程：三步驟一次一步、步驟 2 同列填用量、步驟 3 重排、配方庫與設定頁整理。計算、單位換算、同步、儲存、Firebase 規則、價格快照與已存資料格式沿用。設計規格見 `docs/重新設計規格.md`（含第 11 節實作狀態與差異）。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- main 為 v1.6.5，99/99 測試通過，線上版與 HEAD 一致（前輪交接）。
- 前輪未驗項目仍有效：雲端雙裝置自動套用新價格、真實 AI 執行「複製提示詞」流程、iPhone 觸控手感、已安裝 PWA 的更新與離線。

## 已完成 (Completed)
- 三步驟進度列：三個面板（`#workPanel`／`#materialPicker`／`#recipePanel`）的 `open` 狀態是唯一來源，`stepperSync()` 負責「同一時間只留一個」並推導進度；步驟 3 在無原料或有待填用量時鎖定。
- 步驟 2：已選原料在上、可同列填用量與單位；底部固定摘要（已選／待填／精油濃度／下一步）；桌機左原料右已選。移除 `#fillQuantities`、`#quantityStage`、`quantityMode`、`setQuantityMode`。
- 步驟 3：成本與濃度在上，基本資料、原料明細直列，進階項目收進「更多設定」；`#blank` 改為「重新開始」唯一入口，移除 `#btnResetRecipe`；`#productionFold` 只在製作中出現。
- 配方庫多欄；製作紀錄（`#logPanel`）移到配方庫下方；`#log` 只在製作中顯示。設定頁分區改為「原料與包材、安全資訊、資料與維護」。
- 製作中於步驟 2、3 顯示「記錄實際用量」「確認並完成製作」與說明。
- 新增 `tests/stepper.test.cjs`（6 項）；改寫 client／dom-contract 中與舊兩段式綁定的斷言。
- 與 v1.6.5 以同一組 Chromium 操作逐步比對：成本、濃度、儲存後載回、製作紀錄數字一致。

## 異動檔案 (Changed Files)
src/Index.html、src/Client.html、src/Styles.html、tests/client.test.cjs、tests/dom-contract.test.cjs、tests/stepper.test.cjs（新增）、package.json（test 清單）、CHANGELOG.md、docs/重新設計規格.md（新增）、HANDOFF.md。`index.html` 為建置產物，執行 `npm test` 會重生，提交前以 `git checkout -- index.html` 還原；合併發布時再 `npm run build`。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 未動 `Core.html`、`Code.gs`、同步／離線佇列、Firestore 規則、價格快照、Service Worker、已存資料格式。
- 「依目標調配」（`#planner`）仍在步驟 2：目標模式要在填量時看進度，搬到步驟 3 會失去回饋。
- `#toggleWork`（新增自製配方）元素保留但隱藏：既有測試要求其存在；功能由類別「其他」取代。
- 未改視覺風格（木質 Q 版）；只收斂邊框與陰影的使用。
- 未升版、未部署、未建立 PR。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無已知阻斷；合併前必須由使用者在 iPhone 實機走完整流程。
- **P2 (重要/當次)**：
  - 使用者實機操作後的調整意見。
  - 步驟 2 往下捲著加入原料時，已選列在上方看不到，只有底部項數增加；靠「下一步」跳到第一個空欄補救，順不順手待實機確認。
  - 合併前：升版號、更新 README（仍描述舊兩段式）、`npm run build`、決定是否先開預覽路徑給家人試用（Pages 目前只由 main 發布）。
- **P3 (改善建議/暫緩)**：
  - 設定頁尚未改為清單入口（維持分段按鈕）。
  - 配方庫未做「每個配方展開看紀錄」。
  - 平板步驟 2 已選列卡片偏大。
  - 前輪未驗項目（雙裝置同步、AI 更新價格流程、PWA 更新離線）。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test`：105/105 通過（原 99 + 新增 6）。
- Chromium 在 390／820／1366px 截圖逐階段核對；與 v1.6.5 同流程數字比對一致；主控台錯誤 0。
### 尚未驗證項目
- iPhone／Safari 觸控與版面；已安裝 PWA 更新與離線；Firebase 雙裝置同步；真實 AI 執行價格更新流程。
### 已知風險 (Known Risks)
- 面板開合邏輯沿用舊結構，`stepperSync` 以 `toggle` 事件與延後補開維持「一次一個」；DOM 替身測試不會觸發 `toggle`，此部分只在真實瀏覽器驗過。
- 已安裝 PWA 不會自動更新；合併後使用者需重開並確認版本。

## Git 狀態
- Commit：以 `git log` 為準
- Push：是（redesign-v2）
- Working Tree：提交後 Clean
- Branch：redesign-v2

## 下一步建議動作 (Next Recommended Action)
使用者在 iPhone 與桌機實際走一遍：選類別、加原料、填量、儲存、從配方庫開始製作、完成製作、看製作紀錄。依意見調整後，再決定升版、更新 README、合併與部署。

## 發布狀態 (Release Status)
不可發布（待進一步實測）
