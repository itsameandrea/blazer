import { Controller } from "@hotwired/stimulus"
import {
  runQuery,
  cancelAllQueries,
} from "blazer/utilities/query_runner"
import {
  schemaQueriesPath,
  docsQueriesPath,
  tablesQueriesPath,
} from "blazer/utilities/routes"

export default class extends Controller {
  static values = {
    variableParams: Object,
    previewStatement: Object,
  }

  static targets = [
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
