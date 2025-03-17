<template>
  <div class="bg" @click="store.commit('setPopup', false)">
    <div class="format" @click.stop>
      <h3>{{ props.title }}</h3>
      <p>{{ props.message }}</p>
      <input type="text" v-model="input" id="input" :placeholder="placeholder" />
      <button @click="choose(props.function)">Register</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, watch } from 'vue'
import { ref } from 'vue'
import { useStore } from 'vuex'

const props = defineProps(['title', 'message', 'function'])
const input = ref(null)
const placeholder = ref()
const store = useStore()

function choose(choice) {
  if (choice === '1') {
    dateGraph()
  }
}

function dateGraph() {
  console.log(validateInput(input.value))
  if (validateInput(input.value)) {
    store.commit('setDateGraph', input.value)
    console.log(input.value)
    store.commit('setPopup', false)
    if (store.getters.getDateGraph != null) {
      store.dispatch('generateGraph')
    }
  }
}

watch(
  () => input.value,
  (newValue) => {
    if (!validateInput(newValue)) {
      placeholder.value = 'Invalid look at example'
      document.getElementById('input').classList.add('border-red')
    } else {
      if (document.getElementById('input').classList.contains('border-red')) {
        document.getElementById('input').classList.remove('border-red')
      }
    }
  },
)

function validateInput(value) {
  // Verificar se o valor é nulo ou indefinido
  if (value === null || value === undefined) {
    console.log(false)
    return false
  }

  // Regex para validar o formato dd/mm-dd/mm
  const regex = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])$/

  console.log(regex.test(value))
  return regex.test(value) // Retorna true se o formato for válido
}
</script>

<style scoped>
/* Darkened background to cover the entire screen */
.bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent black */
  display: flex;
  justify-content: center;
  align-items: center; /* Center the popup vertically and horizontally */
  z-index: 9999; /* Ensure it is on top of all other elements */
}

/* Popup container with grid layout and rounded edges */
.format {
  background-color: #ffffff; /* White background */
  padding: 20px; /* Inner padding for spacing */
  border-radius: 15px; /* Rounded corners */
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25); /* Subtle shadow for depth */
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px; /* Space between elements */
  text-align: center; /* Center text inside */
  z-index: 1;
}

/* Modern input styling */
.format input[type='text'] {
  padding: 10px;
  font-size: 16px;
  border-radius: 8px; /* Rounded corners */
  outline: none;
  transition: border-color 0.3s ease; /* Smooth transition for focus effect */
}

.format input[type='text']:focus {
  border-color: #007bff; /* Highlight border on focus */
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Subtle glow on focus */
}

.border-red {
  border: 2px solid red;
}

/* Modern button styling */
.format button {
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  background-color: #007bff; /* Blue primary color */
  border: none; /* No border */
  border-radius: 8px; /* Rounded corners */
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease; /* Smooth transitions */
}

.format button:hover {
  background-color: #0056b3; /* Darker blue on hover */
  transform: scale(1.05); /* Slight zoom effect */
}

.format button:active {
  background-color: #004494; /* Even darker blue on click */
  transform: scale(1); /* Reset zoom on click */
}
</style>
