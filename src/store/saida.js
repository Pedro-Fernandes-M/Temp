// store/modules/saida.js

const saida = {
  namespaced: true,

  state: {
    sessionCookies: null,
    saida: [],
  },

  getters: {
    getCookies(state) {
      return state.sessionCookies
    },
    getSaida(state) {
      return state.saida
    },
  },

  mutations: {
    setCookies(state, payload) {
      state.sessionCookies = payload
    },
    setSaida(state, payload) {
      if (payload) {
        payload['mainproperty'].forEach((element) => {
          const timestamp = element[0] // exemplo
          const date = new Date(timestamp)
          const formatted = `${date.getDate()}/${date.getMonth() + 1}`
          const newElement = {
            event_time: element[0],
            value: Number(element[1].value[0]).toFixed(2),
            day: formatted,
          }
          state.saida.push(newElement)
        })
      }
    },
  },

  actions: {
    fakeSaida({ commit }) {
      commit('setSaida', JSON.parse(localStorage.getItem('saida')))
    },
  },
}

export default saida
