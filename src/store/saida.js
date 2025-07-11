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
    async login({ commit }) {
      const LOGIN_URL = import.meta.env.VITE_LOGIN_URL
      const LOGIN_PAYLOAD = {
        username: import.meta.env.VITE_LOGIN1,
        password: import.meta.env.VITE_LOGIN2,
        keepLoggedIn: true,
      }
      const COOKIE_PREFIX = import.meta.env.VITE_COOKIES

      console.log(COOKIE_PREFIX, LOGIN_PAYLOAD, LOGIN_URL)
      console.log('Realizando login...')

      try {
        const response = await fetch(LOGIN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(LOGIN_PAYLOAD),
          credentials: 'include',
        })

        if (response.ok) {
          // ⚠️ Cookies não podem ser acessados diretamente via JS por CORS ou HttpOnly
          const rawCookies = response.headers.get('set-cookie')
          console.log('Cookies recebidos:', rawCookies)

          // Corrigido: commit com múltiplos parâmetros
          const headerPayload = commit('extractCookie', rawCookies, 'header.payload')
          const signature = commit('extractCookie', rawCookies, 'signature')

          const sessionCookies = `${COOKIE_PREFIX}header.payload=${headerPayload};signature=${signature}`
          console.log('Login bem-sucedido! Cookies obtidos.')

          localStorage.setItem('sessionCookies', sessionCookies)
          commit('setCookies', sessionCookies)
        } else {
          const errorText = await response.text()
          console.error(`Erro no login: ${response.status} - ${errorText}`)
          return null
        }
      } catch (error) {
        console.error('Erro na requisição de login:', error)
        return null
      }
    },

    async fetchAndUpdate(state) {
      const local = state.getters.getSaida || null
      console.log(local)
      if (
        local.length > 0 &&
        local[local.length - 1].event_time.getFullYear() === new Date().getFullYear() &&
        local[local.length - 1].event_time.getMonth() === new Date().getMonth() &&
        local[local.length - 1].event_time.getDate() === new Date().getDate()
      ) {
        alert('Sem novos registos temp. saída!')
        return
      }
      let url = import.meta.env.VITE_LOGIN_URL2
      const sessionCookies = state.getters.getCookies

      console.log(sessionCookies)

      url = url.replace('{time}', Date.now().toString())
      console.log(`Buscando dados para saída...`)

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Cookie: sessionCookies,
          },
        })

        if (response.ok) {
          const text = await response.text()
          state.commit('setSaida', text)
          console.log(`Dados para saída atualizados com sucesso.`)
        } else {
          console.error(
            `Falha ao obter dados para saída: ${response.status} - ${await response.text()}`,
          )
        }
      } catch (error) {
        console.error(`Erro ao buscar dados para saída:`, error)
      }
    },

    extractCookie(cookieHeader, name) {
      if (!cookieHeader) return null
      const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`))
      return match ? match[1] : null
    },
  },
}

export default saida
