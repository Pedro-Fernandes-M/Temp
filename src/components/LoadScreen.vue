<template>
  <transition name="fade">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// Acede ao getter da store
const isLoading = computed(() => store.getters.getLoading)
</script>

<style scoped>
/* Container de Fundo Escurecido */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* Fundo preto 70% opaco */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Garante que fica acima de tudo */
  backdrop-filter: blur(2px); /* Efeito "frosted glass" moderno */
}

/* Container do Spinner para alinhar itens */
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

/* O Spinner em si */
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff; /* Cor da parte que roda */
  animation: spin 1s ease-in-out infinite;
}

.loading-text {
  color: white;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
}

/* Animação de Rotação */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transições de Entrada/Saída do Vue (Fade) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
