(function () {
  var Stimulus = window.Stimulus
  var Controller = Stimulus.Controller
  var application = Stimulus.Application.start()

  function rootPath() {
    return document.querySelector('meta[name="blazer-root-path"]').content
  }

  function runQueriesPath() {
    return rootPath() + "queries/run"
  }

  function cancelQueriesPath() {
    return rootPath() + "queries/cancel"
  }

  function schemaQueriesPath(params) {
    return rootPath() + "queries/schema?" + new URLSearchParams(params).toString()
  }

  function docsQueriesPath(params) {
    return rootPath() + "queries/docs?" + new URLSearchParams(params).toString()
  }

  function tablesQueriesPath(params) {
    return rootPath() + "queries/tables?" + new URLSearchParams(params).toString()
  }

  function queriesPath() {
    return rootPath() + "queries"
  }

  function queryPath(id) {
    return rootPath() + "queries/" + id
  }

  function dashboardPath(id) {
    return rootPath() + "dashboards/" + id
  }

  function fuzzysearch(needle, haystack) {
    const hlen = haystack.length
    const nlen = needle.length
    if (nlen > hlen) return false
    if (nlen === hlen) return needle === haystack
    outer: for (let i = 0, j = 0; i < nlen; i++) {
      const nch = needle.charCodeAt(i)
      while (j < hlen) {
        if (haystack.charCodeAt(j++) === nch) continue outer
      }
      return false
    }
    return true
  }

  var pendingQueries = []
  var runningQueries = []
  var maxQueries = 3

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function csrfProtect(payload) {
    const paramNode = document.querySelector("meta[name=csrf-param]")
    const tokenNode = document.querySelector("meta[name=csrf-token]")
    const param = paramNode && paramNode.getAttribute("content")
    const token = tokenNode && tokenNode.getAttribute("content")
    if (param && token) payload[param] = token
    return payload
  }

  function appendToFormData(formData, key, value) {
    if (value !== null && typeof value === "object" && !(value instanceof File)) {
      Object.keys(value).forEach(function (subKey) {
        appendToFormData(formData, key + "[" + subKey + "]", value[subKey])
      })
    } else {
      formData.append(key, value)
    }
  }

  function runNext() {
    if (runningQueries.length < maxQueries) {
      const query = pendingQueries.shift()
      if (query) {
        runningQueries.push(query)
        runQueryHelper(query)
        runNext()
      }
    }
  }

  function queryComplete(query) {
    const index = runningQueries.indexOf(query)
    if (index > -1) runningQueries.splice(index, 1)
    runNext()
  }

  function cancelServerQuery(query) {
    const path = cancelQueriesPath()
    const data = { run_id: query.run_id, data_source: query.data_source }
    if (navigator.sendBeacon) {
      const formdata = new FormData()
      const params = csrfProtect(data)
      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          formdata.append(key, params[key])
        }
      }
      navigator.sendBeacon(path, formdata)
    } else {
      fetch(path, {
        method: "POST",
        body: new URLSearchParams(csrfProtect(data)),
        credentials: "same-origin",
        keepalive: true,
      })
    }
  }

  function runQueryHelper(query) {
    const controller = new AbortController()
    const formData = new FormData()

    Object.keys(query.data).forEach(function (key) {
      appendToFormData(formData, key, query.data[key])
    })

    const csrf = csrfProtect({})
    Object.keys(csrf).forEach(function (key) {
      formData.append(key, csrf[key])
    })

    query.controller = controller

    fetch(runQueriesPath(), {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed")
        return response.text()
      })
      .then(function (d) {
        if (d[0] === "{") {
          const parsed = JSON.parse(d)
          query.data.blazer = parsed
          setTimeout(function () {
            if (!query.canceled) runQueryHelper(query)
          }, 1000)
        } else {
          if (!query.canceled) query.success(d)
          queryComplete(query)
        }
      })
      .catch(function (err) {
        if (query.canceled || err.name === "AbortError") {
          cancelServerQuery(query)
        } else {
          query.error(err.message || "An error occurred")
        }
        queryComplete(query)
      })
  }

  function runQuery(data, success, error) {
    if (!data.data_source) {
      throw new Error("Data source is required to cancel queries")
    }
    data.run_id = uuid()
    const query = {
      data: data,
      success: success,
      error: error,
      run_id: data.run_id,
      data_source: data.data_source,
      canceled: false,
    }
    pendingQueries.push(query)
    runNext()
    return query
  }

  function cancelQuery(query) {
    query.canceled = true
    if (query.controller) query.controller.abort()
  }

  function cancelAllQueries() {
    pendingQueries = []
    for (let i = 0; i < runningQueries.length; i++) {
      cancelQuery(runningQueries[i])
    }
  }

  window.addEventListener("unload", cancelAllQueries)

  class DropdownController extends Controller {
    connect() {
      this.boundCloseOnOutsideClick = this.closeOnOutsideClick.bind(this)
      document.addEventListener("click", this.boundCloseOnOutsideClick)
    }

    disconnect() {
      document.removeEventListener("click", this.boundCloseOnOutsideClick)
    }

    toggle(event) {
      event.preventDefault()
      event.stopPropagation()
      const expanded = this.toggleTarget.getAttribute("aria-expanded") === "true"

      this.closeAllDropdowns()

      if (!expanded && this.hasMenuTarget) {
        this.menuTarget.classList.remove("hidden")
        this.toggleTarget.setAttribute("aria-expanded", "true")
      }
    }

    closeOnOutsideClick(event) {
      if (!this.element.contains(event.target)) {
        this.close()
      }
    }

    close() {
      if (this.hasMenuTarget) {
        this.menuTarget.classList.add("hidden")
      }
      if (this.hasToggleTarget) {
        this.toggleTarget.setAttribute("aria-expanded", "false")
      }
    }

    closeAllDropdowns() {
      document.querySelectorAll("[data-dropdown-menu]").forEach(function (el) {
        el.classList.add("hidden")
      })
      document.querySelectorAll("[data-dropdown-toggle]").forEach(function (el) {
        el.setAttribute("aria-expanded", "false")
      })
    }
  }
  DropdownController.targets = ["toggle", "menu"]

  class BackspaceNavController extends Controller {
    preventBackspace(event) {
      if (event.keyCode !== 8) return

      const d = event.target
      let preventKeyPress = false

      switch (d.tagName.toUpperCase()) {
        case "TEXTAREA":
          preventKeyPress = d.readOnly || d.disabled
          break
        case "INPUT":
          preventKeyPress =
            d.readOnly ||
            d.disabled ||
            (d.attributes["type"] &&
              ["radio", "reset", "checkbox", "submit", "button"].indexOf(
                d.attributes["type"].value.toLowerCase()
              ) >= 0)
          break
        case "DIV":
          preventKeyPress =
            d.readOnly ||
            d.disabled ||
            !(
              d.attributes["contentEditable"] &&
              d.attributes["contentEditable"].value === "true"
            )
          break
        default:
          preventKeyPress = true
          break
      }

      if (preventKeyPress) {
        event.preventDefault()
      }
    }
  }

  class CodeExpandController extends Controller {
    expand() {
      this.element.classList.add("expanded")
    }

    preventDisabledLink(event) {
      const disabledLink = event.target.closest("a[disabled]")
      if (disabledLink) {
        event.preventDefault()
      }
    }
  }

  class HomeSearchController extends Controller {
    connect() {
      this.pageSize = 200
      this.queryIds = {}
      this.listItems = this.dashboardsValue.concat(this.queriesValue)

      for (let i = 0; i < this.queriesValue.length; i++) {
        this.queryIds[this.queriesValue[i].id] = true
      }

      this.prepareSearch(this.listItems)
      this.render()
      this.searchTarget.focus()
      this.loadMore()
    }

    prepareQuery(str) {
      return str.toLowerCase()
    }

    prepareSearch(list) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        let searchStr = item.name + (item.creator || "")
        if (item.creator === "You") {
          searchStr += "mine me"
        }
        item.searchStr = this.prepareQuery(searchStr)
      }
    }

    itemPath(item) {
      if (item.dashboard) {
        return dashboardPath(item.to_param)
      }
      return queryPath(item.to_param)
    }

    visibleItems(term) {
      if (term.length === 0) {
        return this.listItems.slice(0, this.pageSize)
      }

      const items = []
      const fuzzyItems = []
      for (let i = 0; i < this.listItems.length; i++) {
        const item = this.listItems[i]
        if (item.searchStr.indexOf(term) !== -1) {
          items.push(item)
          if (items.length === this.pageSize) break
        } else if (fuzzysearch(term, item.searchStr)) {
          fuzzyItems.push(item)
        }
      }

      return items.concat(fuzzyItems).slice(0, this.pageSize)
    }

    render() {
      const term = this.prepareQuery(this.searchTarget.value || "")
      const rows = this.visibleItems(term)
      const hasCreator = this.hasCreatorValue

      this.listTarget.innerHTML = rows
        .map(function (item) {
          const nameClass = item.dashboard ? "dashboard" : ""
          const vars = item.vars
            ? '<span class="vars">' + item.vars + "</span>"
            : ""
          const creatorCell = hasCreator
            ? '<td class="creator">' + (item.creator || "") + "</td>"
            : ""
          const path = item.dashboard
            ? dashboardPath(item.to_param)
            : queryPath(item.to_param)
          return (
            "<tr><td><a href=\"" +
            path +
            '" class="' +
            nameClass +
            '">' +
            item.name +
            "</a> " +
            vars +
            "</td>" +
            creatorCell +
            "</tr>"
          )
        })
        .join("")
    }

    search() {
      this.render()
    }

    loadMore() {
      if (!this.moreValue) return

      this.loadingTarget.classList.remove("hidden")
      const self = this

      fetch(queriesPath(), { credentials: "same-origin" })
        .then(function (response) {
          return response.json()
        })
        .then(function (data) {
          const newValues = []
          for (let i = 0; i < data.length; i++) {
            const val = data[i]
            if (val && !self.queryIds[val.id]) {
              newValues.push(val)
              self.queryIds[val.id] = true
            }
          }

          self.prepareSearch(newValues)
          self.listItems = self.listItems.concat(newValues)
          self.loadingTarget.classList.add("hidden")
          self.moreValue = false
          self.render()
        })
        .catch(function () {
          self.loadingTarget.classList.add("hidden")
        })
    }
  }
  HomeSearchController.values = {
    dashboards: Array,
    queries: Array,
    more: Boolean,
    hasCreator: Boolean,
  }
  HomeSearchController.targets = ["search", "list", "loading"]

  class QueryShowController extends Controller {
    connect() {
      if (this.hasRunDataValue && Object.keys(this.runDataValue).length > 0) {
        this.executeQuery()
      }

      this.highlightCode()
    }

    executeQuery() {
      const resultsTarget = this.resultsTarget

      runQuery(
        this.runDataValue,
        function (data) {
          resultsTarget.innerHTML = data
        },
        function (message) {
          resultsTarget.classList.add("query-error")
          resultsTarget.innerHTML = message
        }
      )
    }

    highlightCode() {
      if (!this.hasCodeTarget) return

      const code = this.codeTarget
      if (code.textContent.length < 10000 && window.hljs) {
        window.hljs.highlightElement(code)
      }
    }
  }
  QueryShowController.values = {
    runData: Object,
  }
  QueryShowController.targets = ["results", "code"]

  class QueryEditorController extends Controller {
    connect() {
      this.editor = null
      this.error = false
      this.dataSource = ""
      this.tablesAbortController = null

      this.showEditor()
      this.updateDataSource(this.dataSourceTarget.value)
    }

    showEditor() {
      const ace = window.ace
      this.editor = ace.edit(this.editorTarget)
      this.editor.setTheme("ace/theme/twilight")
      this.editor.getSession().setMode("ace/mode/sql")
      this.editor.setOptions({
        enableBasicAutocompletion: false,
        enableSnippets: false,
        enableLiveAutocompletion: false,
        highlightActiveLine: false,
        fontSize: 12,
        minLines: 10,
      })
      this.editor.renderer.setShowGutter(true)
      this.editor.renderer.setPrintMarginColumn(false)
      this.editor.renderer.setPadding(10)
      this.editor.getSession().setUseWrapMode(true)

      const self = this
      this.editor.commands.addCommand({
        name: "run",
        bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
        exec: function () {
          self.runQueryNow()
        },
        readOnly: false,
      })
      this.editor.commands.removeCommands(["gotoline", "find"])
      this.editor.getSession().on("change", function () {
        self.statementTarget.value = self.editor.getValue()
        self.adjustHeight()
      })
      this.adjustHeight()
      this.editor.focus()
    }

    adjustHeight() {
      let lines = this.editor.getSession().getScreenLength()
      if (lines < 9) lines = 9

      const height = (lines + 1) * 16 + "px"
      this.editorTarget.style.height = height
      this.editor.resize()
    }

    getSQL() {
      const selectedText = this.editor.getSelectedText()
      const text =
        selectedText.length < 10 ? this.editor.getValue() : selectedText
      return text.replace(/\n/g, "\r\n")
    }

    getErrorLine(resultHtml) {
      const match =
        resultHtml.substring(0, 100).includes("alert-danger") &&
        /LINE (\d+)/g.exec(resultHtml)
      if (!match) return null

      let errorLine = parseInt(match[1], 10)
      if (this.editor.getSelectedText().length >= 10) {
        errorLine += this.editor.getSelectionRange().start.row
      }
      return errorLine
    }

    setRunning(running) {
      this.runButtonTarget.classList.toggle("hidden", running)
      this.cancelButtonTarget.classList.toggle("hidden", !running)
      this.loadingTarget.classList.toggle("hidden", !running)
    }

    showResults(data) {
      this.resultsHtmlTarget.innerHTML = data
      this.resultsHtmlTarget.classList.toggle("query-error", this.error)
    }

    updatePaths() {
      this.schemaLinkTarget.setAttribute(
        "href",
        schemaQueriesPath({ data_source: this.dataSource })
      )
      this.docsLinkTarget.setAttribute(
        "href",
        docsQueriesPath({ data_source: this.dataSource })
      )
    }

    runQueryNow() {
      this.setRunning(true)
      this.error = false
      this.resultsHtmlTarget.innerHTML = ""
      cancelAllQueries()

      const data = {
        statement: this.getSQL(),
        data_source: this.dataSourceTarget.value,
        variables: this.variableParamsValue,
      }

      const self = this
      runQuery(
        data,
        function (response) {
          self.setRunning(false)
          self.showResults(response)
          const errorLine = self.getErrorLine(response)
          if (errorLine) {
            self.editor
              .getSession()
              .addGutterDecoration(errorLine - 1, "error")
            self.editor.scrollToLine(errorLine, true, true, function () {})
            self.editor.gotoLine(errorLine, 0, true)
            self.editor.focus()
          }
        },
        function (response) {
          self.setRunning(false)
          self.error = true
          self.showResults(response)
        }
      )
    }

    run() {
      this.runQueryNow()
    }

    cancel() {
      this.setRunning(false)
      cancelAllQueries()
    }

    updateTableOptions(tables) {
      this.tableNamesTarget.innerHTML =
        '<option value="">Preview table</option>'
      tables.forEach(function (table) {
        const option = document.createElement("option")
        if (typeof table === "object") {
          option.textContent = table.table
          option.value = table.value
        } else {
          option.textContent = table
          option.value = table
        }
        this.tableNamesTarget.appendChild(option)
      }.bind(this))
    }

    updateDataSource(nextDataSource) {
      this.dataSource = nextDataSource
      this.updatePaths()

      if (this.tablesAbortController) {
        this.tablesAbortController.abort()
      }
      this.tablesAbortController = new AbortController()

      const self = this
      fetch(tablesQueriesPath({ data_source: this.dataSource }), {
        credentials: "same-origin",
        signal: this.tablesAbortController.signal,
      })
        .then(function (response) {
          return response.json()
        })
        .then(function (data) {
          self.updateTableOptions(data)
        })
        .catch(function () {
          self.updateTableOptions([])
        })
    }

    dataSourceChanged() {
      this.updateDataSource(this.dataSourceTarget.value)
    }

    tableSelected() {
      const value = this.tableNamesTarget.value
      if (
        !value ||
        !this.previewStatementValue[this.dataSource]
      ) {
        return
      }
      this.editor.setValue(
        this.previewStatementValue[this.dataSource].replace("{table}", value),
        1
      )
      this.runQueryNow()
      this.tableNamesTarget.value = ""
    }
  }
  QueryEditorController.values = {
    variableParams: Object,
    previewStatement: Object,
  }
  QueryEditorController.targets = [
    "runButton",
    "cancelButton",
    "resultsHtml",
    "loading",
    "docsLink",
    "schemaLink",
    "statement",
    "dataSource",
    "tableNames",
    "editor",
  ]

  class VariablesFormController extends Controller {
    submitForm(event) {
      const form = this.element.closest("form") || this.element

      const start = form.querySelector("input[name='start_time']")
      const ending = form.querySelector("input[name='end_time']")

      if (start && start.value) {
        start.value = new Date(start.value + "T00:00:00").toISOString()
      }
      if (ending && ending.value) {
        ending.value = new Date(ending.value + "T23:59:59").toISOString()
      }
    }
  }

  class DashboardChartController extends Controller {
    connect() {
      if (!this.hasRunDataValue || Object.keys(this.runDataValue).length === 0) {
        return
      }

      const chartTarget = this.chartTarget

      runQuery(
        this.runDataValue,
        function (data) {
          chartTarget.innerHTML = data
        },
        function (message) {
          chartTarget.classList.add("query-error")
          chartTarget.innerHTML = message
        }
      )
    }
  }
  DashboardChartController.values = {
    runData: Object,
  }
  DashboardChartController.targets = ["chart"]

  class DashboardFormController extends Controller {
    connect() {
      this.selectedQueries = this.dashboardQueriesValue.map(function (query) {
        return { id: String(query.id), name: query.name }
      })

      this.populateSelect()
      this.renderQueries()
      this.initSortable()
    }

    populateSelect() {
      const select = this.querySelectTarget
      this.queriesValue.forEach(function (query) {
        const option = document.createElement("option")
        option.value = String(query.value)
        option.textContent = query.text
        select.appendChild(option)
      })
    }

    renderQueries() {
      this.queriesListTarget.innerHTML = this.selectedQueries
        .map(function (query, index) {
          return (
            '<li class="list-group-item" data-index="' +
            index +
            '"><button type="button" class="remove-query" aria-label="Remove">x</button>' +
            query.name +
            '<input type="hidden" name="query_ids[]" value="' +
            query.id +
            '"></li>'
          )
        })
        .join("")
    }

    addQuery(event) {
      const id = this.querySelectTarget.value
      if (!id) return

      const option =
        this.querySelectTarget.options[this.querySelectTarget.selectedIndex]
      const name = option.textContent

      for (let i = 0; i < this.selectedQueries.length; i++) {
        if (this.selectedQueries[i].id === id) {
          this.selectedQueries.splice(i, 1)
          break
        }
      }

      this.selectedQueries.push({ id: id, name: name })
      this.renderQueries()
      this.querySelectTarget.value = ""
    }

    removeQuery(event) {
      if (!event.target.classList.contains("remove-query")) return

      const item = event.target.closest("li")
      const index = parseInt(item.getAttribute("data-index"), 10)
      this.selectedQueries.splice(index, 1)
      this.renderQueries()
    }

    initSortable() {
      const self = this
      const Sortable = window.Sortable

      if (!Sortable) return

      Sortable.create(this.queriesListTarget, {
        onEnd: function (event) {
          self.selectedQueries.splice(
            event.newIndex,
            0,
            self.selectedQueries.splice(event.oldIndex, 1)[0]
          )
          self.renderQueries()
        },
      })
    }
  }
  DashboardFormController.values = {
    queries: Array,
    dashboardQueries: Array,
  }
  DashboardFormController.targets = ["queriesList", "querySelect"]

  class TableFilterController extends Controller {
    connect() {
      this.searchTarget.focus()
    }

    filter() {
      const value = this.searchTarget.value.toLowerCase()

      if (this.modeValue === "schema") {
        this.filterSchema(value)
      } else {
        this.filterRows(value)
      }
    }

    filterRows(value) {
      this.filterableTargets.forEach(function (row) {
        row.style.display =
          row.textContent.toLowerCase().indexOf(value) > -1 ? "" : "none"
      })
    }

    filterSchema(value) {
      this.filterableTargets.forEach(function (table) {
        const thead = table.querySelector("thead")
        const headMatch =
          thead && thead.textContent.toLowerCase().indexOf(value) > -1
        let found = headMatch

        const rows = table.querySelectorAll("tbody tr")
        if (headMatch) {
          rows.forEach(function (row) {
            row.style.display = ""
          })
        } else {
          rows.forEach(function (row) {
            const matched = row.textContent.toLowerCase().indexOf(value) > -1
            row.style.display = matched ? "" : "none"
            if (matched) found = true
          })
        }

        table.style.display = found ? "" : "none"
      })
    }
  }
  TableFilterController.values = {
    mode: { type: String, default: "rows" },
  }
  TableFilterController.targets = ["search", "filterable"]

  class MapController extends Controller {
    connect() {
      const Mapkick = window.Mapkick
      if (!Mapkick) return

      const options = {
        accessToken: this.accessTokenValue,
        tooltips: { hover: false, html: true },
      }

      if (this.hasMarkersValue && this.markersValue.length > 0) {
        new Mapkick.Map(this.containerTarget, this.markersValue, options)
      } else if (this.hasGeojsonValue && this.geojsonValue.length > 0) {
        new Mapkick.AreaMap(this.containerTarget, this.geojsonValue, options)
      }
    }
  }
  MapController.values = {
    accessToken: String,
    markers: Array,
    geojson: Array,
    type: { type: String, default: "marker" },
  }
  MapController.targets = ["container"]

  class AutosubmitController extends Controller {
    submitIfCompleted(event) {
      if (!event.target.name) return

      const form = this.element.closest("form") || this.element
      if (!form) return

      let completed = true
      form.querySelectorAll("input[name], select").forEach(function (el) {
        if (el.value === "") completed = false
      })

      if (completed) form.submit()
    }
  }

  application.register("blazer--dropdown", DropdownController)
  application.register("blazer--backspace-nav", BackspaceNavController)
  application.register("blazer--code-expand", CodeExpandController)
  application.register("blazer--home-search", HomeSearchController)
  application.register("blazer--query-show", QueryShowController)
  application.register("blazer--query-editor", QueryEditorController)
  application.register("blazer--variables-form", VariablesFormController)
  application.register("blazer--dashboard-chart", DashboardChartController)
  application.register("blazer--dashboard-form", DashboardFormController)
  application.register("blazer--table-filter", TableFilterController)
  application.register("blazer--map", MapController)
  application.register("blazer--autosubmit", AutosubmitController)
})()
