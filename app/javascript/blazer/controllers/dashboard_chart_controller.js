import { Controller } from "@hotwired/stimulus"
import { runQuery } from "blazer/utilities/query_runner"

export default class extends Controller {
  static values = {
    runData: Object,
  }

  static targets = ["chart"]

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
