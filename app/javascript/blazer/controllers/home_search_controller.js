import { Controller } from "@hotwired/stimulus"
import { fuzzysearch } from "blazer/utilities/fuzzysearch"
import { queriesPath, queryPath, dashboardPath, aiSearchPath } from "blazer/utilities/routes"

export default class extends Controller {
  static values = {
    dashboards: Array,
    queries: Array,
    more: Boolean,
    hasCreator: Boolean,
    aiEnabled: Boolean,
  }

  static targets = ["search", "list", "loading", "aiResults"]

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
    if (this.aiDebounce) clearTimeout(this.aiDebounce)

    this.render()

    if (this.aiEnabledValue && this.searchTarget.value.trim().length > 2) {
      const self = this
      this.aiDebounce = setTimeout(function () {
        self.aiSearch()
      }, 400)
    } else if (this.hasAiResultsTarget) {
      this.aiResultsTarget.classList.add("hidden")
    }
  }

  aiSearch() {
    const query = this.searchTarget.value.trim()
    if (query.length < 3) return

    if (this.hasAiResultsTarget) {
      this.aiResultsTarget.classList.remove("hidden")
      this.aiResultsTarget.innerHTML = '<p class="text-sm text-[var(--wz-text-tertiary)] px-5 py-3">Searching with AI…</p>'
    }

    const self = this
    fetch(aiSearchPath({ query: query, limit: 5 }), { credentials: "same-origin" })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            const message = data && data.error ? data.error : "AI search failed"
            throw new Error(message)
          }
          return data
        })
      })
      .then(function (results) {
        if (!self.hasAiResultsTarget) return
        if (results.error) {
          self.aiResultsTarget.innerHTML = '<p class="text-sm text-red-600 px-5 py-3">' + results.error + '</p>'
          return
        }
        if (results.length === 0) {
          self.aiResultsTarget.innerHTML = '<p class="text-sm text-[var(--wz-text-tertiary)] px-5 py-3">No AI results found</p>'
          return
        }
        self.aiResultsTarget.innerHTML = '<div class="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--wz-accent)]">AI Results</div>' +
          results.map(function (item) {
            return '<div class="border-t border-[var(--wz-accent)]/10 px-5 py-2"><a href="' + queryPath(item.to_param) + '" class="text-sm font-medium text-[var(--wz-text)] hover:text-[var(--wz-accent)]">' + item.name + '</a>' +
              (item.vars ? ' <span class="vars">' + item.vars + '</span>' : '') +
              '</div>'
          }).join("")
      })
      .catch(function (error) {
        if (self.hasAiResultsTarget) {
          self.aiResultsTarget.classList.remove("hidden")
          self.aiResultsTarget.innerHTML = '<p class="text-sm text-red-600 px-5 py-3">' + (error.message || "AI search failed") + '</p>'
        }
      })
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
