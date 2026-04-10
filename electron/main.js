const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let openclawProcess = null
let mainWindow = null

const GATEWAY_PORT = 32935
const GATEWAY_TOKEN = 'f82200ab502dd424fd51b75ac1f7106e926dca9339999ba6'
const GATEWAY_BASE_PATH = '/qajz5p'

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
  startOpenClaw()

  // 等待 gateway 就绪
  setTimeout(() => {
    createWindow()
  }, 4000)
})

app.on('window-all-closed', () => {
  if (openclawProcess) openclawProcess.kill()
  app.quit()
})

app.on('before-quit', () => {
  if (openclawProcess) openclawProcess.kill()
})

// IPC 通道：前端获取 token
ipcMain.handle('get-token', () => GATEWAY_TOKEN)
ipcMain.handle('get-port', () => GATEWAY_PORT)
ipcMain.handle('get-base-path', () => GATEWAY_BASE_PATH)
