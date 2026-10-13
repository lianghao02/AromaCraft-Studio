# Firebase 同步修正（v1.2.2）

## 既有環境與發布界線
現有專案 aromacraft-studio 的 (default) 資料庫已用官方 CLI 確認為 STANDARD／FIRESTORE_NATIVE。登入方式與家庭成員名單沿用既有設定，不新增帳號、不更換認證。前端由 GitHub Pages 發布；Apps Script 尚未更新。

2026-10-13：使用者明確批准正式部署後，官方 CLI 確認 firestore.rules 編譯、上傳及釋出成功。GitHub Pages v1.2.2 工作流程成功，HTTP 200 讀回確認版本及交易同步程式。規則的 dry-run 及本機模擬器已先通過，沒有刪除或移轉任何真實家庭資料。

## 資料格式與路徑
- 同步指標：families/home_sharing/settings/syncHead。
- 每版不可變快照：families/home_sharing/backup/r{revision}_{uuid}。
- 資料欄位：schemaVersion=2、revision、tablesJson（JSON 字串）、updatedAt、updatedBy（登入 UID）。表格二維陣列只存在 JSON 字串內，不作為 Firestore 巢狀陣列欄位。
- 舊 backup/snapshot 僅讀取相容，不刪除或覆寫；第一次新版本寫入會建立新的快照及指標。

## 同步與衝突
使用 onSnapshot 監聽指標，讀取與版本匹配的快照。寫入以 runTransaction 比較本機基準版本與雲端版本，新增快照及更新指標在同一交易完成。另一台裝置先更新時，本機寫入拒絕，不以整份較舊資料覆蓋雲端。

本機有尚未同步修改或編輯中草稿時，不自動套用不同的雲端資料；顯示衝突／待備份。讀回雲端需確認，原本本機表格保存在 before_cloud_pull 備份。移轉前保存在 pre_firebase_backup，只有交易成功才顯示成功；失敗向上拋出，不吞掉錯誤。登入成功不等於資料已同步。唯讀 bootstrap／loadRecipe 不回寫雲端。離線時保留本機及待同步標記，連線恢復後嘗試版本交易，衝突時仍不強行覆蓋。

## 候選安全規則
本版規則是需審查驗證的安全規則版本，不宣稱已完成正式雲端驗收。新同步路徑限定既有家庭名單及 home_sharing；快照只能建立、不能更新或刪除；指標必須逐版增加且與同交易快照匹配。一般 settings 規則排除 syncHead，避免多條 allow 聯集繞過驗證。既有其他集合規則保留。

## 已驗證
- npm test：53 項通過。
- 官方 Firebase CLI dry-run：候選 firestore.rules 編譯成功。
- 本機 Firestore Standard Emulator：非家庭成員讀寫拒絕、首版及新版配對交易成功、舊快照防覆寫／防刪除、無配對快照版本更新拒絕。
- 注入 SDK 回歸：二維表格轉 JSON、讀回與舊資料相容、大小及格式拒絕、兩台裝置版本衝突、監聽、移轉失敗不顯示成功、bootstrap 不回寫。

## 未驗證與下一步
本輪已完成規則部署：firebase deploy --only firestore:rules --project aromacraft-studio。不使用 --force，不部署其他產品。部署後再以本人及太太的實際帳號，在兩台裝置確認新增／修改／讀回及離線衝突。真實家庭跨裝置登入、手機原生鍵盤、Safari與截圖服務仍未驗證。
