# 科创智借柜屏二维码 H5

科创智借（kechuang-zhijie）学生端借还柜屏幕上展示的动态二维码 H5 应用。
用户扫码后跳转微信小程序完成借还流程，柜机屏幕通过 WebSocket / 轮询实时刷新二维码。

## 技术栈

- Vue 3（`<script setup>` 单文件组件）
- Vite 构建工具
- qrcode 生成二维码
- 微信开放标签 `wx-open-launch-weapp` 唤起小程序

## 目录结构

```
.
├── index.html              # 入口页面，加载 src/main.js
├── vite.config.js          # 构建配置 + 开发态二维码回退中间件
├── .env / .env.example     # 环境变量配置
└── src/
    ├── App.vue             # 应用主组件（当前线上版本，原 v14）
    ├── style.css           # 主样式
    ├── main.js             # 入口，挂载 #app
    ├── config.js           # 运行时配置（URL 参数 / 管理员配置 / 环境变量）
    ├── qr-feed.js          # 二维码数据源（WebSocket / 轮询 / 本地回退）
    ├── codec.js            # 时钟格式化、查询参数解析
    ├── vendor-api.js       # 厂商柜机状态接口（读板锁状态）
    ├── sign.js             # 厂商接口签名
    ├── wechat-open.js      # 微信开放标签渲染与点击处理
    └── v14-yec-logo.png    # 界面 LOGO 资源
```

> `test/` 目录存放历史版本（v2–v13 的 `App-*.vue` / `style-*.css` 以及 `demo.html`、`version.html`、多版本入口 `version-entry.js` / `demo-main.js`），仅供回溯参考，不参与当前构建。

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173）
npm run dev

# 生产构建，输出到 dist/
npm run build

# 预览构建产物
npm run preview
```

开发模式下，`vite.config.js` 中的 `cabinetQrFallbackPlugin` 提供 `/dev/cabinet-qr` 回退接口，并将 `/ws/cabinet-h5` 代理到 `wss://www.ptyec.com`，方便本地无真实后端时调试。

## 配置说明

配置按优先级从高到低读取：**URL 查询参数 → 管理员本地配置（localStorage `v14_cabinet_config`）→ 环境变量 → 代码默认值**。详见 `src/config.js` 的 `getRuntimeConfig()`。

主要环境变量（参考 `.env.example`）：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_VENDOR_BASE_URL` | 厂商接口基址 | `http://td.youyuancheng.com` |
| `VITE_VENDOR_UQ_KEY` / `VITE_VENDOR_SECRET` | 厂商接口密钥 | 空 |
| `VITE_VENDOR_TIMEOUT_SECONDS` | 厂商接口超时（秒） | `30` |
| `VITE_QR_TTL_SECONDS` | 二维码有效期（秒） | `60` |
| `VITE_QR_SOURCE` | 二维码来源：`websocket` / `poll` / `local` | `websocket` |
| `VITE_QR_WS_URL` | 二维码 WebSocket 地址，支持 `{sessionId}` 占位 | `ws://localhost:8080/ws/cabinet-h5` |
| `VITE_QR_POLL_URL` | 轮询地址（`source=poll` 时使用） | 空 |
| `VITE_STATUS_POLL_SECONDS` | 柜机状态轮询间隔（秒） | `10` |
| `VITE_MINIPROGRAM_APP_ID` | 目标小程序 AppID | 空 |
| `VITE_MINIPROGRAM_PATH` | 小程序跳转路径 | `/pages/scan/index/index` |
| `VITE_WECHAT_JS_CONFIG_URL` | 微信 JS-SDK 配置接口 | 空 |

常用 URL 参数（覆盖环境变量）：`mode`（`borrow`/`return`）、`boardId`/`cabinetId`、`source`、`wsUrl`、`pollUrl`、`ttl`、`timeout`、`appId`、`mpPath`、`sid`、`allowLocalQr` 等。

柜机 ID 默认固定为 `2441`（`FIXED_CABINET_ID`），可被 URL 参数或管理员配置覆盖。
