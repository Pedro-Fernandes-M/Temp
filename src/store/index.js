import { createStore } from 'vuex'
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
    loading: false,
    key: null,
    sheetId: null,
    nome: ' ',
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
    getLoading(state) {
      return state.loading
    },
    getKey(state) {
      return state.key
    },
    getSheetId(state) {
      return state.sheetId
    },
    getNome(state) {
      return state.nome
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
      if (Array.isArray(log)) {
        // Pequena otimização: suporta array direto ou log individual
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
        // Fallback para o comportamento antigo se vier um objeto único
        const newElement = {
          day: log.day,
          event_time: log.event_time,
          value: log.value,
          comment: log.comment || '',
        }
        state.logs.push(newElement)
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
    setLoading(state) {
      state.loading = !state.loading
    },
    setKey(state, payload) {
      state.key = payload.value
      if (payload.mode === 1) {
        localStorage.setItem('key', JSON.stringify(payload.value))
      }
    },
    setSheetId(state, payload) {
      state.sheetId = payload.value
      if (payload.mode === 1) {
        localStorage.setItem('sheetId', JSON.stringify(payload.value))
      }
    },
    setNome(state, payload) {
      state.nome = payload.value
      if (payload.mode === 1) {
        localStorage.setItem('nome', JSON.stringify(payload.value))
      }
    },
  },

  actions: {
    async getData({ commit, getters, dispatch }) {
      try {
        const currentLogs = getters.getLogs
        let lastDateNormalized = 0 // Timestamp normalizado à meia-noite

        // 1. Obter a DATA do último registo (ignorando as horas/minutos)
        if (currentLogs && currentLogs.length > 0) {
          const lastTs = Number(currentLogs[currentLogs.length - 1].event_time)
          const d = new Date(lastTs)
          d.setHours(0, 0, 0, 0) // Zera as horas para comparar apenas o dia
          lastDateNormalized = d.getTime()
        }
        // Fallback para LocalStorage se a store estiver vazia
        else {
          const records = JSON.parse(localStorage.getItem('records'))
          if (records && records.length > 0) {
            const lastBlock = records[records.length - 1]
            if (lastBlock.data && lastBlock.data.length > 0) {
              const lastLog = lastBlock.data[lastBlock.data.length - 1]
              const d = new Date(Number(lastLog.event_time))
              d.setHours(0, 0, 0, 0)
              lastDateNormalized = d.getTime()
            }
          }
        }

        console.log(
          `Verificando novos dias após: ${new Date(lastDateNormalized).toLocaleDateString()}`,
        )

        const year = new Date().getFullYear().toString()
        const apiKey = getters.getKey
        const sheetId = getters.getSheetId
        const range = `${year}!A:B`
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`

        const response = await fetch(url)
        if (response.status != 200) {
          alert(response.status)
        }
        const result = await response.json()

        if (!result.values || result.values.length === 0) return

        // 2. Filtro CORRIGIDO: Compara Dias e não Momentos
        const newRows = result.values.filter((row) => {
          const rowTimestamp = Number(row[1])
          if (isNaN(rowTimestamp)) return false

          // Normaliza a data da linha para meia-noite
          const rowDate = new Date(rowTimestamp)
          rowDate.setHours(0, 0, 0, 0)
          const rowDateNormalized = rowDate.getTime()

          // SÓ ACEITA se o dia for > que o último dia guardado
          // Isto elimina duplicados do mesmo dia com horas diferentes
          return rowDateNormalized > lastDateNormalized
        })

        if (newRows.length === 0) {
          alert('Nenhum dia novo encontrado.')
          return
        }

        // 3. Formatar e Guardar (igual ao anterior)
        const formattedLogs = newRows.map((row) => {
          const timestamp = Number(row[1])
          const dateObj = new Date(timestamp)

          const day = String(dateObj.getDate()).padStart(2, '0')
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')

          return {
            day: `${day}/${month}`,
            event_time: timestamp,
            value: String(row[0]).replace(',', '.'),
            comment: '',
          }
        })

        commit('setLog', formattedLogs)

        dispatch('sortLogs').then(() => {
          dispatch('saveData')
        })

        console.log(`${formattedLogs.length} novos dias adicionados.`)
      } catch (error) {
        console.error('Erro no getData:', error)
      }
    },
    sortLogs(state) {
      const logs = state.getters.getLogs
      // Pequena proteção caso logs seja null
      if (!logs) return

      const sortLogs = logs.sort((a, b) => {
        const [dayA, monthA] = a.day.split('/').map(Number)
        const [dayB, monthB] = b.day.split('/').map(Number)
        if (monthA !== monthB) return monthA - monthB
        return dayA - dayB
      })
      state.commit('clearLog')
      // Passa o array inteiro, a mutation atualizada lida com isso (performance++)
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

        page.drawText(state.getters.getNome, {
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

          const logForDay = logs?.find((log) => {
            const logDate = new Date(log.event_time)
            return (
              logDate.getDate() === i + 1 &&
              logDate.getMonth() + 1 == month &&
              logDate.getFullYear() === currentYear
            )
          })
          const retorno = logForDay ? logForDay.value : ''
          const logForSaida = saida?.find((log) => {
            const logDate = new Date(log.event_time)
            return (
              logDate.getDate() === i + 1 &&
              logDate.getMonth() + 1 == month &&
              logDate.getFullYear() === currentYear
            )
          })
          const logsSaida = logForSaida ? logForSaida.value : ''

          const comment = logForDay ? (logForDay.comment == 'false' ? '' : logForDay.comment) : ''

          const commentS = saidaC?.find((log) => {
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
    saveData({ getters }) {
      const logs = getters.getLogs

      // Se não houver logs, não fazemos nada
      if (!logs || logs.length === 0) return

      // Função auxiliar para garantir que o ano está lá (ex: "01/03" -> "01/03/25")
      const currentYear = new Date().getFullYear() % 100
      const formatDate = (dateStr) => {
        if (!dateStr) return ''
        // Se a data já tiver 3 partes (DD/MM/YY), devolve como está. Se tiver 2, adiciona o ano.
        return dateStr.split('/').length === 2 ? `${dateStr}/${currentYear}` : dateStr
      }

      // Cria o objeto ÚNICO com a estrutura exata que pediste
      const recordObj = {
        firstDay: formatDate(logs[0].day),
        lastDay: formatDate(logs[logs.length - 1].day),
        data: logs, // Aqui vai a lista completa de objetos
      }

      // Grava diretamente o objeto (sem ser dentro de um array)
      localStorage.setItem('records', JSON.stringify(recordObj))
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

      page.drawText(state.getters.getNome, {
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
          saidaComments?.find((comment) => {
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
