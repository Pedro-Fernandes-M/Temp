<template>
  <div class="justify">
    <h2>Temp. Retorno</h2>
    <div id="chart">
      <apexchart type="line" height="130%" :options="options" :series="series"></apexchart>
      <div class="margin">
        <div class="border">
          <span>Legenda</span>
          <div class="flex">
            <div class="line"></div>
            <span>50°C</span>
          </div>
        </div>
      </div>
    </div>
    <div class="center">
      <button class="button" @click="getLog()">Get Data</button>
    </div>
    <br />
    <Transition>
      <div class="container" v-if="store.getters.getLogs.length > 0">
        <button class="button" @click="getfile()">
          Export Values
          <IconPDF></IconPDF>
        </button>
        <button class="button" @click="store.commit('setPopup', true)">
          Export Graph
          <IconPDF></IconPDF>
        </button>
      </div>
    </Transition>
    <Transition>
      <InputPop
        v-if="popup"
        title="Data gráfico"
        function="1"
        message="Exemplo: diaInício/mês-diaFim/mês"
      ></InputPop>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import IconPDF from '@/components/icons/IconPDF.vue'
import InputPop from '@/components/InputPop.vue'

const store = useStore()
const popup = computed(() => {
  return store.getters.getPopup
})
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
  let records = localStorage.getItem('records')
  if (store.getters.getAccessToken === null) {
    store.dispatch('getData', { mode: 1 })
    alert('Access token not available')
    return
  }
  if (records) {
    records = JSON.parse(records)
    const day = new Date().getDate()
    const month = new Date().getMonth() + 1

    if (isMoreThan7Days(records[0].lastDay) == true) {
      alert('Já passaram mais de 7 dias desde ultimo registo  (' + records[0].lastDay + ') !')
      alert('Serão recolhidos apenas os últimos 7 dias!')
    }

    records.forEach((record) => {
      if (
        record.lastDay ==
        day.toString().padStart(2, '0') + '/' + month.toString().padStart(2, '0')
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
          console.log('oi', i)
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
        console.log('oi1', i)
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
}

//graph
const yAxis = computed(() => {
  const logs = store.getters.getLogs.map((log) => {
    return { x: log.day, y: log.value }
  })
  return logs
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
  dataLabels: {
    enabled: true,
  },
  stroke: {
    curve: 'smooth',
    width: 2.5,
  },
  colors: ['#000000'],
  xaxis: {
    labels: {
      style: {
        colors: '#000000', // Specify colors for each label
      },
    },
  },
  yaxis: {
    max: 54,

    labels: {
      style: {
        colors: '#000000',
      },
    },
  },
  annotations: {
    yaxis: [
      {
        y: 50, // The y-axis value you want to highlight
        borderColor: '#FF0000', // Line color
        borderWidth: 2, // Line thickness (optional)
        opacity: 0.8, // Optional opacity for the line
      },
    ],
  },
})

const series = ref([
  {
    name: 'Temp(°C)',
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
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
}

.center {
  display: flex;
  flex-direction: column;
  text-align: center;

  justify-content: center;
  align-items: center;
  margin-top: 1.05rem;
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
