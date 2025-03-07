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

function check() {
  let lastWidth = window.outerWidth
  let lastHeight = window.outerHeight

  // Monitor for DevTools being opened
  setInterval(function () {
    if (window.outerWidth !== lastWidth || window.outerHeight !== lastHeight) {
      console.log('DevTools detected! Disabling app features.')

      // Stop further requests by overriding fetch (can also block other requests like axios)
      window.fetch = function () {
        console.log('Fetch request blocked due to DevTools being open.')
        return Promise.resolve()
      }

      // Disable other sensitive features of your app here
      // For example, disable API calls or hide sensitive parts of the UI
      document.body.innerHTML = '<h1>DevTools detected. App is disabled.</h1>'
    }

    lastWidth = window.outerWidth
    lastHeight = window.outerHeight
  }, 1000) // Check every second
}
check()
</script>

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
