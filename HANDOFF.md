# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：0db9f75（本輪基準，最終見最新 Commit）
- **Skill Version**：v1.0.0
- **Task Type**：FIX / RELEASE
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.3.1 預設20滴／mL估算已實作、59項測試通過。Apps Script第8版已部署並讀回v1.3.1，Pages隨本輪推送更新。另有本機卡片風格預覽，正式網站風格尚未切換。

## 本輪目標
使用者指定精油每1 mL預設20滴，日常不用逐項填換算；保留舊資料與個別設定，完成發布。回應風格參考並製作可操作預覽。

## 基準與已確認事實 (Baseline & Confirmed Facts)
main 0db9f75，工作目錄 Clean；v1.3.0含作品基準、補實秤與舊配方相容。Google第7版已發布。使用者最新指令優先於舊規格「不提供通用滴數」條文。

## 已完成 (Completed)
Core集中DEFAULT_DROPS_PER_ML=20與useDefaultDrops配方設定，只對精油缺換算值時套用；本次及價格資料既有因子優先。伺服器重新計算並保存採用因子，不改歷史快照。移除用量視窗輸入、顯示估算說明；原料設定仍可選填自訂值。風格預覽使用示範記憶體資料，粗框、柔和分類色、資料夾作品卡，手機360px以上原料兩欄、320px一欄；不變動正式Styles。

## 異動檔案 (Changed Files)
src/Core.html、Client.html、Index.html；package.json、index.html；tests/units.test.cjs；README.md、CHANGELOG.md、濃度規格、本交接。預覽HTML僅保存於本對話工作輸出，未加入版本庫。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不把20滴假設作為g／mL換算，不改價格歷史或快照、不新增資料表、不改Firebase認證與規則、不清除資料。正式版未更換卡片視覺風格。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無已知阻斷問題。
- **P2 (重要/當次)**：最新iPhone Safari的滴數及鍵盤實機回測；家庭跨裝置同步仍待實際帳號驗收。
- **P3 (改善建議/暫緩)**：請使用者比較卡片風格預覽後再決定正式套用。

## 驗證結果 (Validation)
### 已執行測試與結果
59項測試通過；本機 Browser 驗證29.5mL＋10滴＝約1.67%，單項材料費139元；沒有換算輸入欄，保存示範配方成功。預覽320／375／390／430／1366px無DOM橫向溢出。
### 尚未驗證項目
最新iPhone Safari與家庭跨裝置同步；截圖API仍不可用，保留可操作預覽。
### 已知風險 (Known Risks)
預設20滴只作估算。重量配方需實秤重量或已有有效重量換算；比例不判定兒童適用性。Google與Firebase網站資料各自獨立。

## Git 狀態
- Commit：本輪提交見最新Commit
- Push：本輪推送main
- Working Tree：提交前僅本輪相關檔案
- Branch：main

## 下一步建議動作 (Next Recommended Action)
確認本輪Pages與Apps Script發布結果；請使用者回測v1.3.1滴數輸入。風格預覽在對話工作輸出work/aroma-card-preview.html，伺服器18773；套用正式風格需依使用者後續決定。

## 發布狀態 (Release Status)
Apps Script第8版部署成功。正式發布只包含預設滴數簡化；卡片風格僅本機預覽。沿用原Google網址與權限，無Firestore規則修改。


## 最新交接：手機下方導覽修訂｜2026-10-14

此段為最新工作狀態，前文 v1.3.1 發布資訊保留。

- Repository：lianghao02/AromaCraft-Studio；Branch：main；基線 Commit：ee8b4f021dff3b8a1e413d933b07c195d16ec7ef；Skill Version：v1.0.0；Task Type：IMPROVE。
- 開始時工作目錄乾淨。本輪未 Commit、Push 或部署；正式 Pages 與 Apps Script 第 8 版保持上一輪 v1.3.1。
- 已完成：沿用同一組頁籤，手機固定下方調配方、配方庫、設定；桌機維持上方。成本儲存列位於導覽上方，保留安全區與內容底部空間。切換頁面保留草稿並回頂部；鍵盤開啟時同時收起固定導覽與摘要。
- 修改檔案：src/Index.html、Styles.html、Client.html、產生的 index.html、README.md、HANDOFF.md。
- 驗證：59 項既有測試、語法與引用檢查通過。Browser 320、375、390、430、1366px 無橫向溢出；手機固定、桌機靜態，按鈕至少44px，摘要与導覽無重疊。皂基1.5g經配方庫、設定、返回後保留；Console錯誤為零。
- 未驗證：iPhone Safari 原生鍵盤與底部安全區；截圖 API 不可用。
- 不修改：計算、歷史快照、雲端權限、正式配色及先前未採用的卡片風格。
- 下一步：使用者可檢視 http://127.0.0.1:18774/ 本機示範預覽；收到發布需求再提交與更新正式平台。

## 最新發布作業：v1.3.2

使用者已明確要求部署，授權本輪提交、推送及更新原部署。當前進入發布驗證；平台完成狀態將在部署後補記。
