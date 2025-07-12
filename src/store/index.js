import { createStore } from 'vuex'
import CryptoJS from 'crypto-js'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import html2canvas from 'html2canvas'
import saida from './saida'

const store = createStore({
  state: {
    access_token: null,
    refresh_token: null,
    logs: [],
    link: null,
    date_graph: null,
    popup: false,
    popup1: false,
    comments: [],
    commentS: [],
    pdf: false,
    mesEsc: null,
    type: 'retorno',
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
    getDateGraph(state) {
      return state.date_graph
    },
    getPopup(state) {
      return state.popup
    },
    getPopup1(state) {
      return state.popup1
    },
    getComments(state) {
      return state.comments
    },
    getCommentS(state) {
      return state.commentS
    },
    getPdf(state) {
      return state.pdf
    },
    getMes(state) {
      return state.mesEsc
    },
    getType(state) {
      return state.type
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
      if (log.length > 1) {
        log.forEach((element) => {
          const newElement = {
            day: element.day,
            event_time: element.event_time,
            value: element.value,
            comment: element.comment || '',
          }
          state.logs.push(newElement)
        })
      } else {
        state.logs.push(log)
      }
    },
    clearLog(state) {
      state.logs = []
    },
    setLink(state, payload) {
      state.link = payload
    },
    setDateGraph(state, payload) {
      state.date_graph = payload
    },
    setPopUp(state, payload) {
      state.popup = payload
    },
    setPopUp1(state, payload) {
      state.popup1 = payload
    },
    setComments(state, payload) {
      state.comments = payload
    },
    setCommentS(state, payload) {
      state.commentS = payload
    },
    clearComments(state) {
      state.comments = []
    },
    setPdf(state, payload) {
      state.pdf = payload
    },
    setMes(state, payload) {
      state.mesEsc = payload
    },
    setType(state, payload) {
      state.type = payload
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
        const day = records[0].day
        let totalValue = 0
        let count = 0

        records.forEach((record) => {
          totalValue += record.value / 10
          count += 1
        })

        const event_time = records[((records.length - 1) / 2).toFixed(0)].event_time
        const newRecord = {
          event_time: event_time,
          day: day,
          value: (totalValue / count).toFixed(1),
          comment: '',
        }
        return newRecord
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
            mode: 'cors',
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
        fetch(import.meta.env.VITE_API_HOST + url, {
          method: 'GET',
          headers: headers, // Use the headers object directly
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            return response.json()
          })
          .then((data) => {
            if (payload.mode === 1 || payload.mode === 2) {
              state.commit('setAccessToken', data.result.access_token)
              state.commit('setRefreshToken', data.result.refresh_token)
              setTimeout(() => {
                state.dispatch('getData', { mode: 2 })
              }, data.result.expire_time - 300)
            } else if (payload.mode === 3) {
              let logs = data.result.logs
              const array = []
              logs.forEach((element) => {
                const newElement = {
                  value: element.value,
                  event_time: element.event_time,
                  day: setData(element.event_time),
                  comment: element.comment || [],
                }
                array.push(newElement)
              })

              if (logs.length > 0) {
                logs = calculateDailyAverages(array)
                state.commit('setLog', logs)
              }
              if (state.getters.getLogs.length > 1) state.dispatch('sortLogs')
            }
          })
          .catch((error) => {
            console.error('Error:', error)
            if (error.msg === 'token is expired') {
              alert('Token expirado! Por favor, efetue o login novamente.')
              state.commit('setAccessToken', null)
              state.commit('setRefreshToken', null)
              state.dispatch('getData', { mode: 1 })
            }
          })
      }

      // Call the API request function
      makeApiRequest()
    },
    sortLogs(state) {
      const logs = state.getters.getLogs

      const sortLogs = logs.sort((a, b) => {
        // Extract day and month from the "day" field (format: DD/MM)
        const [dayA, monthA] = a.day.split('/').map(Number)
        const [dayB, monthB] = b.day.split('/').map(Number)

        // Sort by month first
        if (monthA !== monthB) {
          return monthA - monthB
        }
        // Then sort by day
        return dayA - dayB
      })
      state.commit('clearLog')
      state.commit('setLog', sortLogs)
    },
    async createPDF(state) {
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Set metadata for the PDF
      pdfDoc.setTitle('REGISTO LEGIONELLA')
      pdfDoc.setAuthor('Filipe Alves Fernandes')
      pdfDoc.setProducer('Adobe PDF Library 15.0')
      pdfDoc.setCreator('Adobe Acrobat Pro DC')
      pdfDoc.setCreationDate(new Date())

      const currentDate = new Date()
      const month =
        state.getters.getMes == null
          ? (currentDate.getMonth() + 1).toString().padStart(2, '0')
          : state.getters.getMes
      const year = currentDate.getFullYear()
      const logs = state.getters.getLogs || null
      const saida = state.getters['saida/getSaida'] || null

      let page = null
      let mesIni = null
      if (state.getters.getMes != 0) {
        page = pdfDoc.addPage([595, 842])
      } else {
        const date1 = new Date(logs[0].event_time)
        const date2 = new Date(logs[logs.length - 1].event_time)

        const m1 = date1.getMonth() + 1 // Janeiro é 0
        const y1 = date1.getFullYear()
        const m2 = date2.getMonth() + 1
        const y2 = date2.getFullYear()

        mesIni = m1

        const meses = (y2 - y1) * 12 + (m2 - m1)
        if (meses == 0) {
          page = pdfDoc.addPage([595, 842])
        } else {
          page = []
          for (let i = 0; i <= meses; i++) {
            page.push(pdfDoc.addPage([595, 842]))
          }
        }
      }
      const totalPages = pdfDoc.getPageCount()
      pdfDoc.setSubject(`This document contains ${totalPages} pages.`)

      const fontSize = 7.7
      const margin = 50
      const textYStart = 842 - margin // Margem superior igual à esquerda e direita
      const tableXStart = margin
      const tableYStart = textYStart - 100
      const rowHeight = 20
      const columnWidths = [50, 120, 120, 205]
      const tableWidth = columnWidths.reduce((a, b) => a + b, 0)
      const headerHeight = rowHeight

      function draw(page, month) {
        page.drawText('CONTROLO ÁGUA QUENTE - LEGIONELLA', {
          x: margin,
          y: textYStart,
          size: fontSize + 4,
          color: rgb(0, 0, 0),
          font: font,
        })

        page.drawText(import.meta.env.VITE_NAME, {
          x: margin,
          y: textYStart - 20,
          size: fontSize + 2,
          font: font,
        })

        page.drawText(`MÊS/ANO: ${month}/${year}`, {
          x: margin,
          y: textYStart - 40,
          size: fontSize + 2,
          font: font,
        })

        page.drawText('DEPÓSITO Nº 1-5', {
          x: margin,
          y: textYStart - 60,
          size: fontSize + 2,
          font: font,
        })

        // Tabela
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
          const columnWidth = columnWidths[columnIndex]
          const cellCenterX = columnStartX + columnWidth / 2
          const cellCenterY = tableYStart - headerHeight / 2
          const textWidth = font.widthOfTextAtSize(header, fontSize)
          const textStartX = cellCenterX - textWidth / 2
          const textStartY = cellCenterY - fontSize / 4

          page.drawText(header, {
            x: textStartX,
            y: textStartY,
            size: fontSize,
            font: font,
          })
        })
        const saidaC = JSON.parse(localStorage.getItem('saidaC'))
        for (let i = 0; i < 31; i++) {
          const y = tableYStart - headerHeight - (i + 1) * rowHeight
          const currentYear = new Date().getFullYear()

          const logForDay = logs.find((log) => {
            const logDate = new Date(log.event_time)
            return (
              logDate.getDate() === i + 1 &&
              logDate.getMonth() + 1 == month &&
              logDate.getFullYear() === currentYear
            )
          })
          const retorno = logForDay ? logForDay.value : ''
          const logForSaida = saida.find((log) => {
            const logDate = new Date(log.event_time)
            return (
              logDate.getDate() === i + 1 &&
              logDate.getMonth() + 1 == month &&
              logDate.getFullYear() === currentYear
            )
          })
          const logsSaida = logForSaida ? logForSaida.value : ''

          const comment = logForDay ? (logForDay.comment == 'false' ? '' : logForDay.comment) : ''

          const commentS = saidaC.find((log) => {
            const logDate = new Date(log.event_time)
            return (
              logDate.getDate() === i + 1 &&
              logDate.getMonth() + 1 == month &&
              logDate.getFullYear() === currentYear
            )
          })?.comment
          const data = [
            (i + 1).toString().padStart(2, '0'),
            retorno,
            logsSaida,
            comment + (commentS && comment ? ';' + commentS : commentS ? commentS : ''),
          ]

          data.forEach((text, columnIndex) => {
            const x = tableXStart + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0)
            const width = columnWidths[columnIndex]
            const height = rowHeight
            const centerY = y + (height - fontSize) / 2

            const textWidth = font.widthOfTextAtSize(text.toString(), fontSize)
            const centerX = x + (width - textWidth) / 2

            page.drawText(text.toString(), {
              x: centerX,
              y: centerY,
              size: fontSize,
              font: font,
            })
          })
        }
      }
      if (state.getters.getMes == 0 && page.length == undefined) {
        draw(page, new Date().getMonth() + 1)
      } else if (state.getters.getMes != 0) {
        draw(page, month)
      } else {
        for (let i = 0; i < page.length; i++) {
          draw(page[i], mesIni + i)
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      state.commit('setLink', url)
      if (store.getters.getLogs.length > 0) {
        state.dispatch('saveData')
      }
    },
    saveData() {
      let records = JSON.parse(localStorage.getItem('records'))

      const [firstDay, lastDay] = [
        store.getters.getLogs[0].day,
        store.getters.getLogs[store.getters.getLogs.length - 1].day,
      ]
      if (records) {
        records.forEach((record) => {
          if (
            record.firstDay.split('/').slice(0, 2).join('/') === firstDay &&
            record.lastDay.split('/').slice(0, 2).join('/') === lastDay
          ) {
            return
          } else {
            const save = store.getters.getLogs

            const newRecords = [
              {
                firstDay: save[0].day + '/' + (new Date().getFullYear() % 100),
                lastDay: save[save.length - 1].day + '/' + (new Date().getFullYear() % 100),
                data: save,
              },
            ]
            localStorage.setItem('records', null)
            localStorage.setItem('records', JSON.stringify(newRecords))
          }
        })
      } else {
        localStorage.setItem(
          'records',
          JSON.stringify([
            {
              firstDay: firstDay + '/' + (new Date().getFullYear() % 100),
              lastDay: lastDay + '/' + (new Date().getFullYear() % 100),
              data: store.getters.getLogs,
            },
          ]),
        )
      }
    },
    async generateGraph(state) {
      // Capturando o gráfico como imagem usando html2canvas
      const canvas = await html2canvas(document.querySelector('#chart'), {
        ignoreElements: (element) => element.id === 'excludeMe',
      })
      const imgData = canvas.toDataURL('image/png') // Obtendo a imagem como PNG

      // Criando o PDF com pdf-lib
      const pdfDoc = await PDFDocument.create()

      // Definindo metadados
      pdfDoc.setTitle('REGISTO LEGIONELLA')
      pdfDoc.setAuthor('Filipe Alves Fernandes')
      pdfDoc.setProducer('Adobe PDF Library 15.0')
      pdfDoc.setCreator('Adobe Acrobat Pro DC')
      pdfDoc.setCreationDate(new Date())

      // Adicionando uma página no formato A4 horizontal (842 x 595 px)
      const page = pdfDoc.addPage([842, 595]) // Página no formato paisagem
      const margin = 30 // Margens laterais
      const fontSize = 12

      // Cabeçalho
      const textYStart = 550 // Posição inicial do texto no topo
      page.drawText('CONTROLO ÁGUA QUENTE - LEGIONELLA', {
        x: margin,
        y: textYStart,
        size: fontSize + 4,
        color: rgb(0, 0, 0),
      })

      page.drawText(import.meta.env.VITE_NAME, {
        x: margin,
        y: textYStart - 20,
        size: fontSize + 2,
        color: rgb(0, 0, 0),
      })

      // Data
      const today = new Date()
      const year = today.getFullYear()
      const dateText = `Data: ${store.getters.getDateGraph} de ${year}`

      page.drawText(dateText, {
        x: margin,
        y: textYStart - 40,
        size: fontSize + 2,
        color: rgb(0, 0, 0),
      })

      // Embedando a imagem PNG no PDF
      const pngImage = await pdfDoc.embedPng(imgData)

      // Obtendo as dimensões da imagem original
      const { width, height } = pngImage

      // Definindo os limites máximos considerando as margens e a área da página
      const maxWidth = 842 - 60 // Largura máxima considerando margens
      const maxHeight = 595 - 60 // Altura máxima considerando margens

      // Calculando a escala para ajustar a imagem mantendo as proporções
      const scale = Math.min(maxWidth / width, maxHeight / height) // Escala para ajustar ao espaço disponível

      // Calculando as dimensões finais da imagem ajustada
      const imgWidth = width * scale
      const imgHeight = height * scale * 1.2

      // Posicionando o gráfico no centro da página horizontalmente e verticalmente
      const imgX = (842 - imgWidth) / 2 // Centralizado horizontalmente
      const imgY = (595 - imgHeight) / 2 // Centralizado verticalmente

      // Adicionando a imagem ao PDF com as dimensões ajustadas
      page.drawImage(pngImage, {
        x: imgX,
        y: imgY,
        width: imgWidth,
        height: imgHeight,
      })

      // Salvando o PDF
      const pdfBytes = await pdfDoc.save()

      // Criando o nome do arquivo com a data
      const pad = (n) => n.toString().padStart(2, '0')
      const [s, e] = store.getters.getDateGraph.split('-')
      const [sd, sm] = s.split('/').map(pad)
      const [ed, em] = e.split('/').map(pad)
      const filename = `grafico_legionella_${sd}-${sm}_ate_${ed}-${em}.pdf`

      // Criando um link para download do PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename // Usando o nome gerado com a data
      link.click() // Aciona o download automaticamente

      if (store.getters.getLogs.length > 0) {
        state.dispatch('saveData')
      }
    },
    readComments({ commit, getters }) {
      const logs = getters.getLogs || null
      const saida = getters['saida/getSaida']
      const saidaComments = JSON.parse(localStorage.getItem('saidaC')) || []
      const array = []
      const array1 = []

      logs.forEach((log) => {
        if (log.comment === '' && log.value <= 49.5) {
          array.push(logs.indexOf(log))
        }
      })

      saida.forEach((log) => {
        if (
          log.value <= 53 &&
          saidaComments.find((comment) => {
            return comment.event_time == log.event_time
          }) == undefined
        ) {
          array1.push(saida.indexOf(log))
        }
      })
      commit('setComments', array)
      commit('setCommentS', array1)
    },
  },
  modules: { saida },
})

export default store
