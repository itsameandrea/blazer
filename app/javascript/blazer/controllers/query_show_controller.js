import { Controller } from "@hotwired/stimulus"
import { runQuery } from "blazer/utilities/query_runner"

export default class extends Controller {
  static values = {
    runData: Object,
  }

  static targets = ["results", "code"]

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
