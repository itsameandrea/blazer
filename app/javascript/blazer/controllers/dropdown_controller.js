import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggle", "menu"]

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
