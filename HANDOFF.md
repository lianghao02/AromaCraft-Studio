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

### v1.3.2 發布完成證據

- 功能 Commit：373bad2c4b6930f19ee6af9ddd4dfb4add56e966，已推送 origin/main。
- GitHub Pages：Actions 38486675836 成功，head 與功能 Commit 相符；公開頁面讀回 v1.3.2 與 primaryNav。390px 正式頁面導覽 fixed，無横向溢出及摘要重疊。
- Apps Script：三個前端檔案更新前與 Git 基線完全相符，另存私人本機備份；更新後剪貼簿讀回與原始碼相符。原部署第9版成功（2026-10-14 07:52），原網址與 USER_ACCESSING／MYSELF 權限保留；應用頁面讀回 v1.3.2，下方導覽元素存在，配方庫仍讀得既有v6及5筆歷史版本。未寫入正式測試配方。
- 檢查：59項測試、語法與引用、git diff --check 通過，新增差異敏感字串無警訊。
- 尚未驗證：iPhone Safari原生鍵盤及實機安全區、家庭跨裝置同步；截圖API不可用。
- Task Type：RELEASE；下一步由使用者實機操作回報，本輪停止追加修改。

## 最新修訂：複方品名簡化（2026-10-14）
已分類複方精油的顯示名稱移除「配方」，保留原資料與歷史快照。來源 tools/catalog-runtime.js，重新產生 Catalog.html 與 index.html；59項測試與語法檢查通過，心觸動、月輕鬆顯示核對通過。本輪尚未提交及部署。同步架構：Pages登入後使用Firebase家庭同步，未登入使用本機；Apps Script仍獨立使用Google Sheets。兩台實機同步尚未驗證。

## 最新修訂：自製配方類別（2026-10-14）
Repository：lianghao02/AromaCraft-Studio；Branch：main；基線Commit：390eab085ebd562913d19bfb201aa3ea0ab325ce；Skill Version：v1.0.0；Task Type：IMPROVE。保留上一輪未提交的複方品名簡化。
製作類別統一五種，新配方不再附加範本備註，移除空白範本按鈕；配方庫依類別分組並兼容舊類型。Core接受新舊類型，舊資料與安全規則仍維持原值，沒有擴大套用舊用途限制。舊濃度基準與快照保留。
本機示範18773的HTML已更新，保留原卡片預覽樣式；正式Styles僅追加分類標題。瀏覽器控制連線無可用瀏覽器，本輪畫面、手機排版與原生鍵盤未驗證。尚未Commit、Push或部署；後續更新Google需要Core、Client、Index、Styles與上一輪Catalog修改。

驗證完成：60項測試通過，語法、引用與差異檢查通過。各手機尺寸的DOM互動替身驗證包含新類別及旧清潔配方分組；不能代替瀏覽器版面實測。

最新類別尺寸調整：製作類別改為至少52px高的緊湊按鈕，手機三欄兩列、桌機五欄一列；隱藏重複的自製配方文字。18773預覽已更新，類別不再呈現大資料夾造型，分類色彩及選取状态沿用。僅CSS調整，不影響資料與計算；尚未部署，瀏覽器連線不可用，版面未實測。

## 最新修訂：配方摘要、收合與包材套用（2026-10-14）
基線390eab0、main；Task Type：FIX／IMPROVE；Skill Version：1.0.0。保留全部前輪未提交修改。配方庫移除安全狀態與編輯版本文字，顯示自訂名稱、類別／精油摘要與快照比例、建立日期（台北年月日）；历史版本的實際版本識別與資料仍保留。摘要由Code.gs bootstrap讀取已儲存快照，原料更新不改摘要內容。比例旁改簡短提醒，詳細用途限制仍保留。
第3步改details，可收合；返回確認時展開。saveCost成功後套用目前配方草稿並計算，草稿標示未儲存，既有成本快照不改。61項測試通過，包含包材套用、切換時保護草稿、快照摘要與歷史資料。
瀏覽器工具沒有可用連線，版面與原生鍵盤未驗證。18773原本服務已不在線（連線拒絕），未動其HTML或清除任何資料；新版示範改用18775，全新記憶體資料。尚未Commit、Push或部署。
Firebase建議作為唯一日常入口，但尚未收到明確移轉指令，本輪只確認現行架構，未搬移Google／Firebase資料或調整權限。

第2／3步重疊修正：recipePanel由section改details時遺漏panel-card類別，導致原本負邊距標題缺少16px內距承接。補回共用卡片類別，使原有內距、邊框、區塊外距與預覽樣式生效；收合邏輯不變。18775靜態預覽同步更新，未重啟服務或改資料。尚未部署，瀏覽器版面未實測。

第3步收合外觀再修正：標題改成箭頭／內容兩欄，關閉時隱藏狀態列與移除多餘底部內距，手機去除第三步重複上外距。依使用者截圖定位；預覽同步更新，未改資料與收合事件，畫面實测仍待完成。

## 最新修訂：多選原料與連續填用量（2026-10-14）
main，基線390eab0，Skill Version 1.0.0，Task Type IMPROVE。保留前輪全部修改。第2步卡片點選改為勾選／取消，不即刻開視窗；填用量按鈕啟動已選清單，既有單位換算及驗證視窗按順序套用，最後展開第3步。關閉保留已套用用量；移除補足材料仍受既有檢查。手機選類別後收合第3步。
第2步完整比例卡隱藏，缺資料補填入口移到第3步，逐項用量在第3步預設收合；成本明細仍可確認。18775靜態預覽同步更新，未重啟服務或修改示範資料。測試增加多選、不跳視窗、取消再選、三項連續編輯、小數重量、非整滴停止及完成後確認流程。尚未提交、部署；Browser工具目前無可用連線，畫面及鍵盤未實測。

最新多選入口釐清：已選材料改為標籤加取消按鈕，點標籤不再開用量視窗；挑選區管理齒輪隱藏，僅透過「填寫用量」啟動連續輸入。第3步僅成本合計、比例與可直接填註記，移除預設逐項成本列，詳細換算訊息留在展開說明。
預覽更新已核對實際HTTP送出內容；新的18776頁面帶「新版多選預覽」標示，以新分頁排除舊文件。舊18775服務與資料保留；已儲存示範八表完整備份並複製，API匯出比對相同。未儲存草稿仍在原分頁，未擅自清除或搬移。Browser工具無連線，未宣稱畫面實測。新預覽以隱藏背景程序啟動，工作區外工具不提交版本庫。本轮尚未提交或部署。

## 最新修訂：Google 家庭登入（2026-10-14）
Repository：lianghao02/AromaCraft-Studio；Branch：main；基線 Commit：390eab085ebd562913d19bfb201aa3ea0ab325ce；Skill Version：1.0.0；Task Type：IMPROVE／RELEASE。
使用者選定 Google 帳號登入。正式 Firebase auth 部署已成功，API 讀回 googleEnabled=true、Google OAuth 已設定、emailPassword=true；在現有清單追加 lianghao02.github.io，保留三個原網域。沒有改 Firestore 規則、名單或資料；沒有搬移 Apps Script 試算表。
網頁新增 Google 選帳號入口、取消／阻擋視窗／網路／網域等具體錯誤，保留舊密碼入口。測試驗證無雲端快照時登入不顯示已同步、非授權帳號登出且不寫資料、取消不改本機表格；既有移轉失敗與交易防覆蓋測試保留。
累積前輪 UI 修訂一併整理為 v1.4.0；Pages 發布狀態待下方完成證據。Browser 工具仍無可用連線，真實登入、跨裝置同步、手機排版及 Safari 原生鍵盤未驗證，不將自動化替身視為實機測試。Apps Script 本輪尚未更新。

### v1.4.0 發布完成證據
功能 Commit：9f7ed19046b29eb5f80e0041eecbc859c8e84f65，已正常推送 origin/main。GitHub Pages Actions 38499178506 成功，head 與功能 Commit 相符；公開網站 HTTP 200，讀回 v1.4.0、btnGoogleLogin、多選填用量與原有密碼入口。61項完整測試通過，最後缺價補填入口調整後再跑5項前端相關測試、語法、建置與差異檢查通過；新增敏感字串檢核無警訊。
已請使用者於正式網站只登入，回報已同步／待移轉／登入失敗；尚未收到實機結果。Google 選帳號視窗與真實跨裝置資料同步仍未驗證；Apps Script 本輪未更新，仍為 v1.3.2。後續依實機狀態處理，禁止在未確認資料來源時覆蓋家庭快照或清除本機資料。

## 最新修正：v1.4.1 原料操作（2026-10-14）
### 核心元資料
- Repository：lianghao02/AromaCraft-Studio
- Branch：main
- Commit SHA：基線0483fa12f81cf622d3c54287d13185b45ed4ddc7；本輪功能0406f82a39630a08e4b330342354c8d531382871，已推送origin/main
- Skill Version：v1.0.0
- Task Type：FIX／RELEASE
### 目前狀態與本輪目標
修正正式桌機第2步不能收合、填用量按鈕隱藏、設定頁選取狀態混淆及圖示404，檢查同類入口與狀態覆蓋。
### 基準與已確認事實
開始時main與origin/main一致，Working Tree Clean，61項基線測試通過。桌機CSS停用原料summary並隱藏picker-top-bar；原料管理直接沿用inRecipe外框。使用者已回報v1.4.0手機登入顯示已同步，兩台裝置資料一致性仍未驗證。cssInjection使用者回報不再出現，未取得content.js完整來源。
### 已完成與異動檔案
Index加入內嵌SVG圖示；Styles移除原料強制展開及入口隱藏，桌機用量入口在原料區內吸頂。Client保留收合狀態、管理頁不呈現配方勾選／aria-pressed，刷新不覆蓋Firebase連線說明。原有openEditor重設按鈕文字正常，保留且回歸驗證。client.test新增768、1024、1920px與CSS契約檢查。版本、CHANGELOG、README及產生的index同步更新。
### 刻意未修改
原料、採購價格、成本快照、已存配方、FireStore權限及Google Apps Script正式部署；未清除瀏覽器或雲端資料，未調整使用者擴充功能。
### 驗證結果與尚未完成
65項完整自動化測試、語法、建置、引用與差異檢查通過。涵蓋多選、依序填用量、管理只編輯、不改配方、切頁保留收合、八種寬度與Firebase說明保留。Browser工具無可用連線，真實CSS版面、原生收合點擊、圖示網路請求與Safari鍵盤未實測；替身和CSS契約不冒充實機驗證。
### Git與發布狀態
本次修改僅相關檔案；Pages Actions 38501703129成功，head為0406f82；公開HTTP200，v1.4.1及內嵌圖示存在，網頁逐字與建置內容相同。Apps Script仍v1.3.2，未宣稱已更新。完成發布後請使用者重新整理v1.4.1回測第2步標題、多選填用量與設定頁外框；不要清空原資料。

## 最新修正：v1.4.2 基底油容量（2026-10-14）
### 核心元資料
- Repository：lianghao02/AromaCraft-Studio
- Branch：main
- Commit SHA：基線846f96fdea335f1f3ca79a666a196427cd224823；基底油修正尚未提交
- Skill Version：v1.0.0
- Task Type：FIX／RELEASE
### 基準、目標與已完成
開始時Working Tree Clean。使用者指出基底油應以mL為日常容量單位，並提供稀釋資料。核對來源後確認文章20滴指精油估算，沒有改為所有基底油固定滴數，沒有加入族群安全濃度表。
Code.gs新建基底油試算價格預設100 mL，既有表格不自動修改。Client舊g基底油用量視窗提供修改採購單位入口，儲存後返回連續用量。變更價格時若新單位不兼容且舊量非零，保留原priceId／用量；重新填寫並套用才修改當前配方。零量可帶入新單位。修改價格不覆寫歷史快照。
### 異動與驗證
Code.gs、Client、Index、package、產生的index、client／server測試及必要文件。66項完整測試、語法、建置、引用、差異檢查通過；新增敏感字串無警訊。驗證新預設、12g不偷偷成為12mL、空白用量拒絕、改填10mL成本30元、回到連續流程，以及舊價格／已存快照不變。
### 邊界與待驗證
Firebase資料與規則未改寫；本機及雲端舊g資料需由使用者在入口確認修改。Browser工具無連線，真實視窗操作、手機鍵盤及兩台裝置資料一致性未驗證。Apps Script正式仍v1.3.2，原始碼更新不代表該平台已部署。
### Git與發布狀態
main，相關修改待提交與Pages部署核對，保留全部正式資料。完成後請重新整理v1.4.2並用修改採購入口設定實際容量；不要清除本機或雲端資料。
