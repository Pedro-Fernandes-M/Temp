import './assets/main.css'
import VueApexCharts from "vue3-apexcharts";

import { createApp } from 'vue'
import store from './store/index.js'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(VueApexCharts)

app.mount('#app')


