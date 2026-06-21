# v14 版本 WebSocket 新增字段清单

## 一、柜门状态全量推送消息

**消息类型**: `cabinet.lock_status`

| 字段 | 类型 | 必填 | 说明 | 前端对应显示 |
|---|---|---|---|---|
| `type` | string | 是 | 固定为 `"cabinet.lock_status"` | - |
| `boardId` | string | 是 | 柜机编号,例如 `"2441"` | 标题/底部多处 |
| `updatedAt` | number | 是 | 状态更新时间戳(毫秒) | 底部"更新于" |
| `totalDoors` | number | 是 | 总柜门数 | 底部"柜门数" |
| `onlineDoors` | number | 是 | 在线柜门数 | 底部"在线柜门 0/0" |
| `openedDoors` | number | 是 | 当前已打开的柜门数 | 底部"已借出器材 0" |
| `availableDoors` | number | 是 | 可借(关闭且可用)的柜门数 | 底部"可借器材" |
| `deviceHealth` | string | 是 | 柜机整体健康状态: `"ok"` / `"warn"` / `"error"` | 底部"设备状态" |
| `doors` | array | 否 | 柜门明细列表(用于调试或弹窗) | - |

### `doors[]` 子字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `lock_id` | string | 是 | 柜门编号 |
| `door_status` | string | 是 | `"0"`=关闭 / `"1"`=打开 |
| `lighting_lamp` | string | 是 | `"0"`=离线 / `"1"`=在线 |
| `indicator_light` | string | 否 | 指示灯状态 |
| `last_open_time` | string | 否 | 上次开柜时间 |

---

## 二、二维码消息补充字段

在现有二维码推送消息(例如 `type: "cabinet_qr"` 或 `"qr_code"`)中补充:

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `boardId` | string | 是 | 柜机编号(用于前端校验是否匹配本机) |
| `healthStatus` | string | 否 | `"ok"` / `"warn"` / `"error"`,可随二维码一起下发 |

---

## 三、消息时序

```
前端 subscribeCabinetQr ──> 后端
          <── connected
          <── { type: "cabinet_qr", content: "...", boardId: "2441" }
          <── { type: "cabinet.lock_status", boardId: "2441", totalDoors: 12, ... }

    [ 二维码过期时重推 cabinet_qr ]
    [ 门状态变化时推 cabinet.lock_status (10~30秒/次 或 事件触发) ]
```

---

## 四、前端 v14 处理逻辑

v14 已内置统计逻辑,只要后端推送 `cabinet.lock_status`,前端会自动:
1. `doorStats.total` = `totalDoors`
2. `doorStats.online` = `onlineDoors`
3. `doorStats.opened` = `openedDoors`
4. `availableCount` = `availableDoors`
5. `statusUpdatedAt` = `updatedAt`
6. 状态标签根据 `deviceHealth` 显示"正常"/"注意"/"异常"
