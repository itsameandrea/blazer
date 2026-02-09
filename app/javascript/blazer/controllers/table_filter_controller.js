import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    mode: { type: String, default: "rows" },
  }

  static targets = ["search", "filterable"]

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
