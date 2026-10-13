# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：41a9c8d5a09bc69526e600799dcefe39439aa102（主實作；本輪補舊配方相容，最終見最新 Commit）
- **Skill Version**：v1.0.0
- **Task Type**：FIX / RELEASE
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.3.0 精油比例引導可交付；Apps Script 第 7 版已發布，Pages 隨本輪推送更新。最新 iPhone Safari 回測待使用者。

## 本輪目標
按既定規格修改作品基準、即時比例、具名缺資料與實秤重量，驗證後發布。

## 基準與已確認事實 (Baseline & Confirmed Facts)
main db975a5；只有前輪建立的濃度規格與交接未提交，已確認是本對話產物並保留。原程式 v1.2.2／57 測試中的原有 53 項基線；Google 原部署第 5 版。

## 已完成 (Completed)
新作品固定重量／容量基準。第 2 步即時比例及補資料入口，第 3 步重用結果；原料可補本次實秤重量，保存於 concentrationJson.measuredWeights，對應用量／單位／價格 ID 失配時不採用。成本保持原用量，不雙算。零用量、部分滴數與正確分母的整滴上限已修正；無百分比顯示添加量。Google 四檔私人備份及上傳逐檔比對一致，第 7 版發布，沿用原網址／僅本人權限。

## 異動檔案 (Changed Files)
src/Core.html、Client.html、Index.html、Styles.html；package.json、index.html；tests/units.test.cjs；README.md、CHANGELOG.md、濃度規格、本交接。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不新增必填密度、不猜測 g＝mL、不新增資料表、不改認證或 Firebase 同步架構、不改歷史快照、不清除舊資料。正式 Google 未寫入額外測試配方。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無已知阻斷問題。
- **P2 (重要/當次)**：使用者 iPhone Safari 最新介面、鍵盤及補重量保存回測；家庭跨裝置同步待實際帳號驗收。
- **P3 (改善建議/暫緩)**：自動截圖仍不可用，沒有截圖證據。

## 驗證結果 (Validation)
### 已執行測試與結果
57 項回歸通過，新增四組涵蓋零用量、缺資料、實秤不雙算、失配、滴數上限與保存讀回。語法檢查通過。本機 Browser：99 g＋1 mL 精油補 0.9 g＝0.90%，五份比例不變，成本 278／每份 55.60；保存成功、改量需補重量。320／375／390／430／1366 px DOM 無溢出，console error 為空。Apps Script 官方顯示第 7 版部署成功。
### 尚未驗證項目
真實 iPhone Safari 最新變更、正式家庭跨裝置同步。
### 已知風險 (Known Risks)
歷史配方無 basis 時，載入草稿優先沿用可辨識基準，其次舊明確基準／作品預設；不改原資料或快照。缺重量或滴數不強行產生百分比；比例只是投入量估算，不判定兒童適用性。

## Git 狀態
- Commit：本輪相關修改提交於最新 Commit
- Push：本輪推送 main
- Working Tree：提交前僅本輪相關檔案
- Branch：main

## 下一步建議動作 (Next Recommended Action)
確認 Pages 對應 Commit Actions 成功，再請使用者在 iPhone 重新整理 v1.3.0，測試重量配方補重量與液體滴數比例。不要清除舊資料。

## 發布狀態 (Release Status)
Apps Script 第 7 版已發布；Pages 隨本輪推送發布。沒有變更 Firestore 規則。
