# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：基準2aecc3decdd531334e64d5e939962eeabf1d824f；本輪待提交
- **Skill Version**：v1.0.0
- **Task Type**：FIX / RELEASE
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態
v1.5.2修訂及69項完整測試通過，待Pages發布核對。Apps Script仍v1.3.2。

## 本輪目標
修正六項皆填卻殘留整滴提醒；依使用者意圖讓精油製作用量預設滴，更改單位保留數字，不再將1改為20。

## 基準與已確認事實 (Baseline & Confirmed Facts)
開始工作目錄Clean。v1.5.1會在切換單位時保留實際體積並換算數字，與這次使用者指定的「改輸入單位」意圖不同。確認只讀pending集合、不重讀欄位；全域錯誤在輸入正確後仍殘留。

## 已完成 (Completed)
- 確認時重新讀每項欄位與單位，補足未收到input事件的狀態；正確後立即清除舊提醒，錯誤指出原料與實際原因。
- 新增可用容量換算的精油預設滴；製作表單及個別換算設定改單位保留數字。1mL改選滴即1滴，內部成本與濃度仍用20滴／mL或個別設定換算。
- 既有配方、採購單位與歷史快照不自動修改；g價格且無容量換算的精油不強制使用滴。

## 異動檔案 (Changed Files)
src/Client.html、tests/client.test.cjs、src/Index.html、package.json、sw.js、產生的index.html、README.md、CHANGELOG.md、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不改Core計算公式、雲端資料、權限、原料價格或歷史快照；不刪除整滴驗證。1mL約20滴的內部換算關係維持。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：Pages發布與正式內容核對。
- **P2 (重要/當次)**：本輪瀏覽器連線逾時；Safari實機及畫面操作未驗證。
- **P3 (改善建議/暫緩)**：家庭真實雙裝置與完整鍵盤驗收。

## 驗證結果 (Validation)
### 已執行測試與結果
69項完整測試通過；原有8種寬度前端案例增加六項混合配方、三種精油各1滴、未觸發input事件、非整滴修正後清除訊息、改單位保留數字及後端保存讀回每瓶1滴斷言。語法與頁面引用檢查通過。跨路徑副本及敏感差異檢查另執行。
### 尚未驗證項目
瀏覽器連線逾時，不能把DOM替身測試當作Safari或真實畫面實測。
### 已知風險 (Known Risks)
精油20滴／mL仍為估算。既有mL配方不自動改量；使用者主動改單位時保留數字，畫面已註記此行為。

## Git 狀態
- Commit：待提交
- Push：待推送
- Working Tree：本輪相關修改
- Branch：main

## 下一步建議動作 (Next Recommended Action)
完成跨路徑與差異檢查，提交並依既有授權發布Pages，核對正式HTML與Service Worker。

## 發布狀態 (Release Status)
v1.5.2待發布；Apps Script本輪不更新。
