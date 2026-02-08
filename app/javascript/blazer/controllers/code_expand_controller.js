import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  expand() {
    this.element.classList.add("expanded")
  }

  preventDisabledLink(event) {
    const disabledLink = event.target.closest("a[disabled]")
    if (disabledLink) {
      event.preventDefault()
    }
  }
}
