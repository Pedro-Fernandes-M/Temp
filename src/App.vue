<template>
  <router-view v-slot="{ Component }">
    <transition>
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { RouterView } from 'vue-router'

document.addEventListener('contextmenu', (event) => event.preventDefault())

// Disable F12, Ctrl+Shift+I, and Ctrl+U
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
  const devToolsCheck = new Function('debugger') // Using the `debugger` statement for detection.
  let isDevToolsOpen = false

  devToolsCheck() // Initial trigger for the debugger.

  setInterval(() => {
    const start = performance.now()
    devToolsCheck()
    const end = performance.now()

    // If `debugger` caused a significant delay, it likely indicates DevTools is open.
    if (end - start > 100) {
      if (!isDevToolsOpen) {
        console.warn('DevTools detected! The app will stop.')
        isDevToolsOpen = true

        // Actions to take when DevTools is detected
        stopApp()
      }
    } else {
      isDevToolsOpen = false
    }
  }, 500) // Check every 500ms
}

// Function to stop the app
function stopApp() {
  const displayHeight = window.innerHeight - 100
  document.body.innerHTML = `<h1 class="color" style="height:${displayHeight}px">Unauthorized Access</h1>`
  throw new Error('DevTools detected! App execution stopped.')
}

// Call the detection function
detectDevTools()
</script>

<style>
.color {
  color: white;
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
