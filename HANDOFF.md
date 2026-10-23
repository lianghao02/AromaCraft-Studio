# HANDOFF

## 2026-10-23：v1.7.1 原料步驟捲動與下一個產品

- Repository Full Name：lianghao02/AromaCraft-Studio
- Branch：codex/scroll-usability
- Commit SHA：61c3c68（修訂基準；本次修改前基準）
- Skill Version：v1.0.0
- Task Type：FIX / IMPROVE
- 選取／取消原料與復原時維持原料卡的畫面位置，不依賴瀏覽器捲動錨定；已選用量清單重繪保留內部捲動位置。
- 待填欄位會展開用量區、聚焦並置中；手機欄位聚焦／鍵盤開啟時隱藏浮動摘要，避免遮住輸入與錯誤。
- 搜尋列改為隨行；手機／平板用量區限制高度並可收合，底部提供「查看／填寫用量」。桌機維持左右並排；跨 1024px 切換時同步展開狀態。
- 復原移除放在隨行摘要；從確認頁返回原料步驟會恢復離開前的位置。
- 僅修改 src/Client.html、src/Index.html、src/Styles.html、tests/stepper.test.cjs 與重建 index.html；計算、價格、同步與權限來源未改。
- 新增「製作另一個產品」入口：從更多設定移至確認頁儲存區，回到類別步驟並清空本次原料、待填狀態與待送出要求；有未儲存修改或未完成實際製作時先確認，取消保留原內容。已存配方與製作紀錄不刪除。
- Chromium 390／1366px 實際儲存後重新開始、選不同類別、取消／確認捨棄草稿通過；已儲存配方於操作前後讀回一致。
- 驗證：109 項測試通過（15 個測試檔）；npm test、npm run check、npm run build、git diff --check 通過。
- Chromium：390、820、1366px；停用原生 overflow-anchor 後連選 6 項，卡片位移均小於 3px；搜尋、復原、收合／展開、漏填欄位命中檢查與手機桌機切換通過；返回捲動位置分別 1649→1649、1470→1470、914→914；pageerror 為 0。使用記憶體示範資料，不連線家庭資料。
- 尚未驗證：iPhone Safari 原生鍵盤、真實家庭帳號與正式 PWA。使用者已授權提交、推送與部署；本輪升版 v1.7.1，實際 commit、部署與線上核對結果以 Git 和部署回報為準。下方 v1.7.0 發布資訊為前輪紀錄。


## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：7cd76a2（v1.7.0 合併提交）
- **Skill Version**：v1.0.0
- **Task Type**：RELEASE / HANDOFF
- **Local Path Hint**：18_AromaCraft-Studio

---

## 目前狀態
v1.7.0 已由 redesign-v2 合併至 main 並推送；GitHub Pages 部署核對結果見「發布狀態」。使用者已明確選擇直接合併發布（未先走預覽）。

## 本輪目標
重新設計操作介面（畫面層與流程），計算、單位換算、Firebase 同步、Firestore 規則、價格快照與已存資料格式沿用。設計規格與實作差異見 `docs/重新設計規格.md`。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 前一版為 v1.6.5（`46fb453`／文件 `ada0793`），99/99 測試通過。
- 與 v1.6.5 以同一組 Chromium 操作逐步比對：成本、濃度、儲存後載回、製作紀錄數字一致。
- 同步程式（`tools/standalone-provider.js`、`tools/cloud-protocol.js`）、`src/Core.html`、`src/Code.gs`、`firestore.rules` 與前一版完全相同。

## 已完成 (Completed)
- 三步驟進度（類別、原料、確認）一次一步；三個面板的 `open` 狀態仍是唯一來源，`stepperSync()` 推導進度。
- 步驟 2 同列填用量；底部固定摘要；桌機左原料右已選。依目標調配新增「精油平均分配」。
- 步驟 3 成本與濃度在上、更多設定收納進階項目；「重新開始」只留一處。
- 配方庫多欄、製作紀錄併入配方庫；設定頁分區為原料與包材、安全資訊、資料與維護。
- 測試 107/107（新增 `tests/stepper.test.cjs` 8 項）；以十聖金油 10 支、1%、100 mL 在 360／390／820／1024／1366 寬度做自動版面檢查，無橫向溢出、截斷或重疊。
- 升版 v1.7.0：package.json、sw.js 快取名稱、頁尾、README 標題、CHANGELOG；重建 index.html。

## 異動檔案 (Changed Files)
src/Index.html、src/Client.html、src/Styles.html、tests/client.test.cjs、tests/dom-contract.test.cjs、tests/stepper.test.cjs（新增）、package.json、sw.js、index.html（建置產物）、README.md、CHANGELOG.md、docs/重新設計規格.md（新增）、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 未動計算、單位換算、同步、Firestore 規則、價格快照、已存資料格式。
- 「依目標調配」仍在步驟 2（目標模式要在填量時看進度）。
- `#toggleWork`（新增自製配方）元素保留但隱藏，既有測試要求其存在。
- 未改視覺風格（木質 Q 版），只收斂邊框與陰影。
- 兩支自訂原料（安息香、岩薔薇）為測試用，未寫入正式資料。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無已知阻斷。
- **P2 (重要/當次)**：
  - 使用者以 iPhone 實機走完整流程（選類別、加原料、填量、平均分配、儲存、開始／完成製作、看紀錄），特別是鍵盤彈出時底部固定列與輸入框的遮擋。
  - 已安裝 PWA 更新到 v1.7.0 後的快取與離線行為。
  - 雙帳號雙裝置同步實測（本人與太太各一台）。
  - 發布後依控制中心流程核對 13 展示版本是否需同步（另一個倉庫，尚未更動）。
  - Git tag `v1.7.0`：本機已建立，從本工作階段推送時遠端中斷連線，需由使用者執行 `git push origin v1.7.0` 或自行補建。
- **P3 (改善建議/暫緩)**：
  - 設定頁尚未改為清單入口（維持分段按鈕）；配方庫未做「每個配方展開看紀錄」。
  - 平板步驟 2 已選列卡片偏大；手機成本卡長文字換行位置不理想（「（成本／未完整）」被拆行）。
  - 步驟 2 往下捲著加入原料時，已選列在上方看不到，靠「下一步」跳到第一個空欄補救。
  - 自訂原料顯示名稱會被去掉「精油」兩字（既有行為）；步驟 2 沒有「新增原料」按鈕，需先搜尋再出現新增入口（既有行為）。
  - 前輪未驗項目：真實 AI 執行「複製提示詞」更新價格流程。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test`：107/107 通過（合併後在 main 上再跑一次）。
- Chromium 三種以上寬度截圖與自動版面檢查；與 v1.6.5 同流程數字比對一致；主控台錯誤 0。
### 尚未驗證項目
- iPhone／Safari 實機；已安裝 PWA 更新；Firebase 雙裝置同步；線上站台內容（本工作階段的網路政策不允許連 github.io，無法直接開線上頁面讀回）。
### 已知風險 (Known Risks)
- 面板開合邏輯沿用舊結構，`stepperSync` 靠 `toggle` 事件與延後補開維持「一次一個」；DOM 替身測試不觸發 `toggle`，此部分只在真實瀏覽器驗過。
- 同一份配方兩人同時改，以最後成功上傳者為準，無衝突提示（既有行為）。
- 已安裝 PWA 需重開才會取得新版；家人操作流程已改變。

## Git 狀態
- Commit：7cd76a2（merge）；release 提交 27c2301
- Push：main 已推送；tag v1.7.0 推送失敗（見上）
- Working Tree：Clean（提交前以 `git checkout -- index.html` 還原重建差異）
- Branch：main

## 下一步建議動作 (Next Recommended Action)
先在手機重開網頁確認頁尾為 v1.7.0，再走一遍完整流程；有問題以截圖回報。若需回復：以 `git revert -m 1 7cd76a2` 還原合併後推送即可重新發布 v1.6.5 行為。

## 發布狀態 (Release Status)
待進一步實測（部署工作流程結果以 GitHub Actions 為準）
