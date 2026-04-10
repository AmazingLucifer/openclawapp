<template>
  <div class="h-full flex flex-col bg-black text-white">
    <!-- 顶栏 -->
    <div class="flex items-center gap-4 px-6 py-4 border-b border-zinc-800">
      <button @click="$emit('back')" class="text-gray-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <span class="text-base font-medium">设置</span>
    </div>

    <!-- 设置内容 -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- VIP 套餐 -->
      <div>
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">我的套餐</h3>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-lg font-medium" :class="vipTextClass">{{ vipLabel }}</span>
            <span class="text-xs text-gray-500">到期: {{ user.expiresAt || '永久' }}</span>
          </div>
          <p class="text-sm text-gray-500 mb-4">{{ currentPackage?.features || '基础AI对话' }}</p>
          <button
            v-if="user.vipLevel !== 'team'"
            @click="showUpgrade = true"
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white text-sm font-medium transition-opacity"
          >
            升级套餐，解锁更多AI
          </button>
        </div>
      </div>

      <!-- AI 通道 -->
      <div>
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">AI 通道</h3>
        <div class="space-y-2">
          <div
            v-for="aiItem in availableAIs"
            :key="aiItem.id"
            class="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ aiItem.icon }}</span>
              <div>
                <div class="text-sm font-medium">{{ aiItem.name }}</div>
                <div class="text-xs text-gray-500">{{ aiItem.direction }}</div>
              </div>
            </div>
            <span class="text-xs text-green-400">已开通</span>
          </div>

          <div
            v-for="i in lockedCount"
            :key="'locked-' + i"
            class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 flex items-center justify-between opacity-50"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">🔒</span>
              <div>
                <div class="text-sm text-gray-500">更多AI通道</div>
                <div class="text-xs text-gray-600">升级套餐解锁</div>
              </div>
            </div>
            <span class="text-xs text-gray-600">未解锁</span>
          </div>
        </div>
      </div>

      <!-- 账户信息 -->
      <div>
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">账户信息</h3>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">手机号</span>
            <span class="text-sm">{{ user.phone }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">VIP 等级</span>
            <span class="text-sm" :class="vipTextClass">{{ vipLabel }}</span>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div>
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">关于</h3>
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">版本</span>
            <span class="text-sm">v1.0.0</span>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <button
        @click="logout"
        class="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
      >
        退出登录
      </button>
    </div>

    <!-- 升级弹窗 -->
    <div v-if="showUpgrade" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" @click.self="showUpgrade = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6">
        <h3 class="text-lg font-medium mb-4">选择套餐</h3>
        <div class="space-y-3 mb-6">
          <div
            v-for="pkg in packages"
            :key="pkg.level"
            @click="selectedLevel = pkg.level"
            class="p-4 rounded-xl border-2 cursor-pointer transition-colors"
            :class="selectedLevel === pkg.level ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700'"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ pkg.name }}</span>
              <span class="text-blue-400">¥{{ pkg.price_yuan }}/月</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ pkg.features }}</p>
          </div>
        </div>
        <p class="text-xs text-gray-500 text-center mb-4">支付功能即将上线，请联系客服开通</p>
        <button
          @click="showUpgrade = false"
          class="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { auth } from '../api/server.js'

const emit = defineEmits(['back', 'logout', 'vip-updated'])

const user = ref({ phone: '', vipLevel: 'free', expiresAt: null })
const packages = ref([])
const availableAIs = ref([])
const showUpgrade = ref(false)
const selectedLevel = ref('pro')

const currentPackage = computed(() => packages.value.find(p => p.level === user.value.vipLevel))

const vipLabel = computed(() => {
  const map = { free: '免费版', basic: '基础版', pro: '高级版', team: '团队版' }
  return map[user.value.vipLevel] || '免费版'
})

const vipTextClass = computed(() => {
  const map = {
    free: 'text-gray-400',
    basic: 'text-blue-400',
    pro: 'text-purple-400',
    team: 'text-amber-400',
  }
  return map[user.value.vipLevel] || map.free
})

const lockedCount = computed(() => {
  const limits = { free: 2, basic: 0, pro: 0, team: 0 }
  return limits[user.value.vipLevel] || 0
})

async function loadData() {
  try {
    const userInfo = await auth.getUserInfo()
    user.value = {
      phone: userInfo.phone,
      vipLevel: userInfo.vipLevel,
      expiresAt: userInfo.expiresAt,
    }
    packages.value = userInfo.packages || []
  } catch (err) {
    console.error('加载失败:', err)
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  emit('logout')
}

onMounted(() => {
  loadData()
})
</script>
