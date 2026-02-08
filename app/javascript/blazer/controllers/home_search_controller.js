import { Controller } from "@hotwired/stimulus"
import { fuzzysearch } from "blazer/utilities/fuzzysearch"
import { queriesPath, queryPath, dashboardPath } from "blazer/utilities/routes"

export default class extends Controller {
  static values = {
    dashboards: Array,
    queries: Array,
    more: Boolean,
    hasCreator: Boolean,
  }

  static targets = ["search", "list", "loading"]

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
