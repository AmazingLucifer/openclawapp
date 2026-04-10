import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'openclaw-secret-key-change-in-production'
const JWT_EXPIRES = '7d'

// 数据库
const db = new Database(path.join(__dirname, 'db', 'openclaw.db'))

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT,
    wechat_openid TEXT UNIQUE,
    vip_level TEXT DEFAULT 'free',
    expires_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS vip_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    price_yuan INTEGER NOT NULL,
    ai_channels INTEGER DEFAULT 1,
    daily_limit INTEGER DEFAULT 100,
    features TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ai_type TEXT NOT NULL,
    messages TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_url TEXT,
    enabled INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch())
  );
`)

// 初始化 VIP 套餐
const initPackages = [
  { name: '免费版', level: 'free', price_yuan: 0, ai_channels: 1, daily_limit: 20, features: '基础AI对话', sort_order: 0 },
  { name: '基础版', level: 'basic', price_yuan: 30, ai_channels: 3, daily_limit: 500, features: '3个AI通道，无限对话', sort_order: 1 },
  { name: '高级版', level: 'pro', price_yuan: 80, ai_channels: 10, daily_limit: -1, features: '全部AI通道，高速线路', sort_order: 2 },
  { name: '团队版', level: 'team', price_yuan: 200, ai_channels: -1, daily_limit: -1, features: '无限AI通道，优先客服', sort_order: 3 },
]

const insertPackage = db.prepare(`
  INSERT OR IGNORE INTO vip_packages (name, level, price_yuan, ai_channels, daily_limit, features, sort_order)
  VALUES (@name, @level, @price_yuan, @ai_channels, @daily_limit, @features, @sort_order)
`)
for (const pkg of initPackages) insertPackage.run(pkg)

// 初始化测试管理员账户
const testUser = db.prepare('SELECT id FROM users WHERE phone = ?').get('13800138000')
if (!testUser) {
  db.prepare(`INSERT INTO users (phone, vip_level) VALUES (?, 'free')`).run('13800138000')
}

// 中间件
app.use(cors())
app.use(express.json())

// 验证 token 中间件
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' })
  }
  const token = auth.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.vipLevel = decoded.vipLevel
    req.userPhone = decoded.phone
    next()
  } catch {
    return res.status(401).json({ error: 'Token 无效' })
  }
}

// VIP 权限验证
function checkVipAccess(requiredLevel) {
  const levels = { free: 0, basic: 1, pro: 2, team: 3 }
  return levels[req.vipLevel] >= levels[requiredLevel]
}

// ========== 认证路由 ==========

// 发送验证码（测试环境固定返回 123456）
app.post('/api/auth/send-code', (req, res) => {
  const { phone } = req.body
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' })
  }
  // 实际生产环境这里调用短信网关
  res.json({ success: true, message: '验证码已发送', code: '123456' })
})

// 手机号登录
app.post('/api/auth/login', async (req, res) => {
  const { phone, code } = req.body
  if (!phone || !code) {
    return res.status(400).json({ error: '请输入手机号和验证码' })
  }

  // 测试验证码
  if (code !== '123456') {
    return res.status(401).json({ error: '验证码错误' })
  }

  // 查找或创建用户
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
  if (!user) {
    const result = db.prepare('INSERT INTO users (phone, vip_level) VALUES (?, ?)').run(phone, 'free')
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
  }

  const token = jwt.sign(
    { userId: user.id, vipLevel: user.vip_level, phone: user.phone },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      vipLevel: user.vip_level,
      expiresAt: user.expires_at ? new Date(user.expires_at * 1000).toISOString() : null,
    }
  })
})

// 微信登录（预留）
app.post('/api/auth/wechat', (req, res) => {
  const { code } = req.body
  // TODO: 调用微信 API 换取 openid
  res.status(501).json({ error: '微信登录即将上线' })
})

// 获取当前用户信息
app.get('/api/user/info', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: '用户不存在' })

  const packages = db.prepare('SELECT * FROM vip_packages ORDER BY sort_order').all()
  const currentPackage = packages.find(p => p.level === user.vip_level)

  res.json({
    id: user.id,
    phone: user.phone,
    vipLevel: user.vip_level,
    expiresAt: user.expires_at ? new Date(user.expires_at * 1000).toISOString() : null,
    package: currentPackage,
    packages,
  })
})

// ========== AI 聊天路由 ==========

// 可用 AI 列表（根据 VIP 等级）
app.get('/api/ai/channels', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT vip_level FROM users WHERE id = ?').get(req.userId)
  const level = user?.vip_level || 'free'

  // VIP 等级对应的 AI 通道数量
  const channelLimits = { free: 1, basic: 3, pro: 10, team: 999 }

  const availableAIs = [
    { id: 'assistant', name: '全能助手', icon: '🤖', provider: 'assistant', direction: '通用对话', enabled: true },
    { id: 'claude', name: 'Claude', icon: '🧠', provider: 'claude', direction: '编程开发', enabled: level !== 'free' },
    { id: 'gpt-4', name: 'GPT-4', icon: '🎨', provider: 'gpt-4', direction: '创意写作', enabled: level !== 'free' },
    { id: 'gpt-4o', name: 'GPT-4o', icon: '✨', provider: 'gpt-4o', direction: '高速智能', enabled: level === 'pro' || level === 'team' },
    { id: 'deepseek', name: 'DeepSeek', icon: '💡', provider: 'deepseek', direction: '知识问答', enabled: level !== 'free' },
    { id: 'gemini', name: 'Gemini', icon: '🌟', provider: 'gemini', direction: '多模态', enabled: level === 'team' },
  ]

  const maxChannels = channelLimits[level] || 1
  const enabledAIs = availableAIs.slice(0, maxChannels).map(ai => ({ ...ai, enabled: true }))

  res.json({ channels: enabledAIs, maxChannels })
})

// 聊天转发
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { aiType, messages } = req.body

  if (!aiType || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '参数错误' })
  }

  // 验证用户 VIP 能否使用该 AI
  const user = db.prepare('SELECT vip_level FROM users WHERE id = ?').get(req.userId)
  const aiAccessMap = {
    assistant: ['free', 'basic', 'pro', 'team'],
    claude: ['basic', 'pro', 'team'],
    'gpt-4': ['basic', 'pro', 'team'],
    'gpt-4o': ['pro', 'team'],
    deepseek: ['basic', 'pro', 'team'],
    gemini: ['team'],
  }

  if (!aiAccessMap[aiType]?.includes(user.vip_level)) {
    return res.status(403).json({ error: '当前VIP等级不支持该AI，请升级' })
  }

  // 获取 AI 配置
  const apiKey = db.prepare('SELECT api_key, api_url FROM api_keys WHERE provider = ? AND enabled = 1').get(aiType)
  if (!apiKey) {
    return res.status(503).json({ error: '该AI通道暂不可用' })
  }

  try {
    let result

    if (aiType === 'assistant') {
      // 全能助手 - 简单回复
      const lastMsg = messages[messages.length - 1]?.content || ''
      result = { message: { content: `【全能助手】收到: ${lastMsg}\n\n当前为测试模式，AI服务即将上线。` } }
    } else if (aiType === 'claude') {
      // Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.api_key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await response.json()
      result = { message: { content: data.content?.[0]?.text || 'Claude 响应异常' } }
    } else if (aiType === 'gpt-4' || aiType === 'gpt-4o') {
      // OpenAI API
      const model = aiType === 'gpt-4o' ? 'gpt-4o' : 'gpt-4-turbo'
      const response = await fetch((apiKey.api_url || 'https://api.openai.com/v1') + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.api_key}`,
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await response.json()
      result = { message: { content: data.choices?.[0]?.message?.content || 'OpenAI 响应异常' } }
    } else if (aiType === 'deepseek') {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.api_key}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await response.json()
      result = { message: { content: data.choices?.[0]?.message?.content || 'DeepSeek 响应异常' } }
    } else {
      return res.status(400).json({ error: '不支持的 AI 类型' })
    }

    // 记录日志
    db.prepare(`INSERT INTO chat_logs (user_id, ai_type, messages) VALUES (?, ?, ?)`)
      .run(req.userId, aiType, JSON.stringify(messages))

    res.json(result)
  } catch (err) {
    console.error(`[${aiType}] Error:`, err)
    res.status(500).json({ error: 'AI 服务调用失败: ' + err.message })
  }
})

// ========== 管理后台 ==========

// 管理员验证
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.slice(7)
  if (!token) return res.status(401).json({ error: '未授权' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    // 简单管理员验证（生产环境需要单独的管理员账号）
    if (decoded.phone !== '13800138000') {
      return res.status(403).json({ error: '无管理员权限' })
    }
    next()
  } catch {
    res.status(401).json({ error: 'Token 无效' })
  }
}

// 用户列表
app.get('/api/admin/users', adminAuth, (req, res) => {
  const users = db.prepare(`
    SELECT id, phone, vip_level, expires_at, created_at FROM users ORDER BY created_at DESC
  `).all()
  res.json({ users })
})

// 更新用户 VIP
app.post('/api/admin/users/:id/vip', adminAuth, (req, res) => {
  const { id } = req.params
  const { level, days } = req.body

  const validLevels = ['free', 'basic', 'pro', 'team']
  if (!validLevels.includes(level)) {
    return res.status(400).json({ error: '无效的 VIP 等级' })
  }

  let expiresAt = null
  if (days > 0) {
    expiresAt = Math.floor(Date.now() / 1000) + days * 86400
  }

  db.prepare('UPDATE users SET vip_level = ?, expires_at = ?, updated_at = unixepoch() WHERE id = ?')
    .run(level, expiresAt, id)

  res.json({ success: true })
})

// 添加/更新 API Key
app.post('/api/admin/api-keys', adminAuth, (req, res) => {
  const { name, provider, apiKey, apiUrl } = req.body
  if (!name || !provider || !apiKey) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  const existing = db.prepare('SELECT id FROM api_keys WHERE provider = ?').get(provider)
  if (existing) {
    db.prepare('UPDATE api_keys SET name = ?, api_key = ?, api_url = ? WHERE provider = ?')
      .run(name, apiKey, apiUrl || null, provider)
  } else {
    db.prepare('INSERT INTO api_keys (name, provider, api_key, api_url) VALUES (?, ?, ?, ?)')
      .run(name, apiKey, apiUrl || null, provider)
  }

  res.json({ success: true })
})

// API Key 列表
app.get('/api/admin/api-keys', adminAuth, (req, res) => {
  const keys = db.prepare('SELECT id, name, provider, api_url, enabled, created_at FROM api_keys').all()
  res.json({ keys })
})

app.listen(PORT, () => {
  console.log(`[OpenClaw Server] 运行在 http://localhost:${PORT}`)
  console.log(`[测试账户] 手机号: 13800138000  验证码: 123456`)
  console.log(`[管理员] 手机号: 13800138000  验证码: 123456`)
})
