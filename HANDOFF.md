# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：首次公開發布提交，實際 SHA 以 Git 為準
- **Skill Version**：v1.0.0
- **Task Type**：RELEASE
- **Local Path Hint**：18_AromaCraft-Studio

## 目前狀態

已建立公開 GitHub 專案，首次發布為 v1.0.0 預覽版。前端、Apps Script 原始碼、八表設定、測試與說明齊備。現階段先調適前端，再一次更新正式 Google 部署。私人帳號、試算表 ID、正式網址與家庭資料不納入公開版本庫。

## 本輪目標

建立公開 GitHub 專案並首次發布現有版本，保留前端先行調適方向。

## 基準與已確認事實 (Baseline & Confirmed Facts)

Google Apps Script 與八張繁體中文工作表；原生手機前端；價格、配方版本與成本快照追加；安全資料不足時顯示待驗證。本機服務替身不接觸真實 Google 資料。

## 已完成 (Completed)

2026-10-12 工作區編號：本機資料夾改為 `18_AromaCraft-Studio`；GitHub origin 與 main 追蹤維持原設定。更名前後 HEAD、既有未提交修改與保護檔案雜湊核對通過；GitHub main 可存取且與本機 HEAD 一致。前輪工作完整保留；本輪僅提交與推送編號紀錄，前輪功能修改保留在本機。

兩種作品、自由原料、價格批次、配方版本、成本與毛利、歷史快照、授權錯誤處理。成本欄位逐項標明整批／每件與單位，切換確認採站內對話框。本機前端 HTML 合併、啟動器及調適說明已提供。

## 異動檔案 (Changed Files)

首次公開納入 src、tools、tests、docs、README、package.json、啟動器與必要專案治理文件。

## 刻意未修改 (Do Not Do / Deliberately Omitted)

不修改私人正式資料，不公開帳號設定，不加入前端框架或通用安全閾值。未指定開源授權條款，目前不另授予開源授權。

## 尚未完成 (Remaining Work)

- 前端新增／載入入口與資訊順序仍需調適。
- 本次收納版與成本訊息的真實手機 Safari、鍵盤、底部遮擋及備份下載驗收。
- 最終前端定案後更新正式 Apps Script，驗證家庭帳號隔離與跨裝置讀寫。

## 驗證結果 (Validation)

19 項計算、服務及用戶端測試通過；前後端語法通過。合併前端語法、獨立預覽包 HTTP 啟動、bootstrap 與編輯後重新整理通過。瀏覽器工具回報沒有可用瀏覽器，本次新版視覺實測略過；不宣稱正式 UI 已驗收。

## Git 狀態

首次公開提交：0603396；origin 為 GitHub lianghao02/AromaCraft-Studio。後續文件提交以 Git 為準。

## 下一步建議動作 (Next Recommended Action)

使用者已確認沿用既有卡片式外觀，不重新設計一套。先用本機預覽完成入口、收納與手機操作，再產出部署版本。不要重建既有試算表，也不要在公開議題中貼出私人資料。

## 發布狀態 (Release Status)

v1.0.0 為公開預覽版；前端與家庭部署驗收仍待完成。
