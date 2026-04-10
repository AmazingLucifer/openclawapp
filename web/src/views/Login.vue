<template>
  <div class="h-full flex items-center justify-center bg-black">
    <div class="w-full max-w-sm p-8">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">🦞</span>
        </div>
        <h1 class="text-2xl font-semibold text-white">OpenClaw</h1>
        <p class="text-gray-500 text-sm mt-1">AI 智能助手</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        {{ errorMsg }}
      </div>

      <!-- 登录表单 -->
      <div class="space-y-4">
        <!-- 手机号 -->
        <div>
          <input
            v-model="phone"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
            class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <!-- 验证码 -->
        <div class="flex gap-3">
          <input
            v-model="code"
            type="text"
            maxlength="6"
            placeholder="请输入验证码"
            class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            @click="sendCode"
            :disabled="countdown > 0"
            class="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors whitespace-nowrap"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>

        <!-- 登录按钮 -->
        <button
          @click="login"
          :disabled="loading"
          class="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium text-sm transition-colors"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <!-- 分割线 -->
        <div class="flex items-center gap-4 my-6">
          <div class="flex-1 h-px bg-zinc-800"></div>
          <span class="text-gray-600 text-xs">其他登录方式</span>
          <div class="flex-1 h-px bg-zinc-800"></div>
        </div>

        <!-- 微信登录 -->
        <button
          @click="wechatLogin"
          class="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
          </svg>
          微信登录
        </button>
      </div>

      <!-- 底部协议 -->
      <p class="text-center text-gray-600 text-xs mt-8">
        登录即表示同意
        <span class="text-blue-500">《用户协议》</span> 和
        <span class="text-blue-500">《隐私政策》</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { auth } from '../api/server.js'

const emit = defineEmits(['login-success'])

const phone = ref('')
const code = ref('')
const loading = ref(false)
const countdown = ref(0)
const errorMsg = ref('')

async function sendCode() {
  if (countdown.value > 0) return
  if (!phone.value || phone.value.length !== 11) {
    errorMsg.value = '请输入正确的11位手机号'
    return
  }
  errorMsg.value = ''
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)

  try {
    await auth.sendCode(phone.value)
  } catch (err) {
    errorMsg.value = err || '发送失败'
  }
}

async function login() {
  if (!phone.value || !code.value) {
    errorMsg.value = '请输入手机号和验证码'
    return
  }
  errorMsg.value = ''
  loading.value = true

  try {
    const data = await auth.login(phone.value, code.value)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    emit('login-success')
  } catch (err) {
    errorMsg.value = err || '登录失败，请检查验证码'
  } finally {
    loading.value = false
  }
}

function wechatLogin() {
  errorMsg.value = '微信登录功能即将上线'
}
</script>
