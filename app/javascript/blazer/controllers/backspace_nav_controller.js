import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  preventBackspace(event) {
    if (event.keyCode !== 8) return

    const d = event.target
    let preventKeyPress = false

    switch (d.tagName.toUpperCase()) {
      case "TEXTAREA":
        preventKeyPress = d.readOnly || d.disabled
        break
      case "INPUT":
        preventKeyPress =
          d.readOnly ||
          d.disabled ||
          (d.attributes["type"] &&
            ["radio", "reset", "checkbox", "submit", "button"].indexOf(
              d.attributes["type"].value.toLowerCase()
            ) >= 0)
        break
      case "DIV":
        preventKeyPress =
          d.readOnly ||
          d.disabled ||
          !(
            d.attributes["contentEditable"] &&
            d.attributes["contentEditable"].value === "true"
          )
        break
      default:
        preventKeyPress = true
        break
    }

    if (preventKeyPress) {
      event.preventDefault()
    }
  }
}
