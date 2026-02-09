import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
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
