# OpenClaw Desktop App

## 目录结构

```
openclaw-desktop/
│
├── web/                    ← 🟢 我写的：Vue3 前端界面
│   ├── src/
│   │   ├── App.vue         ← 主界面（侧边栏 + 聊天）
│   │   ├── views/
│   │   │   ├── Login.vue   ← 登录页
│   │   │   └── Settings.vue← 设置页（VIP/AI通道）
│   │   └── api/
│   │       └── server.js   ← 后端 API 调用
│   └── package.json
│
├── server/                ← 🟢 我写的：Express 后端（SaaS服务）
│   └── index.js           ← 账户系统 + VIP管理 + AI转发
│
├── electron/              ← 🟢 我写的：Electron 桌面包装
│   ├── main.js           ← 主进程（启动 openclaw-agent）
│   └── preload.js        ← 安全桥接
│
├── openclaw-agent/        ← 🔵 OpenClaw 官方 Agent（可替换）
│   └── openclaw/         ← 实际的 AI 对话核心
│
└── package.json          ← Electron 打包配置
```

## 如果你想替换 OpenClaw Agent

把 `openclaw-agent/openclaw/` 整个目录替换成新的 Agent，保持 `electron/main.js` 不动即可。

## 如果你想替换 UI

修改 `web/` 目录下的 Vue 文件，不影响其他部分。

## 如果你想替换后端 SaaS

修改 `server/index.js`，前端 `web/src/api/server.js` 里的接口不变即可。
