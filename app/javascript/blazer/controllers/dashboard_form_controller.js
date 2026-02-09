import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    queries: Array,
    dashboardQueries: Array,
  }

  static targets = ["queriesList", "querySelect"]

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
