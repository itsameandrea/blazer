import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
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
