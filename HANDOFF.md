# HANDOFF

## 核心中繼資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：44c4df1（本輪基準；最終修改見最新 Git Commit）
- **Skill Version**：v1.0.0
- **Task Type**：FIX / RELEASE
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
Firebase 規則與 Pages v1.2.2 已發布；本輪更新既有 Apps Script 至第 5 版，Google 正式網址讀回新版與舊配方。手機欄位修正已完成，最新實機回測待使用者回報。

## 本輪目標
完成手機原生鍵盤／Safari 驗證與 Apps Script 更新。依使用者截圖局部修正，不重構。

## 基準與已確認事實 (Baseline & Confirmed Facts)
接手 main 44c4df1，工作目錄乾淨。53 項測試通過。Google 舊版六檔、部署第 3 版，存取權限僅本人。

## 已完成 (Completed)
Google 原六檔已私人備份，七個新版程式檔已上傳並比對；manifest 的僅本人權限保留。migrateUnitSchema 執行完畢；正式部署第 5 版顯示 v1.2.2，既有配方 v6 可讀。Google 隱藏 Firebase 登入面板及修正頁尾。iPhone 截圖確認 1.5 輸入、原生鍵盤及本機配方保存；修正日期溢出樣式及滴數 decimal 鍵盤。

## 變更檔案 (Changed Files)
src/Client.html、src/Index.html、src/Styles.html、產生的 index.html、docs/手機與Google部署驗證.md、本交接。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不清空手機或雲端資料，不改認證或家庭白名單，不放寬 Google 權限，不在兩平台間搬移資料。沒有寫入額外 Google 測試配方。

## 尚未完成 (Remaining Work)
- **P2**：最新日期／鍵盤樣式需 iPhone Safari 回測；手機截圖只證明本機保存，家庭帳號跨裝置同步仍待驗收。
- **P3**：自動截圖介面不可用，未提供自動截圖證據。

## 驗證結果 (Validation)
### 已執行測試與結果
53 項測試通過，語法檢查通過。Google 官方頁面顯示第 5 版更新成功，原正式網址讀回 v1.2.2、Google 試算表標示與舊配方。iPhone 截圖確認小數輸入與手機驗證 v1 保存。
### 尚未驗證項目
最新日期樣式與滴數輸入模式的實機回測；完整手機返回／份數與保存讀回；家庭跨裝置同步。
### 已知風險 (Known Risks)
Google 網址與 Pages Firebase 網站使用不同資料，不能將一邊保存視為另一邊已同步。原生日期樣式需由真實 Safari 確認。

## Git 狀態
- Commit：本輪修正提交於最新 Commit
- Push：本輪提交推送 main
- Working Tree：本輪提交完成後應為 Clean
- Branch：main

## 下一步建議動作 (Next Recommended Action)
請使用者在 iPhone Safari 重新整理後，確認日期欄位、小數鍵盤、套用與份數操作；依具體回報修正，勿清除舊資料。

## 發布狀態 (Release Status)
Apps Script 第 5 版已部署，原網址與存取權限保留；Pages 隨本輪推送更新；實際結果需檢查對應 Actions。
