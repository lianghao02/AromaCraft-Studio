# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：基準5d75ec21bcc192a6b1820ebd9d2dae1cbeb68028；本輪修訂待提交
- **Skill Version**：v1.0.0
- **Task Type**：FIX / RELEASE
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.5.1修正版完成，待最終驗證及Pages發布。正式v1.5.0已發布，Apps Script仍v1.3.2。

## 本輪目標
修復手機截圖的「總量基準必須是g或mL」及精油膏全部使用容量卻無法計算濃度；依已授權的發布流程交付。

## 基準與已確認事實 (Baseline & Confirmed Facts)
工作目錄開始Clean。convertInput把mixed傳入只接受g／mL的convert；automaticConcentration又固定採用類別預設basis，即使另一基準可完整換算仍回報不足。原有20滴設定本身有效。

## 已完成 (Completed)
convertInput在分開計量時改以該原料採購基準換算。濃度在原基準不可用時採可完整換算的另一基準；原基準可用時維持原設定。未設定上限時，基準選單跟隨實際結果；已有上限不偷改。補上核心、8種寬度前端事件及後端保存讀回回歸。

## 異動檔案 (Changed Files)
src/Core.html、src/Client.html、tests/units.test.cjs、tests/client.test.cjs、package.json、src/Index.html、sw.js、產生的index.html、README.md、CHANGELOG.md、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不改雲端原料資料、採購單位、權限或認證；不把g當mL；不改既有成本或濃度快照。個別滴數換算優先於預設20，歷史配方修改後另存新版。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：待最終測試與Pages部署確認。
- **P2 (重要/當次)**：瀏覽器連線兩次逾時，本輪實際畫面操作尚未驗證；使用者可於發布後實機驗收。
- **P3 (改善建議/暫緩)**：完整Safari原生鍵盤、真實家庭雙裝置。

## 驗證結果 (Validation)
### 已執行測試與結果
原目錄與不含.git／node_modules的中文空白路徑副本均通過69項完整測試；語法、引用、敏感差異與git diff --check亦通過。包含2mL→40滴→2mL、30mL＋6滴→約0.99%、全重量1%、g＋滴缺換算不產生百分比、上限基準不同不比較。
### 尚未驗證項目
本輪瀏覽器真實操作：Chrome連線逾時，不能冒充實測。69項自動測試若通過，仍不代表實機Safari通過。
### 已知風險 (Known Risks)
20滴／mL為估算；g＋滴仍需有效密度或實秤重量才能算重量百分比。未超上限不代表適用性。

## Git 狀態
- Commit：待提交
- Push：待推送
- Working Tree：本輪相關修改
- Branch：main

## 下一步建議動作 (Next Recommended Action)
完成既有完整測試、語法與差異檢查，提交推送並確認Pages對應版本。

## 發布狀態 (Release Status)
v1.5.1待發布；Apps Script本輪不更新。
