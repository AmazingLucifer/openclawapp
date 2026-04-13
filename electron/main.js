const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

let openclawProcess = null
let serverProcess = null
let mainWindow = null

const GATEWAY_PORT = 32935
const GATEWAY_TOKEN = 'f82200ab502dd424fd51b75ac1f7106e926dca9339999ba6'
const GATEWAY_BASE_PATH = '/qajz5p'
const SERVER_PORT = 3001

function startServer() {
  console.log('[SaaS] Starting server...')

  // server 目录（electron 同级目录 server/）
  const serverDir = path.join(__dirname, '..', 'server')
  const serverIndex = path.join(serverDir, 'index.js')

  // 检查 server 目录是否存在
  if (!fs.existsSync(serverDir)) {
    console.error('[SaaS] Server directory not found:', serverDir)
    return
  }

  // 检查是否有打包的 server.exe（Windows 一键安装包模式）
  const serverExe = path.join(serverDir, 'server.exe')
  if (process.platform === 'win32' && fs.existsSync(serverExe)) {
    console.log('[SaaS] Using bundled server.exe')
    serverProcess = spawn(serverExe, [], {
      cwd: serverDir,
      detached: false,
      stdio: 'pipe',
      env: { ...process.env, PORT: String(SERVER_PORT) }
    })
  } else {
    // 开发模式：使用 node 运行
    console.log('[SaaS] Starting with node:', serverIndex)
    serverProcess = spawn('node', [serverIndex], {
      cwd: serverDir,
      detached: false,
      stdio: 'pipe',
      env: { ...process.env, PORT: String(SERVER_PORT) }
    })
  }

  serverProcess.stdout.on('data', (data) => process.stdout.write('[server] ' + data))
  serverProcess.stderr.on('data', (data) => process.stderr.write('[server:err] ' + data))
  serverProcess.on('error', (err) => console.error('[SaaS] Failed to start:', err))
  serverProcess.on('exit', (code) => console.log('[SaaS] Server exited with code:', code))
}

function startOpenClaw() {
  console.log('[OpenClaw] Starting gateway...')

  // OpenClaw Agent 路径（electron 同级目录 openclaw-agent/openclaw/）
  const openclawBin = path.join(__dirname, '..', 'openclaw-agent', 'openclaw', 'openclaw.mjs')

  openclawProcess = spawn('node', [openclawBin, 'gateway', '--port', String(GATEWAY_PORT)], {
    cwd: path.join(__dirname, '..'),
    detached: false,
    stdio: 'pipe',
    env: {
      ...process.env,
      OPENCLAW_GATEWAY__AUTH__TOKEN: GATEWAY_TOKEN,
      OPENCLAW_GATEWAY__CONTROL_UI__BASE_PATH: GATEWAY_BASE_PATH,
    }
  })

  openclawProcess.stdout.on('data', (data) => process.stdout.write('[openclaw] ' + data))
  openclawProcess.stderr.on('data', (data) => process.stderr.write('[openclaw:err] ' + data))
  openclawProcess.on('error', (err) => console.error('[OpenClaw] Failed to start:', err))
  openclawProcess.on('exit', (code) => console.log('[OpenClaw] Gateway exited with code:', code))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'OpenClaw',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
    show: false,
    frame: true,
    titleBarStyle: 'default',
  })

  // 开发模式：加载本地 Vue dev server
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式：加载打包后的 Vue 应用
    mainWindow.loadFile(path.join(__dirname, '..', 'web', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    console.log('[Window] Ready and shown')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // 启动 SaaS 后端
  startServer()
  
  // 启动 OpenClaw gateway
  startOpenClaw()

  // 等待服务就绪
  setTimeout(() => {
    createWindow()
  }, 5000)
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (openclawProcess) openclawProcess.kill()
  app.quit()
})

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill()
  if (openclawProcess) openclawProcess.kill()
})

// IPC 通道：前端获取 token
ipcMain.handle('get-token', () => GATEWAY_TOKEN)
ipcMain.handle('get-port', () => GATEWAY_PORT)
ipcMain.handle('get-base-path', () => GATEWAY_BASE_PATH)
