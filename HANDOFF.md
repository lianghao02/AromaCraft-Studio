# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：基準88d732a596325088338f413b560749304d0fe4b0；本輪準備提交發布
- **Skill Version**：lianghao-development v1.0.0
- **Task Type**：RELEASE / HANDOFF
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.6.0問答規格完整整合完成，原目錄與跨路徑副本各通過76項測試與語法檢查。內建瀏覽器功能實測通過；已依使用者授權準備提交與部署；正式GitHub Pages更新結果待核對，Apps Script仍v1.3.2。本機完整預覽：http://127.0.0.1:18861/ （示範資料只在記憶體，不是家庭資料）。

## 本輪目標
使用者已明確授權提交與部署v1.6.0。依逐項問答決策完成全部功能後一併驗收，規格單一來源為IMPLEMENTATION_PLAN.md的v1.6.0區段。

## 基準與已確認事實 (Baseline & Confirmed Facts)
開始為main、88d732a、Clean；原有69項測試。使用者明確選擇雙模式、自行分配滴數、超標仍可存、更新同一配方、製作紀錄獨立、最新價格、草稿僅本機、整批與每份並存、單種整套包材、永久移除、最後雲端儲存者為準、離線可存與實際用量可調整。舊專案邊界依當次明確需求更新，不保留與新規格矛盾的資料庫／刪除限制。

## 已完成 (Completed)
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
- Commit：本輪未提交；基準88d732a
- Push：未推送；origin/main仍88d732a
- Working Tree：本輪18份相關檔案（含新增tests/planning.test.cjs）
- Branch：main

## 下一步建議動作 (Next Recommended Action)
先用本機v1.6.0一併驗收。使用者要求提交／部署後，保留本輪修改、確認remote與分支，提交並發布GitHub Pages；發布後核對HTML及Service Worker與本機一致。Google獨立部署需另更新src、升級追加欄位，不可宣稱已同步更新。

## 發布狀態 (Release Status)
v1.6.0準備發布至GitHub Pages，完成後核對正式HTML與Service Worker；Apps Script v1.3.2。本輪無正式資料寫入。
