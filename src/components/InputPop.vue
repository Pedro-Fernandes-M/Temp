<template>
  <div class="bg" @click="store.commit(`${type}`, false)">
    <div class="format" @click.stop>
      <h3>{{ props.title }}</h3>
      <p v-if="props.message">{{ props.message }}</p>
      <div class="height" v-if="props.function == '1'">
        <div v-for="(id, index) in array" :key="index">
          <span class="span">Dia:{{ logs[id].day }}</span>
          <span>Temp:{{ logs[id].value }}</span>
          <br />
          <input
            class="span1"
            type="text"
            v-model="comments[index]"
            id="input"
            :placeholder="placeholder"
          />
        </div>
      </div>
      <div class="flex" v-if="props.function == '2'">
        <select v-model="option">
          <option value="1">Mês atual</option>
          <option value="2">Escolher mês</option>
          <option value="3">Todos meses</option>
        </select>
        <input type="number" placeholder="1-10" v-model="input" v-if="option == 2" />
      </div>
      <button @click="choose(props.function)">
        {{ props.function == '1' ? 'Register' : 'Selecionar' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { ref } from 'vue'
import { useStore } from 'vuex'

const props = defineProps(['title', 'message', 'function'])
const placeholder = ref()
const store = useStore()
const comments = ref([])
const array = store.getters.getComments
let logs = store.getters.getLogs
const type = ref(props.function == 1 ? 'setPopUp' : 'setPopUp1')
const option = ref('1')
const input = ref()

function choose(choice) {
  if (choice === '1') {
    registerComments()
  } else {
    chooseType(option.value)
  }
}

function registerComments() {
  store.commit('clearLog')
  if (Object.keys(comments.value).length != Object.keys(array).length) {
    if (array.length > 1) {
      array.forEach((comment, index) => {
        logs[array[array.indexOf(comment)]].comment = comments.value[index] || 'false'
      })
    } else {
      logs[array[0]].comment = 'false'
    }
  } else {
    comments.value.forEach((comment, index) => {
      logs[array[index]].comment = comment
    })
  }
  store.commit('setLog', logs)
  localStorage.setItem(
    'records',
    JSON.stringify([
      {
        firstDay: logs[0].day + '/' + (new Date().getFullYear() % 100),
        lastDay: logs[logs.length - 1].day + '/' + (new Date().getFullYear() % 100),
        data: logs,
      },
    ]),
  )

  store.commit('clearComments')
  store.commit('setPopUp', false)
  store.commit('setPopUp1', true)
}

function chooseType(option) {
  if (option == 1) {
    const mes = new Date().getMonth() + 1
    store.commit('setMes', mes)
    store.commit('setPopUp1', false)
    store.commit('setPdf', true)
  } else if (option == 2) {
    store.commit('setMes', input)
    store.commit('setPopUp1', false)
    store.commit('setPdf', true)
  } else {
    store.commit('setMes', 0)
    store.commit('setPopUp1', false)
    store.commit('setPdf', true)
  }
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
button {
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

.height {
  max-height: 55dvh;
  overflow-y: scroll;
}
.span {
  margin-right: 1rem;
}
.span1 {
  margin-top: 0.2rem;
}
.flex {
  display: grid;
  justify-content: center;
  align-items: center;
}
select {
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  color: #333;
  outline: none;
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 0.65rem auto;
  transition: border 0.3s ease;
}

select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

input {
  margin-top: 0.5rem;
  padding: 10px 14px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fdfdfd;
  color: #333;
  outline: none;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}
</style>
