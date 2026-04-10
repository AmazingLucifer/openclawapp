import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// 请求拦截器：自动带上 Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理错误
api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.reload()
    }
    return Promise.reject(err.response?.data?.error || err.message)
  }
)

// ========== 认证 ==========
export const auth = {
  sendCode: (phone) => api.post('/api/auth/send-code', { phone }),
  login: (phone, code) => api.post('/api/auth/login', { phone, code }),
  wechatLogin: (code) => api.post('/api/auth/wechat', { code }),
  getUserInfo: () => api.get('/api/user/info'),
}

// ========== AI ==========
export const ai = {
  getChannels: () => api.get('/api/ai/channels'),
  chat: (aiType, messages) => api.post('/api/chat', { aiType, messages }),
}

export default api
