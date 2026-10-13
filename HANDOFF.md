# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：198c0434b09eb41d1c06c7471c74ec9bd39be3ed（v1.2.2 程式提交；本次僅補部署證據）
- **Skill Version**：v1.0.0
- **Task Type**：FIX
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
三步驟 v1.2.1 已推送及 Pages 部署成功。Firebase v1.2.2 程式與規則已完成；使用者明確批准後正式 Firestore 規則釋出成功，Pages v1.2.2 已部署並讀回確認。

## 本輪目標
完成使用者三步驟、單位及手機排版要求，再依追加授權修正 Firebase 四項問題，分開提交。

## 基準與已確認事實 (Baseline & Confirmed Facts)
原基準 c2be593、main/遠端 Clean 同步，44項基線通過。Pages 共用 src 計算；Google正式 Apps Script 未更新。Firebase既有(default)為Standard。

## 已完成 (Completed)
第2步原料編輯、第3步確認份數／成本及直接製作紀錄；自動投入量、比例與缺價原因，50項測試及手機四寬度DOM操作通過。Firebase JSON格式、不可變快照及交易、即時監聽、失敗狀態與待同步標記、讀回備份修正；53項完整測試及Firestore模擬器規則驗證通過。

## 異動檔案 (Changed Files)
第一階段：src、tests/client、units、操作文件。第二階段：tools/cloud-protocol.js、standalone-provider.js、build-standalone.cjs、firestore.rules、tests/cloud及Firestore REST模擬器驗證檔；Client只有草稿判定與雲端事件接口。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
沒有清除任何家庭或本機資料、不改登入／家庭名單、不更新Apps Script。舊雲端backup/snapshot相容只讀。

## 尚未完成 (Remaining Work)
- **P1**：無已知阻斷性問題；真實家庭操作仍依 P2 驗收。
- **P2**：部署後的本人／太太真實跨裝置登入、同步及離線衝突驗收。
- **P3**：實機數字鍵盤、Safari及截圖未驗證。

## 驗證結果 (Validation)
### 已執行測試與結果
53項回歸與語法通過；官方規則dry-run編譯通過；Standard Emulator驗證未授權、配對交易、歷史不可覆寫與刪除。三步驟真實本機Browser完成保存、製作紀錄、價格更換；手機四寬度無DOM橫向溢出，桌機正常。
### 尚未驗證項目
Firebase正式規則已部署、真實家庭跨裝置未驗證。截圖API不可用，原生鍵盤與Safari未驗證。
### 已知風險 (Known Risks)
同步失敗或衝突會保留本機資料，不可把本機保存當作已同步。新增不可變快照留存會累積，需要日後由使用者決定維護策略，本輪不清除。

## Git 狀態
- Commit：三步驟e9b585e已提交；Firebase另提交
- Push：第一階段是；第二階段是
- Working Tree：本次文件提交後 Clean
- Branch：main

## 下一步建議動作 (Next Recommended Action)
使用者已批准並完成只部署 firestore:rules。保留舊資料，依 docs/Firebase同步修正.md 做真實家庭帳號驗收，勿為測試清除資料。

## 發布狀態 (Release Status)
Pages v1.2.2 已更新；正式 Firebase 規則已部署；Apps Script 未更新。
