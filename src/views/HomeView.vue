<template>
  <div class="justify">
    <h2>Temp. Retorno</h2>
    <apexchart type="area" height="75%" :options="options" :series="series"></apexchart>
    <div class="center">
      <button class="button" @click="getLog()">Get Data</button>
      <br />
      <Transition>
        <div class="center" v-if="store.getters.getLogs.length > 0">
          <button class="button" @click="getfile()">
            Export to PDF
            <IconPDF></IconPDF>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import IconPDF from '@/components/icons/IconPDF.vue'

const store = useStore()
const deviceId = import.meta.env.VITE_DEVICE_ID

if (store.getters.getAccessToken === null) {
  store.dispatch('getData', { mode: 1 })
} else {
  store.dispatch('getData', { mode: 2 })
}

//fetch
function getNoonTime() {
  const now = new Date()
  now.setHours(12, 0, 0, 0)

  return now.getTime()
}
async function getLog() {
  let records = localStorage.getItem('records')
  if (store.getters.getAccessToken === null) {
    alert('Access token not available')
    store.dispatch('getData', { mode: 1 })
    return
  }
  if (records) {
    records = JSON.parse(records)
    const day = new Date().getDate()
    const month = new Date().getMonth() + 1
    const month1 = new Date().getMonth()

    records.forEach((record) => {
      if (
        record.lastDay ==
        day.toString().padStart(2, '0') +
          '/' +
          (day - 7 < 0 ? month : month1).toString().padStart(2, '0')
      ) {
        store.commit('clearLog')
        store.commit('setLink', null)
        store.commit('setLog', record.data)
        return
      } else if (day - parseInt(record.lastDay.split('/')[0]) < 7) {
        store.commit('clearLog')
        store.commit('setLink', null)
        store.commit('setLog', record.data)
        const i = day - parseInt(record.lastDay.split('/')[0])
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
}

//graph
const yAxis = computed(() => {
  return store.getters.getLogs.map((log) => {
    return { x: log.day, y: log.value }
  })
})

//chart
const options = ref({
  chart: {
    toolbar: {
      show: false,
    },
    animations: {
      enabled: true,
      speed: 20,
      animateGradually: {
        enabled: true,
        delay: 2000,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 100,
      },
    },
  },
  colors: ['#8B0000'],
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    labels: {
      style: {
        colors: '#FFFFFF', // Specify colors for each label
      },
    },
  },
  yaxis: {
    max: 55,
    min: 45,
    labels: {
      style: {
        colors: '#FFFFFF',
      },
    },
  },
  annotations: {
    yaxis: [
      {
        y: 50, // The y-axis value you want to highlight
        borderColor: '#FFFF00', // Yellow color for the line
        borderWidth: 2, // Line thickness (optional)
        opacity: 0.8, // Optional opacity for the line
        label: {
          style: {
            color: '#000000', // Text color (black)
            background: '#FFFF00', // Label background color (yellow)
          },
        },
      },
    ],
  },
})

const series = ref([
  {
    name: 'Temp(Cº)',
    data: yAxis,
  },
])

async function getfile() {
  await store.dispatch('createPDF')
  const url = store.getters.getLink
  const dataAtual = new Date()
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0')
  const ano = dataAtual.getFullYear()

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Network response was not ok')

    const blob = await response.blob() // Convert the response to a Blob
    const downloadUrl = URL.createObjectURL(blob)

    // Trigger the download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `Registo_Legionella_${mes}/${ano}.pdf` // Name of the file to save
    link.click()

    // Clean up the temporary object URL
    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error fetching the PDF:', error)
  }
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
}

h2 {
  color: white;
  text-align: center;
  margin-bottom: 2rem;
}

.center {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin: 1rem;
  justify-content: center;
  align-items: center;
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
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.button:hover {
  background: linear-gradient(135deg, #094f35, #053926);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
}
</style>
