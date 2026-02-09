import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    accessToken: String,
    markers: Array,
    geojson: Array,
    type: { type: String, default: "marker" },
  }

  static targets = ["container"]

  connect() {
    const Mapkick = window.Mapkick
    if (!Mapkick) return

    const options = {
      accessToken: this.accessTokenValue,
      tooltips: { hover: false, html: true },
    }

    if (this.hasMarkersValue && this.markersValue.length > 0) {
      new Mapkick.Map(this.containerTarget, this.markersValue, options)
    } else if (this.hasGeojsonValue && this.geojsonValue.length > 0) {
      new Mapkick.AreaMap(this.containerTarget, this.geojsonValue, options)
    }
  }
}
