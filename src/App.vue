<template>
  <RouterView v-slot="{ Component }">
    <transition>
      <component :is="Component" />
    </transition>
  </RouterView>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import { RouterView } from 'vue-router'
import { useStore } from 'vuex'

const store = useStore()

function getSettings() {
  store.commit('setKey', { value: JSON.parse(localStorage.getItem('key')), mode: 0 })
  store.commit('setSheetId', { value: JSON.parse(localStorage.getItem('sheetId')), mode: 0 })
  store.commit('setNome', { value: JSON.parse(localStorage.getItem('nome')) || '', mode: 0 })
}
onBeforeMount(getSettings)

/* document.addEventListener('contextmenu', (event) => event.preventDefault())

document.addEventListener('keydown', (event) => {
  if (
    event.key === 'F12' ||
    (event.ctrlKey && event.shiftKey && event.key === 'I') ||
    (event.ctrlKey && event.key === 'J') ||
    (event.ctrlKey && event.key === 'U')
  ) {
    event.preventDefault()
  }
})

function detectDevTools() {
  const devToolsCheck = new Function('debugger')
  let isDevToolsOpen = false

  // Debugger timing check
  setInterval(() => {
    const start = performance.now()
    devToolsCheck()
    const end = performance.now()
    if (end - start > 50) {
      // Lowered threshold for sensitivity
      if (!isDevToolsOpen) {
        console.warn('DevTools detected! The app will stop.')
        isDevToolsOpen = true
        stopApp()
      }
    } else {
      isDevToolsOpen = false
    }
  }, 500)

  // Mobile dev tools detection
  setInterval(() => {
    const suspiciousGlobals = ['eruda', 'VConsole', 'devtools', '_debug']
    const suspiciousElements = ['#eruda', '.vconsole', '.debug-panel']
    if (
      suspiciousGlobals.some((g) => typeof window[g] !== 'undefined') ||
      suspiciousElements.some((e) => document.querySelector(e))
    ) {
      if (!isDevToolsOpen) {
        console.warn('Mobile DevTools extension detected! The app will stop.')
        isDevToolsOpen = true
        stopApp()
      }
    }
  }, 500)

  // Integrity check for tampering
  setInterval(() => {
    if (!detectDevTools.toString().includes('debugger')) {
      stopApp() // Code was tampered with
    }
  }, 1000)
}

function stopApp() {
  window.fetch = () => Promise.reject(new Error('Network disabled'))
  window.XMLHttpRequest = function () {
    throw new Error('Network disabled')
  }
  //const displayHeight = window.innerHeight
  //const displayWidth = window.innerWidth
  //document.body.innerHTML = `<div class="color" style="height:${displayHeight}px;width:${displayWidth}px;text-align:center;display:flex;justify-content:center;align-items:center"><h1>Unauthorized Access</h1></div>`
  window.location.href = 'Temp/erro'
  throw new Error('DevTools detected! App execution stopped.')
}
// Call the detection function
detectDevTools() */
</script>

<style>
.color {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}
</style>
