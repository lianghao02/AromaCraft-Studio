# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：本輪基準 c2be593b931607de8d755f6fbe9a98580499f63e；發布提交以最新 Git log 查核
- **Skill Version**：v1.0.0
- **Task Type**：FIX
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.2.1 三步驟與單位修正完成，準備推送 Pages。使用者追加授權：本輪完成後修正 Firebase 四項問題，另提交。

## 本輪目標
依已確認手機操作流程局部修改，保留配色、資料、歷史快照及既有功能。

## 基準與已確認事實 (Baseline & Confirmed Facts)
開始時 main 與 origin/main 同步且 Clean；44 項基線測試通過。Pages 使用生成 index.html，Apps Script 共用 src；Google 正式部署尚未更新。

## 已完成 (Completed)
原料編輯集中第 2 步，確認步驟只改名稱／份數、成本自動統計、製作紀錄沿用用量。g/mL 分別合計，滴數單列，缺價／換算原因具體顯示，0 元有效。自動比例與選填同基準上限，保留歷史濃度資料。手機單欄、可捲動編輯與簡短底列。

## 異動檔案 (Changed Files)
src/Core.html、Code.gs、Client.html、Index.html、Styles.html；tests/client.test.cjs、units.test.cjs；版本、操作文件與生成 index.html。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
本輪未改 Firebase 認證、規則或同步程式；未改 Google 正式資料，未清除任何本機資料。Firebase 後续另階段。

## 尚未完成 (Remaining Work)
- **P1**：Firebase backup/snapshot 路徑與規則不符、二維陣列、失敗成功提示及即時／衝突四項問題，依追加指示下一階段處理。
- **P2**：Apps Script 更新需人工操作；新版真實 Google 保存未驗證。
- **P3**：手機原生數字鍵盤、Safari 與視覺截圖未驗證。

## 驗證結果 (Validation)
### 已執行測試與結果
50 項測試通過。真實本機瀏覽器完成三步驟及保存；四種手機寬度 DOM 幾何無橫向溢出、1366px 桌機三欄原料與唯讀確認正常。皂基1000g/200元使用100g讀回20元、5份每份4元；製作紀錄保存成功。
### 尚未驗證項目
截圖API不可用。手機實機鍵盤、Safari及Firebase跨裝置未驗證。
### 已知風險 (Known Risks)
Firebase既有問題仍在，本輪不以本機保存冒充雲端同步。

## Git 狀態
- Commit：以本輪發布提交查核
- Push：發布前查核
- Working Tree：Modified（本輪修改）
- Branch：main

## 下一步建議動作 (Next Recommended Action)
推送 Pages 並讀回版本後，再以獨立提交處理 Firebase 四項問題；保留本機備份與失敗狀態。

## 發布狀態 (Release Status)
本機驗證通過；以 Pages 工作流程及線上讀回確認實際部署。Apps Script 未更新。
