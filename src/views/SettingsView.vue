<template>
  <div class="justify">
    <div @click="$router.push('/')" class="top">
      <IconBack></IconBack>
    </div>
    <div class="form">
      <div class="center">Settings</div>
      <label>Key:</label>
      <input type="text" v-model="key1" />
      <label>SheetID:</label>
      <input type="text" v-model="sheetId1" />
      <label>Empresa:</label>
      <input type="text" v-model="nome1" />
      <div class="center">
        <button @click="guardar">Guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useStore } from 'vuex'

import IconBack from '@/components/icons/IconBack.vue'

function getSettings() {
  store.commit('setKey', { value: JSON.parse(localStorage.getItem('key')), mode: 0 })
  store.commit('setSheetId', { value: JSON.parse(localStorage.getItem('sheetId')), mode: 0 })
  store.commit('setNome', { value: JSON.parse(localStorage.getItem('nome')) || '', mode: 0 })
}

onBeforeMount(getSettings)

const store = useStore()

const key = computed(() => {
  return store.getters.getKey || ''
})

const sheetId = computed(() => {
  return store.getters.getSheetId || ''
})

const nome = computed(() => {
  return store.getters.getNome || ''
})

const key1 = ref(null)
const sheetId1 = ref(null)
const nome1 = ref(null)

setTimeout(() => {
  key1.value = key.value
  sheetId1.value = sheetId.value
  nome1.value = nome.value

  watch(key, (novo) => {
    if (novo) {
      key1.value = key.value
    }
  })

  watch(sheetId, (novo) => {
    if (novo) {
      sheetId1.value = sheetId.value
    }
  })

  watch(nome, (novo) => {
    if (novo) {
      nome1.value = nome.value
    }
  })
}, 100)

function guardar() {
  store.commit('setKey', { value: key1.value, mode: 1 })
  store.commit('setSheetId', { value: sheetId1.value, mode: 1 })
  store.commit('setNome', { value: nome1.value, mode: 1 })

  alert('Novas credencias guardadas!')
}
</script>

<style scoped>
/* Container Principal - Mantém o posicionamento */
.justify {
  display: grid;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
}

/* O Cartão (Settings) */
.form {
  display: flex;
  flex-direction: column;
  /* Mudança para um cinzento escuro moderno (tipo iOS dark mode ou Material) */
  background-color: #3a3a3cf9;
  color: #ffffff;
  padding: 2.5rem;
  border-radius: 1.5rem;
  /* Sombra para dar profundidade e destacar do fundo */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 15rem; /* Largura fixa para consistência */
  transition: transform 0.2s ease;
}

/* Título */
.center {
  width: 100%;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #f2f2f2;
}

/* Inputs Modernizados */
input {
  margin-bottom: 1.25rem;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #3a3a3c; /* Borda subtil */
  background-color: #1c1c1e; /* Input mais escuro que o cartão */
  color: white;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
}

/* Efeito de Focus no Input */
input:focus {
  border-color: #0a84ff; /* Azul Apple/Moderno */
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.3);
  background-color: #000000;
}

/* Labels (Key: / SheetID:) */
/* Assumindo que estão dentro de labels ou spans, aplicamos estilo genérico ao texto do form */
.form label,
.form span {
  font-size: 0.85rem;
  color: #aeaeb2; /* Cinzento claro para texto secundário */
  margin-bottom: 0.5rem;
  margin-left: 4px;
  font-weight: 500;
}

/* Estilização do Botão (Guardar) */
button {
  margin-top: 0.5rem;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #0a5137, #06402b);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}

button:hover {
  background: linear-gradient(135deg, #094f35, #053926);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
}

button:active {
  transform: scale(0.98);
}

/* Seta de Voltar - Mantém posição fixa */
.top {
  position: fixed;
  top: 0;
  left: 0;
  margin: 1.5rem; /* Um pouco mais de margem para "respirar" */
  cursor: pointer;
  /* Opcional: Efeito hover na seta se for SVG/Icon */
  opacity: 0.7;
  transition: opacity 0.2s;
}

.top:hover {
  opacity: 1;
}
</style>
