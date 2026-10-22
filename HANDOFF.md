# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/AromaCraft-Studio
- **Branch**：main
- **Commit SHA**：46fb4531623cff8c2f35d5af4259d7150058abdc（v1.6.5 發布提交）
- **Skill Version**：v1.0.0
- **Task Type**：HANDOFF
- **Local Path Hint**：18_AromaCraft-Studio

---

## 目前狀態
v1.6.5 已提交、打 tag、部署至 GitHub Pages；線上版與 HEAD 一致。工作目錄乾淨，無待提交內容。實際 Release／部署核對結果見控制中心 `docs/audit-release-20261022.md`。

## 近期已完成（細節見 Git 歷史）
- v1.6.1–v1.6.4：濃度與單位邏輯（克／ml／滴）、Q 版 2D 介面與操作手感修正、官網價格快照匯入與「複製提示詞交給 AI 更新」功能。
- v1.6.5：Service Worker `activate` 只清除 `aromacraft-` 前綴的舊快取，不再誤刪同來源（lianghao02.github.io）其他專案快取；新增 `tests/service-worker.test.cjs`。
- 模組地圖與 DOM 契約測試：`docs/模組地圖.md`、`tests/dom-contract.test.cjs`。`npm test` 99/99 通過。

## 刻意維持的決策
- 根目錄 `index.html` 是建置產物，只改 `src/` 後執行 `npm run build`；不手改、不大拆 `Client.html`。
- 執行 `npm test` 會重新產生 `index.html`（僅時間戳與 UUID 差異），提交前用 `git checkout -- index.html` 還原。
- 官網價格快照（`data/young-living-tw.json`，快照日 2026-10-13，台灣時間）只能用 `tools/refresh-catalog.cjs` 更新。

## 尚未驗證（人工驗收缺口，不冒充通過）
1. **雲端雙裝置自動套用新價格**：官網價格匯入在載入時會自動套用；本機驗證過，但兩台裝置經 Firebase 家庭同步（含 outbox）後的實際行為未驗證。
2. **真實 AI 執行「複製提示詞」更新流程**：提示詞內容與 `tools/refresh-catalog.cjs` 流程已測試，但尚未交給真實 AI 代理完整跑過一次並匯入結果。
3. **iPhone 觸控手感**：格子大小、點擊區與捲動，僅在桌機瀏覽器模擬手機寬度檢查，未在真實 iPhone 驗證。
4. **已安裝 PWA 的更新與離線**：真實手機上舊版 PWA 更新到 v1.6.5 後的快取行為未驗證。

步驟見控制中心 `docs/post-refactor-acceptance.md` 的 18 一節。

## 已知風險
原始碼修正不會自動更新已安裝 PWA 或舊下載包；使用者需重開並確認版本。

## 下一步建議動作
無必要的程式修改。依上列四項做人工驗收；有問題再開新任務，驗收通過前不擴大修改。
