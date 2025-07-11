<template>
  <div class="justify">
    <div class="div">
      <h3>Gráfico</h3>
      <select name="" id="" v-model="type">
        <option value="retorno">Temp. Retorno</option>
        <option value="saida">Temp. Saida</option>
      </select>
    </div>
    <ChartTemp :date="date">
      <div class="side">
        <VueDatePicker v-model="date" range class="width" format="d/M/yyyy" id="excludeMe" />
      </div>
    </ChartTemp>
    <div class="center">
      <button class="button" @click="getLog()">Obter Dados</button>
    </div>
    <br />
    <Transition>
      <div class="container" v-if="store.getters.getLogs.length > 0">
        <button class="button" @click="setComments()">
          Exportar Relatório
          <IconPDF></IconPDF>
        </button>
        <button class="button" @click="dateGraph">
          Exportar Gráfico
          <IconPDF></IconPDF>
        </button>
      </div>
    </Transition>
    <Transition>
      <InputPop
        v-if="popup"
        title="Registar Comentários"
        function="1"
        message="Escreva motivo de registo anormal de temperatura."
      ></InputPop>
    </Transition>
    <Transition>
      <InputPop v-if="popup1" title="Tipo de Relatório" function="2" message=""></InputPop>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'

import IconPDF from '@/components/icons/IconPDF.vue'
import InputPop from '@/components/InputPop.vue'
import ChartTemp from '@/components/ChartTemp.vue'

const store = useStore()
const popup = computed(() => {
  return store.getters.getPopup
})
const popup1 = computed(() => {
  return store.getters.getPopup1
})
const deviceId = import.meta.env.VITE_DEVICE_ID

const type = ref('retorno')

watch(type, (novo) => {
  store.commit('setType', novo)
})

if (store.getters.getAccessToken === null) {
  store.dispatch('getData', { mode: 1 })
} else {
  store.dispatch('getData', { mode: 2 })
}

const endDate = new Date()
const startDate = new Date(endDate)
startDate.setHours(0, 0, 0, 0)
startDate.setDate(endDate.getDate() - 7)
const date = ref()
date.value = [startDate, endDate]

function dateGraph() {
  let date2
  if (date.value) {
    date2 = new Date(date.value[0])
  } else {
    date2 = new Date(store.getters.getLogs[0].event_time)
  }
  const day = date2.getDate()
  const month = date2.getMonth() + 1
  let date1
  if (date.value) {
    date1 = new Date(date.value[0])
  } else {
    date1 = new Date(store.getters.getLogs[store.getters.getLogs.length - 1].event_time)
  }
  const day1 = date1.getDate()
  const month1 = date1.getMonth() + 1

  store.commit('setDateGraph', `${day}/${month}-${day1}/${month1}`)
  store.dispatch('generateGraph')
}
//fetch
function getNoonTime() {
  const now = new Date()
  now.setHours(12, 0, 0, 0)

  return now.getTime()
}

const isMoreThan7Days = (record) => {
  const [day, month] = record.split('/').map(Number)
  const lastDate = new Date(new Date().getFullYear(), month - 1, day) // Create Date object
  return (new Date() - lastDate) / (1000 * 60 * 60 * 24) > 7
}

function getDaysSinceLast(record) {
  const [d, m] = record.lastDay.split('/').map(Number)
  const today = new Date()
  const thisYear = today.getFullYear()

  // Cria data completa assumindo o mesmo ano
  let lastDate = new Date(thisYear, m - 1, d)
  let now = new Date(thisYear, today.getMonth(), today.getDate())

  // Se a data do registro estiver no futuro (ex: hoje é 1 e lastDay é 29),
  // assumimos que é do mês anterior
  if (lastDate > now) {
    lastDate = new Date(thisYear, m - 2, d) // mês anterior
  }

  const diffInMs = now - lastDate
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
}

async function getLog() {
  let records = JSON.parse(localStorage.getItem('records'))
  if (store.getters.getAccessToken === null) {
    store.dispatch('getData', { mode: 1 })
    alert('Access token not available')
    return
  }
  if (records) {
    const day = new Date().getDate()
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear().toString().slice(-2)

    if (isMoreThan7Days(records[0].lastDay) == true) {
      alert('Já passaram mais de 7 dias desde ultimo registo  (' + records[0].lastDay + ') !')
      alert('Serão recolhidos apenas os últimos 7 dias!')
    }

    records.forEach((record) => {
      if (
        record.lastDay ==
        day.toString().padStart(2, '0') +
          '/' +
          month.toString().padStart(2, '0') +
          '/' +
          year.toString()
      ) {
        store.commit('clearLog')
        store.commit('setLink', null)
        store.commit('setLog', record.data)
        return
      } else if (isMoreThan7Days(record.lastDay) === false) {
        store.commit('clearLog')
        store.commit('setLink', null)
        store.commit('setLog', record.data)
        const i = getDaysSinceLast(record)
        if (i >= 2) {
          for (let f = 1; f < i; f++) {
            const hours = (i - f) * 24
            const timer = (i - f) * 50
            setTimeout(() => {
              store.dispatch('getData', {
                mode: 3,
                deviceId: deviceId,
                startTime: getNoonTime() - (hours * 60 * 60 * 1000 + 25 * 60 * 1000),
                endTime: getNoonTime() - hours * 60 * 60 * 1000,
              })
            }, timer)
          }
        }
        setTimeout(() => {
          store.dispatch('getData', {
            mode: 3,
            deviceId: deviceId,
            startTime: getNoonTime() - 25 * 60 * 1000,
            endTime: getNoonTime(),
          })
        }, i * 50)
      } else {
        store.commit('clearLog')
        store.commit('setLink', null)
        store.commit('setLog', record.data)
        for (let i = 0; i < 7; i++) {
          const hours = i * 24
          const timer = (7 - i) * 100

          setTimeout(() => {
            if (i == 0) {
              store.dispatch('getData', {
                mode: 3,
                deviceId: deviceId,
                startTime: getNoonTime() - 25 * 60 * 1000,
                endTime: getNoonTime(),
              })
            } else {
              store.dispatch('getData', {
                mode: 3,
                deviceId: deviceId,
                startTime: getNoonTime() - (hours * 60 * 60 * 1000 + 25 * 60 * 1000),
                endTime: getNoonTime() - hours * 60 * 60 * 1000,
              })
            }
          }, timer)
        }
      }
    })
  } else {
    store.commit('clearLog')
    store.commit('setLink', null)

    for (let i = 0; i < 7; i++) {
      const hours = i * 24
      const timer = (7 - i) * 100

      setTimeout(() => {
        if (i == 0) {
          store.dispatch('getData', {
            mode: 3,
            deviceId: deviceId,
            startTime: getNoonTime() - 25 * 60 * 1000,
            endTime: getNoonTime(),
          })
        } else {
          store.dispatch('getData', {
            mode: 3,
            deviceId: deviceId,
            startTime: getNoonTime() - (hours * 60 * 60 * 1000 + 25 * 60 * 1000),
            endTime: getNoonTime() - hours * 60 * 60 * 1000,
          })
        }
      }, timer)
    }
  }
  //falta logica de cookies ver validade para n fazer sempre login
  await store.dispatch('saida/login')
  await store.dispatch('saida/fetchAndUpdate')
}

async function setComments() {
  await store.dispatch('readComments')
  if (store.getters.getComments.length > 0) {
    store.commit('setPopUp', true)
  } else {
    store.commit('setPopUp1', true)
  }
}

const pdf = computed(() => {
  return store.getters.getPdf
})
watch(pdf, (novo) => {
  if (novo) {
    getFile()
  }
})

async function getFile() {
  await store.dispatch('createPDF', store.getters.getMes)
  const url = store.getters.getLink
  const dataAtual = new Date()
  const mes = store.getters.getMes
  const ano = dataAtual.getFullYear()
  const records = JSON.parse(localStorage.getItem('records'))

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Network response was not ok')

    const blob = await response.blob() // Convert the response to a Blob
    const downloadUrl = URL.createObjectURL(blob)

    // Trigger the download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download =
      mes == 0
        ? `Registo_Legionella_${records[0].firstDay}-${records[0].lastDay}.pdf`
        : `Registo_Legionella_${mes}/${ano}.pdf` // Name of the file to save
    link.click()

    // Clean up the temporary object URL
    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error fetching the PDF:', error)
  }
  store.commit('setPdf', false)
}
</script>

<style scoped>
/* we will explain what these classes do next! */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.justify {
  display: grid;
  align-items: center;
  width: 100%;
  height: 100vh;
}

.line {
  border-bottom: 2px dotted red;
  width: 120%;
  height: 50%;
  margin-top: 0.5rem;
}
.flex {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.margin {
  margin-top: 1.5rem;
  margin-right: 0.55rem;
  font-size: small;
  display: flex;
  justify-content: right;
}
.border {
  border: 1px solid black;
  padding: 0.3rem;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
  margin-top: -2.5rem;
}

.center {
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
}
.text {
  color: white;
}

.button {
  background: linear-gradient(135deg, #0a5137, #06402b);
  color: white;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.button:hover {
  background: linear-gradient(135deg, #094f35, #053926);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
}

.width {
  margin-left: 1rem;
  width: clamp(220px, 12vw, 300px);
}

.side {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: start;
}

select {
  padding: 8px;
  font-size: 0.9rem;
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
.div {
  display: flex;
  flex-direction: column;
  align-items: center;
}
h3 {
  padding: 0.3rem;
  margin: 0;
}
</style>
