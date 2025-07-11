<template>
  <div id="chart">
    <apexchart
      class="padding"
      type="line"
      height="140%"
      :options="options"
      :series="series"
    ></apexchart>
    <div class="margin">
      <slot class="width"></slot>
      <div class="border" v-if="type == 'retorno'">
        <span>Legenda</span>
        <div class="flex">
          <div class="line"></div>
          <span>50°C</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { ref, computed, toRaw } from 'vue'

const store = useStore()
const props = defineProps(['date'])
const type = computed(() => {
  return store.getters.getType
})

const yAxis = computed(() => {
  const logs = type.value == 'retorno' ? store.getters.getLogs : store.getters['saida/getSaida']
  let filtered = []
  console.log(logs)
  console.log(props.date)
  if (props.date) {
    const start = props.date[0]
    const end = props.date[1]
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    const logs1 = toRaw(logs)
    filtered = logs1.filter((log) => log.event_time >= start && log.event_time <= end)
    return filtered.map((log) => {
      return { x: log.day.split('/').slice(0, 2).join('/'), y: log.value }
    })
  }
  return logs.map((log) => {
    return { x: log.day.split('/').slice(0, 2).join('/'), y: log.value }
  })
})

const max = computed(() => {
  return Math.max(...yAxis.value.map((d) => d.y)) + 1
})
const min = computed(() => {
  return Math.min(...yAxis.value.map((d) => d.y)) - 1
})

const options = computed(() => ({
  chart: {
    toolbar: { show: false },
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
  dataLabels: { enabled: true },
  stroke: {
    curve: 'smooth',
    width: 2.5,
  },
  colors: type.value == 'retorno' ? ['#000000'] : ['#FF5733'],
  xaxis: {
    labels: {
      style: { colors: '#000000' },
    },
  },
  yaxis: {
    min: min.value,
    max: max.value,
    labels: {
      style: { colors: '#000000' },
    },
  },
  annotations: {
    yaxis: [
      {
        y: 50,
        borderColor: '#FF0000',
        borderWidth: 2,
        opacity: 0.8,
      },
    ],
  },
}))

const series = ref([
  {
    name: 'Temp(°C)',
    data: yAxis,
  },
])
</script>

<style scoped>
.margin {
  margin-top: 1.5rem;
  margin-right: 1rem;
  font-size: small;
  display: flex;
  justify-content: right;
}
.border {
  border: 1px solid black;
  padding: 0.3rem;
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
</style>
