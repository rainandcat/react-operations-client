# Client：公開作品規格（M0）

此檔定義之後要實作的使用者端範圍，不代表頁面或 mock API 已完成。Client 與 Manager 分開部署與維護，不假設兩者共用同一個執行中的資料庫。

## 使用者與核心流程

虛構使用者透過 demo session 進入帳戶總覽，查看可理解的摘要與近期活動；從活動歷史篩選並開啟單筆詳情；查看通知、調整顯示偏好。所有操作都只作用於展示資料。

建議路由：`/sign-in`、`/overview`、`/activity`、`/activity/:activityId`、`/notifications`、`/preferences`。這些是規格，不是目前已建立的路由。

1. Demo 登入 → 帳戶總覽 → 近期活動。
2. 活動歷史 → 種類篩選／分頁 → 活動詳情 → 返回保留查詢條件。
3. 通知清單 → 標記已讀 → 未讀數更新。
4. 偏好設定 → 切換顯示主題、幣別與展示用通知開關。

## 模型與欄位

型別來源：`src/features/{account,activities,notifications,preferences}/types.ts` 與 `src/services/apiTypes.ts`。

| 模型                          | 公開版必要欄位                                  | 限制                                     |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------- |
| AccountOverview               | 虛構帳戶 ID、顯示名稱、餘額字串、幣別、更新時間 | 無真實餘額、地址、聯絡方式或身份資料     |
| ClientActivity                | 虛構 ID、種類、狀態、金額字串、幣別、時間       | 不可執行交易；金額字串避免二進位浮點誤差 |
| ClientNotification            | 虛構 ID、種類、標題、內容、建立／已讀時間       | 不接第三方推播或真實事件                 |
| ClientPreferences             | 主題、顯示幣別、通知開關                        | 只控制展示 UI；不改變真實帳戶設定        |
| MockClientSession             | 虛構帳戶 ID、顯示名稱                           | 不保存真實 token                         |
| ApiResponse / ApiRequestError | 資料、更新時間；錯誤碼、訊息、是否可重試        | 後續用於一致的資料狀態，不是正式後端契約 |

日期以 ISO 8601 字串保存，UI 顯示時再格式化。TypeScript 型別只約束開發階段；若未來接外部資料，需要執行時驗證。

## Mock 資料規則

- 之後在 Client repository 手寫固定 seed 的虛構資料與 mock service；不匯入 Manager 或來源 Vue 專案的資料。
- Demo 資料可重現，mutations（例如標記通知已讀）只作用於當次 session，刷新後可重置。
- Mock service 可測正常、延遲、空資料、錯誤與取消情境，接受 `AbortSignal`；不發出真實 API 請求。
- 不提交 `.env`、憑證、真實服務 URL、品牌資產、內部文案或來源程式碼。

## M1–M3 驗收重點

- 首頁導覽在桌面與窄螢幕都清楚；demo 登入與登出有可理解的狀態。
- 帳戶與活動資料分別有 Loading、Error、Empty、Success；錯誤提供重試，取消不當作一般錯誤。
- 活動篩選與分頁可由 URL 還原；無效 activity ID 有明確的找不到資料畫面。
- 通知已讀與偏好變更有即時回饋；重複操作、失敗及刷新後行為可解釋。
- 導覽、表單及對話框可用鍵盤操作，標題與控制項有語意；主要流程以使用者行為測試驗證。

目前已完成的只有專案骨架、型別和本規格；上述流程需在後續里程碑實作與驗證。
