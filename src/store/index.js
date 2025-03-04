import { createStore } from 'vuex'
import CryptoJS from 'crypto-js'
import axios from 'axios'
import { PDFDocument, rgb } from 'pdf-lib'

const store = createStore({
  state: {
    access_token: null,
    refresh_token: null,
    logs: [],
    link: null,
  },
  getters: {
    getAccessToken(state) {
      return state.access_token
    },
    getRefreshToken(state) {
      return state.refresh_token
    },
    getLogs(state) {
      return state.logs
    },
    getLink(state) {
      return state.link
    },
  },
  mutations: {
    setAccessToken(state, accessToken) {
      state.access_token = accessToken
    },
    setRefreshToken(state, refreshToken) {
      state.refresh_token = refreshToken
    },
    setLog(state, log) {
      log.forEach((element) => {
        state.logs.push(element)
      })
    },
    clearLog(state) {
      state.logs = []
    },
    setLink(state, payload) {
      state.link = payload
    },
  },

  actions: {
    async getData(state, payload) {
      function setData(data) {
        let date = new Date(data)
        let dia = date.getDate()
        let month = (date.getMonth() + 1).toString().padStart(2, '0')

        // Exibir a data no formato 'dia/mês/ano'
        let dataFormatada =
          dia < 10 ? `${dia.toString().padStart(2, '0')}` + '/' + month : `${dia + '/' + month}`
        return dataFormatada
      }

      function calculateDailyAverages(records) {
        // Step 1: Group records by day (event_time is just the day, like 27)
        let groupedByDay = {}

        records.forEach((record) => {
          // Use `data.event_time` directly since it's just the day (e.g., 27)
          let day = record.day

          // Initialize the group for this day if it doesn't exist
          if (!groupedByDay[day]) {
            groupedByDay[day] = {
              totalValue: 0,
              count: 0,
            }
          }

          // Add the value to the day's total and increment the count
          groupedByDay[day].totalValue += parseInt(record.value / 10)
          groupedByDay[day].count += 1
          groupedByDay[day].time = record.event_time
        })

        // Step 2: Calculate the average for each day
        let averages = []
        for (let day in groupedByDay) {
          let totalValue = groupedByDay[day].totalValue

          let count = groupedByDay[day].count
          let average = (totalValue / count).toFixed(1)

          averages.push({
            event_time: groupedByDay[day].time,
            day: day,
            value: average,
          })
        }
        return averages
      }

      // Function to get the current timestamp
      function getTime() {
        return new Date().getTime()
      }

      // Function to calculate the signature
      function calcSign(clientId, timestamp, nonce, signStr, secret) {
        const str = clientId + timestamp + nonce + signStr
        const hash = CryptoJS.HmacSHA256(str, secret)
        return hash.toString(CryptoJS.enc.Hex).toUpperCase()
      }

      function calcSignB(clientId, accessToken, timestamp, nonce, signStr, secret) {
        var str = clientId + accessToken + timestamp + nonce + signStr
        var hash = CryptoJS.HmacSHA256(str, secret)
        var hashInBase64 = hash.toString()
        var signUp = hashInBase64.toUpperCase()
        return signUp
      }

      // Function to generate the signature string
      function stringToSign(query, method) {
        let url = ''
        let sha256 = CryptoJS.SHA256('')
        let headersStr = ''

        // Add query parameters to the URL
        if (query) {
          const queryParams = new URLSearchParams(query)
          if (payload.mode === 1) url = `/v1.0/token?${queryParams.toString()}`
          else if (payload.mode === 2 && state.getters.getRefreshToken != null)
            url = `/v1.0/token/${state.getters.getRefreshToken}`
          else if (payload.mode === 3 && state.getters.getAccessToken != null) {
            url = `/v1.0/devices/${payload.deviceId}/logs?${queryParams.toString()}`
          } else {
            alert('Access token or refresh token is null!')
          }
        }

        // Construct the signature string
        const signStr = `${method.toUpperCase()}\n${sha256}\n${headersStr}\n${url}`

        return { url, signStr }
      }

      // Your API request function
      function makeApiRequest() {
        const clientId = import.meta.env.VITE_CLIENT_ID
        const secret = import.meta.env.VITE_SECRET
        const timestamp = getTime()
        const nonce = ''
        let query = 'grant_type=1'
        const method = 'GET'

        if (payload.mode === 3) {
          query = {
            codes: 'temp_current',
            end_time: payload.endTime,
            start_time: payload.startTime,
            type: '7',
          }
        }

        // Generate the signature
        const { signStr, url } = stringToSign(query, method, secret)
        const sign =
          payload.mode === 1 || payload.mode === 2
            ? calcSign(clientId, timestamp, nonce, signStr, secret)
            : calcSignB(clientId, state.getters.getAccessToken, timestamp, nonce, signStr, secret)

        // Set the request headers
        let headers = null
        if (payload.mode === 1 || payload.mode === 2) {
          headers = {
            client_id: clientId,
            sign: sign,
            t: timestamp,
            sign_method: 'HMAC-SHA256',
            nonce: nonce,
          }
        } else if (payload.mode === 3) {
          headers = {
            client_id: clientId,
            access_token: state.getters.getAccessToken,
            sign: sign,
            t: timestamp,
            sign_method: 'HMAC-SHA256',
            mode: 'cors',
            'Content-Type': 'application/json',
          }
        }

        // Make the axios request
        axios
          .get(import.meta.env.VITE_API_HOST + url, { headers })
          .then((response) => {
            if (payload.mode == 1 || payload.mode == 2) {
              state.commit('setAccessToken', response.data.result.access_token)
              state.commit('setRefreshToken', response.data.result.refresh_token)
              setTimeout(() => {
                state.dispatch('getData', { mode: 2 })
              }, response.data.result.expire_time)
            } else {
              let data = response.data.result.logs
              const array = []
              data.forEach((element) => {
                const newElement = {
                  value: element.value,
                  event_time: element.event_time,
                  day: setData(element.event_time),
                }
                array.push(newElement)
              })
              data = calculateDailyAverages(array)
              state.commit('setLog', data)
            }
          })
          .catch((error) => {
            console.error('Error:', error)
          })
      }

      // Call the API request function
      makeApiRequest()
    },
    async createPDF(state) {
      let month1
      const pdfDoc = await PDFDocument.create()
      // Set metadata for the PDF
      pdfDoc.setTitle('REGISTO LEGIONELLA')
      pdfDoc.setAuthor('Filipe Alves Fernandes')
      pdfDoc.setProducer('Adobe PDF Library 15.0')
      pdfDoc.setCreator('Adobe Acrobat Pro DC')
      pdfDoc.setCreationDate(new Date())

      let page = pdfDoc.addPage([595, 842])
      let page1
      if (new Date().getDay() - 7 < 0) {
        page1 = pdfDoc.addPage([595, 842])
        month1 = new Date().getMonth().toString().padStart(2, '0')
      }

      // Obter data atual
      const currentDate = new Date()
      const month =
        page1 != null
          ? (currentDate.getMonth() + 1).toString().padStart(2, '0')
          : currentDate.getMonth().toString().padStart(2, '0')
      const year = currentDate.getFullYear()
      const logs = state.getters.getLogs || null
      const totalPages = pdfDoc.getPageCount()
      pdfDoc.setSubject(`This document contains ${totalPages} pages.`)

      const fontSize = 7.7
      const margin = 50
      const textYStart = 800
      const tableXStart = margin
      const tableYStart = textYStart - 100
      const rowHeight = 20
      const columnWidths = [50, 120, 120, 150]
      const tableWidth = columnWidths.reduce((a, b) => a + b, 0)
      const headerHeight = rowHeight

      function draw(page, month) {
        page.drawText('CONTROLO ÁGUA QUENTE - LEGIONELLA', {
          x: margin,
          y: textYStart,
          size: fontSize + 4,
          color: rgb(0, 0, 0),
        })

        page.drawText('INNSIDE by Meliã Braga Centro', {
          x: margin,
          y: textYStart - 20,
          size: fontSize + 2,
        })

        page.drawText(`MÊS/ANO: ${month}/${year}`, {
          x: margin,
          y: textYStart - 40,
          size: fontSize + 2,
        })

        page.drawText('DEPÓSITO Nº 1-5', {
          x: margin,
          y: textYStart - 60,
          size: fontSize + 2,
        })

        page.drawRectangle({
          x: tableXStart,
          y: tableYStart - (headerHeight + rowHeight * 31),
          width: tableWidth,
          height: headerHeight + rowHeight * 31,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        })

        page.drawLine({
          start: { x: tableXStart, y: tableYStart - headerHeight },
          end: { x: tableXStart + tableWidth, y: tableYStart - headerHeight },
          color: rgb(0, 0, 0),
          thickness: 1,
        })

        let currentX = tableXStart
        columnWidths.forEach((width) => {
          page.drawLine({
            start: { x: currentX, y: tableYStart },
            end: { x: currentX, y: tableYStart - (headerHeight + rowHeight * 31) },
            color: rgb(0, 0, 0),
            thickness: 1,
          })
          currentX += width
        })

        for (let i = 0; i <= 31; i++) {
          const y = tableYStart - headerHeight - i * rowHeight
          page.drawLine({
            start: { x: tableXStart, y },
            end: { x: tableXStart + tableWidth, y },
            color: rgb(0, 0, 0),
            thickness: 1,
          })
        }

        const headers = ['DIA', 'RETORNO - TEMP.(°C)', 'SAÍDA - TEMP.(°C)', 'COMENTÁRIOS']
        headers.forEach((header, columnIndex) => {
          let columnStartX =
            tableXStart + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0)
          if (columnIndex >= 1 && columnIndex != 2) columnStartX -= 10
          if (columnIndex === 2) columnStartX -= 5
          const columnWidth = columnWidths[columnIndex]

          const cellCenterX = columnStartX + columnWidth / 2

          const cellCenterY = tableYStart - headerHeight / 2

          const textWidth = header.length * (fontSize / 2)
          const textStartX = cellCenterX - textWidth / 2

          const textStartY = cellCenterY - fontSize / 4

          page.drawText(header, {
            x: textStartX,
            y: textStartY,
            size: fontSize,
          })
        })

        for (let i = 0; i < 31; i++) {
          const y = tableYStart - headerHeight - (i + 1) * rowHeight
          const logForDay = logs.find(
            (log) =>
              log.day.split('/')[0] == (i + 1).toString().padStart(2, '0') &&
              month == log.day.split('/')[1],
          )
          const retorno = logForDay ? logForDay.value : ''

          const data = [(i + 1).toString().padStart(2, '0'), retorno, '', '']

          data.forEach((text, columnIndex) => {
            const x = tableXStart + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0)
            const width = columnWidths[columnIndex]
            const height = rowHeight
            const textWidth = fontSize
            const centerX = x + (width - textWidth) / 2
            const centerY = y + (height - fontSize) / 2

            page.drawText(text, {
              x: centerX,
              y: centerY,
              size: fontSize,
            })
          })
        }
      }
      draw(page, month)
      if (page1 != null) {
        draw(page1, month1)
      }

      await pdfDoc.save().then((result) => {
        const blob = new Blob([result], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)

        state.commit('setLink', url)
      })

      let records = localStorage.getItem('records')
      const [firstDay, lastDay] = [
        store.getters.getLogs[0]?.day,
        store.getters.getLogs[store.getters.getLogs.length - 1]?.day,
      ]
      if (records) {
        records = JSON.parse(records)
        records.forEach((record) => {
          if (record.firstDay === firstDay && record.lastDay === lastDay) {
            return
          } else {
            const days = lastDay - record.lastDay
            const save = []
            for (let i = 0; i < days; i++) {
              save.push(store.getters.getLogs[store.getters.getLogs.length - i])
            }
            records.push({
              firstDay: save[0].day,
              lastDay: save[save.length - 1].day,
              data: save,
            })
            localStorage.setItem('records', JSON.stringify(records))
          }
        })
      } else {
        localStorage.setItem(
          'records',
          JSON.stringify([
            {
              firstDay: firstDay,
              lastDay: lastDay,
              data: store.getters.getLogs,
            },
          ]),
        )
      }
    },
  },
})

export default store
