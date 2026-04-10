# OpenClaw Desktop App

一键安装包：将 OpenClaw AI 助手打包为桌面应用，双击即可使用。

## 功能

- 包含完整 Node.js 环境，无需预先安装
- OpenClaw 后台服务自动启动
- 原生 Windows 桌面窗口，对话即用
- NSIS 安装程序，可自定义安装路径

## 开发

### 本地开发
```bash
npm install
npm start
```

### 构建安装包
```bash
npm run build
```
输出：`dist/OpenClaw Setup 1.0.0.exe`

## CI/CD 自动构建

推送到 GitHub 后，GitHub Actions 自动在 Windows 最新版 runner 上构建，产出 `.exe` 安装包。

### 构建产物
- **OpenClaw Setup x.x.x.exe** — NSIS 安装包，用户下载安装用
- **win-unpacked/** — 便携版，解压即用

## 项目结构

```
openclaw-app/
├── .github/workflows/build.yml   ← GitHub Actions 构建配置
├── main.js                       ← Electron 主进程
├── package.json                  ← 项目配置 + 构建配置
└── build/
    └── icon.ico                  ← 应用图标（可选）
```

## 注意事项

- 构建在 GitHub Windows-hosted runner 上进行，不需要本地配环境
- `dist/` 目录不要提交，由 CI 自动生成
