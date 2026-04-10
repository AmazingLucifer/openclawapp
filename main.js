const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let openclawProcess = null
let mainWindow = null

const GATEWAY_PORT = 32935
const GATEWAY_TOKEN = 'f82200ab502dd424fd51b75ac1f7106e926dca9339999ba6'
const GATEWAY_BASE_PATH = '/qajz5p'

function getOpenClawCommand() {
  const openclawExe = path.join(__dirname, 'node_modules', '.bin', 'openclaw')
  return openclawExe
}

function startOpenClaw() {
  console.log('[OpenClaw] Starting gateway...')

  openclawProcess = spawn('node', [getOpenClawCommand(), 'gateway', '--port', String(GATEWAY_PORT)], {
    cwd: __dirname,
    detached: false,
    stdio: 'pipe',
    env: {
      ...process.env,
      OPENCLAW_GATEWAY__AUTH__TOKEN: GATEWAY_TOKEN,
      OPENCLAW_GATEWAY__CONTROL_UI__BASE_PATH: GATEWAY_BASE_PATH,
    }
  })

  openclawProcess.stdout.on('data', (data) => {
    process.stdout.write('[openclaw] ' + data)
  })

  openclawProcess.stderr.on('data', (data) => {
    process.stderr.write('[openclaw:err] ' + data)
  })

  openclawProcess.on('error', (err) => {
    console.error('[OpenClaw] Failed to start:', err)
  })

  openclawProcess.on('exit', (code) => {
    console.log('[OpenClaw] Gateway exited with code:', code)
  })
}

function createWindow() {
  const controlUiUrl = `http://localhost:${GATEWAY_PORT}${GATEWAY_BASE_PATH}`

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'OpenClaw',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadURL(controlUiUrl)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  startOpenClaw()

  // 等待 gateway 就绪（简单等3秒）
  setTimeout(() => {
    createWindow()
  }, 3000)
})

app.on('window-all-closed', () => {
  if (openclawProcess) {
    openclawProcess.kill()
  }
  app.quit()
})

app.on('before-quit', () => {
  if (openclawProcess) {
    openclawProcess.kill()
  }
})
