<template>
  <div class="h-full flex flex-col bg-black text-white">

    <!-- 登录页 -->
    <Login v-if="!isLoggedIn" @login-success="onLoginSuccess" />

    <!-- 设置页 -->
    <Settings v-else-if="showSettings" @back="showSettings = false" @logout="onLogout" />

    <!-- 主界面 -->
    <template v-else>
      <!-- 顶栏 -->
      <header class="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <span class="text-sm">🦞</span>
          </div>
          <span class="text-sm font-medium">OpenClaw</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- VIP 状态 -->
          <span class="text-xs px-2 py-0.5 rounded-full" :class="vipClass">
            {{ vipLabel }}
          </span>

          <!-- 账户菜单 -->
          <div class="relative">
            <button
              @click="showAccountMenu = !showAccountMenu"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              <div class="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                <span class="text-xs">{{ user.phone ? user.phone.slice(-2) : '?' }}</span>
              </div>
              <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div
              v-if="showAccountMenu"
              class="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20"
            >
              <div class="px-4 py-3 border-b border-zinc-800">
                <p class="text-xs text-gray-500">已登录</p>
                <p class="text-sm font-medium mt-0.5">{{ user.phone }}</p>
              </div>
              <button
                @click="showSettings = true; showAccountMenu = false"
                class="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.786.426 1.786 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.786-.426-1.786-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                设置
              </button>
              <button
                @click="logout"
                class="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- 主内容 -->
      <div class="flex-1 flex overflow-hidden">

        <!-- 侧边栏 -->
        <aside class="w-56 bg-zinc-950/50 border-r border-zinc-800 flex flex-col flex-shrink-0">

          <!-- 新对话按钮 -->
          <div class="p-3">
            <button
              @click="newChat"
              class="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              新对话
            </button>
          </div>

          <!-- AI 选项卡 -->
          <div class="px-3 pb-2">
            <p class="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2">AI 通道</p>
            <div class="space-y-0.5">
              <button
                v-for="aiItem in availableAIs"
                :key="aiItem.id"
                @click="selectAI(aiItem.id)"
                class="w-full px-3 py-2 rounded-xl text-left text-sm transition-colors flex items-center gap-2"
                :class="currentAI === aiItem.id ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-zinc-900'"
              >
                <span class="text-base">{{ aiItem.icon }}</span>
                <div class="flex-1 truncate">
                  <div>{{ aiItem.name }}</div>
                  <div class="text-xs text-gray-600">{{ aiItem.direction }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- 底部对话历史 -->
          <div class="flex-1 overflow-y-auto px-3 pb-3">
            <p class="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2 mt-2">历史记录</p>
            <div class="space-y-0.5">
              <button
                v-for="chat in chatHistory"
                :key="chat.id"
                @click="loadChat(chat.id)"
                class="w-full px-3 py-2 rounded-xl text-left text-sm text-gray-400 hover:bg-zinc-900 hover:text-white transition-colors truncate"
                :class="currentChatId === chat.id ? 'bg-zinc-900 text-white' : ''"
              >
                {{ chat.title }}
              </button>
            </div>
          </div>
        </aside>

        <!-- 聊天区域 -->
        <main class="flex-1 flex flex-col overflow-hidden">

          <!-- 空状态 -->
          <div v-if="messages.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div class="text-5xl mb-4 opacity-30">🦞</div>
            <p class="text-base font-medium text-gray-600">{{ currentAIName }}</p>
            <p class="text-sm mt-1">开始新对话吧</p>
          </div>

          <!-- 消息列表 -->
          <div v-else ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-5">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex gap-3 max-w-2xl"
              :class="msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''"
            >
              <!-- 头像 -->
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-medium flex-shrink-0"
                :class="msg.role === 'user' ? 'bg-blue-500/20' : 'bg-zinc-800'"
              >
                {{ msg.role === 'user' ? user.phone?.slice(-2) : currentAIIcon }}
              </div>

              <!-- 消息内容 -->
              <div
                class="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                :class="msg.role === 'user'
                  ? 'bg-blue-500/20 text-blue-100 rounded-tr-sm max-w-md'
                  : 'bg-zinc-900 rounded-tl-sm'"
              >
                <div v-if="msg.isStreaming" class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
                <div v-else class="whitespace-pre-wrap">{{ msg.content }}</div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="p-4 border-t border-zinc-800/50">
            <div class="flex gap-3 items-end bg-zinc-900/80 backdrop-blur rounded-2xl px-4 py-3 border border-zinc-800/50">
              <textarea
                v-model="inputText"
                @keydown.enter.exact.prevent="sendMessage"
                placeholder="发送消息..."
                rows="1"
                class="flex-1 bg-transparent text-sm resize-none outline-none placeholder-gray-600 max-h-40"
              ></textarea>
              <button
                @click="sendMessage"
                :disabled="!inputText.trim() || sending"
                class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                :class="inputText.trim() && !sending ? 'bg-blue-500 hover:bg-blue-600' : 'bg-zinc-800 cursor-not-allowed'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- 点击空白关闭菜单 -->
    <div v-if="showAccountMenu" class="fixed inset-0 z-10" @click="showAccountMenu = false"></div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import Login from './views/Login.vue'
import Settings from './views/Settings.vue'
import { auth, ai } from './api/server.js'

const isLoggedIn = ref(false)
const showSettings = ref(false)
const showAccountMenu = ref(false)
const user = ref({ phone: '', vipLevel: 'free', expiresAt: null })
const messagesContainer = ref(null)

const inputText = ref('')
const messages = ref([])
const chatHistory = ref([{ id: 1, title: '新对话', aiId: 'assistant' }])
const currentChatId = ref(1)
const sending = ref(false)
const availableAIs = ref([{ id: 'assistant', name: '全能助手', icon: '🤖', direction: '通用对话' }])
const currentAI = ref('assistant')
let chatIdCounter = 1

const currentAIName = computed(() => availableAIs.value.find(a => a.id === currentAI.value)?.name || 'AI')
const currentAIIcon = computed(() => availableAIs.value.find(a => a.id === currentAI.value)?.icon || '🤖')

const vipLabel = computed(() => {
  const map = { free: '免费版', basic: '基础版', pro: '高级版', team: '团队版' }
  return map[user.value.vipLevel] || '免费版'
})
const vipClass = computed(() => {
  const map = {
    free: 'bg-zinc-800 text-gray-500',
    basic: 'bg-blue-500/20 text-blue-400',
    pro: 'bg-purple-500/20 text-purple-400',
    team: 'bg-amber-500/20 text-amber-400',
  }
  return map[user.value.vipLevel] || map.free
})

async function loadUserInfo() {
  try {
    const data = await auth.getUserInfo()
    user.value = { phone: data.phone, vipLevel: data.vipLevel, expiresAt: data.expiresAt }
    await loadAIChannels()
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
}

async function loadAIChannels() {
  try {
    const data = await ai.getChannels()
    availableAIs.value = data.channels.filter(c => c.enabled)
  } catch (err) {
    console.error('获取AI通道失败:', err)
  }
}

async function onLoginSuccess() {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (token && userData) {
    user.value = JSON.parse(userData)
    isLoggedIn.value = true
    await loadAIChannels()
  }
}

function onLogout() {
  isLoggedIn.value = false
  showSettings.value = false
  messages.value = []
  chatHistory.value = [{ id: 1, title: '新对话', aiId: 'assistant' }]
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  onLogout()
}

function selectAI(id) {
  currentAI.value = id
  messages.value = []
}

function newChat() {
  chatIdCounter++
  chatHistory.value.unshift({ id: chatIdCounter, title: '新对话', aiId: currentAI.value })
  currentChatId.value = chatIdCounter
  messages.value = []
}

function loadChat(id) {
  currentChatId.value = id
  messages.value = []
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  inputText.value = ''
  chatIdCounter++

  messages.value.push({ id: Date.now(), role: 'user', content: text, isStreaming: false })

  const aiMsgId = Date.now() + 1
  messages.value.push({ id: aiMsgId, role: 'assistant', content: '', isStreaming: true })

  sending.value = true
  scrollToBottom()

  try {
    const result = await ai.chat(currentAI.value, messages.value.filter(m => !m.isStreaming).map(m => ({ role: m.role, content: m.content })))
    const aiMsg = messages.value.find(m => m.id === aiMsgId)
    if (aiMsg) {
      aiMsg.content = result.message?.content || result.text || '收到响应但内容为空'
      aiMsg.isStreaming = false
    }
  } catch (err) {
    const aiMsg = messages.value.find(m => m.id === aiMsgId)
    if (aiMsg) {
      aiMsg.content = '发生错误: ' + (err || '未知错误')
      aiMsg.isStreaming = false
    }
  }

  sending.value = false
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (token && userData) {
    user.value = JSON.parse(userData)
    isLoggedIn.value = true
    await loadAIChannels()
  }
})
</script>

<style scoped>
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #6366f1;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}
.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
