import request from 'superagent'
import Pbf from 'Pbf'
import geobuf from 'geobuf'
request.parse['application/x-protobuf'] = (buffer) => new Pbf(buffer)
import L from 'leaflet'

import VectorField from './VectorField'
import ValueField from './ValueField'
import CanvasLayer from './CanvasLayer'

export default CanvasLayer.extend({
  initialize (type, colorScale) {
    CanvasLayer.prototype.initialize.call(this)
    this.type = type
    this.date = new Date(new Date().setUTCHours(0, 0, 0, 0))
    this.forecast = 0
    this.colorScale = colorScale
  },

  coordsToPx (coords) {
    return this._map.latLngToContainerPoint(coords)
  },

  renderVector (ctx, start, dir, scale) {
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)'
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(start.x + dir[0] * scale, start.y + dir[1] * scale)
    ctx.closePath()
    ctx.stroke()
  },

  onDrawLayer (info) {
    if (!this.data) {
      return
    }

    console.time('render()')
    const canvas = info.canvas
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // this.data.forEach((latlng, value) => {
    //   const pos = this.coordsToPx(latlng)
    //   this.renderVector(ctx, pos, value, 5)
    // })

    if (this.colormap) {
      Object.keys(this.colormap).forEach((color) => {
        let points = this.colormap[color]
        ctx.fillStyle = color
        points.forEach((point) => {
          let pos = this.coordsToPx(point)
          ctx.beginPath()
          ctx.arc(pos.x + Math.random() * 3, pos.y + Math.random() * 3, 20, 0, Math.PI * 2)
          ctx.closePath()
          ctx.fill()
        })
      })
    }

    console.timeEnd('render()')
  },

  setData (field) {
    this.data = field
    this.colormap = {}

    const density = 5
    let size = this._map.getSize()
    let width = size.x
    let height = size.y

    for (let y = 0; y < height; y += density) {
      for (let x = 0; x < width; x += density) {
        let latlng = this._map.containerPointToLatLng([x, y])
        let value = this.data.get([latlng.lat, latlng.lng])

        let colorValues = this.colorScale.getColor(value)

        if (colorValues !== null) {
          let [r, g, b] = colorValues
          let color = `rgba(${r}, ${g}, ${b}, 0.02)`

          if (!this.colormap[color]) {
            this.colormap[color] = []
          }

          this.colormap[color].push(latlng)
        }
      }
    }

    this.needRedraw()
  },

  onAdd (map) {
    CanvasLayer.prototype.onAdd.call(this, map)
    map.on('click', this.onClick, this)
      .on('move', this.onMove, this)

    this.loadData()
  },

  onRemove (map) {
    map.off('click', this.onClick)
    CanvasLayer.prototype.onRemove.call(this, map)
  },

  onClick ({latlng}) {
    let value = this.data.get([latlng.lat, latlng.lng])
    let ev = {
      variable: this.type,
      latlng: latlng
    }

    ev.date = this.getCurrentDate()

    if (value && value.length === 2) {
      ev.value = Math.sqrt(value[0] * value[0] + value[1] * value[1])
    } else {
      ev.value = value
    }

    this.fire('click', ev)
  },

  onMove () {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => this.loadData(), 500)
  },

  getBounds () {
    let size = this._map.getSize()
    let top = this._map.containerPointToLatLng([size.x / 2, 0])
    let bottom = this._map.containerPointToLatLng([size.x / 2, size.y])
    let sw = this._map.containerPointToLatLng([0, size.y])
    let ne = this._map.containerPointToLatLng([size.x, 0])

    console.log(bottom.lat, sw.lat)
    console.log(top.lat, ne.lat)

    let lngDelta = ne.lng - sw.lng
    let latDelta = top.lat - bottom.lat
    if (lngDelta < 3) {
      sw.lng -= (3 - lngDelta) / 2
      ne.lng += (3 - lngDelta) / 2
    }
    if (latDelta < 3) {
      top.lat += (3 - latDelta) / 2
      bottom.lat -= (3 - latDelta) / 2
    }

    console.log(bottom.lat, sw.lat)
    console.log(top.lat, ne.lat)

    let bounds = L.latLngBounds(
      [Math.floor(Math.min(bottom.lat, sw.lat)), Math.floor(sw.lng)],
      [Math.ceil(Math.max(top.lat, ne.lat)), Math.ceil(ne.lng)]
    )
    // .pad(0.4, 0.4)

    return bounds
  },

  loadData () {
    let bounds = this.getBounds()
    let time = this.getCurrentDate().getTime()

    request
    .get(`http://localhost:9080/layer/${this.type}/${time}`)
    .query({bb: bounds.toBBoxString()})
    .responseType('arraybuffer')
    .end((err, res) => {
      console.log(err, res)
      let points = geobuf.decode(res.body)

      const aBounds = [
        bounds.getNorth(),
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast()
      ]
      let field

      if (this.type === 'uvgrd') {
        field = VectorField.fromFeatures(aBounds, 1, 1, points.features)
      } else {
        field = ValueField.fromFeatures(aBounds, 1, 1, points.features)
      }

      this.setData(field)
    })
  },

  setForecast (hour) {
    this.forecast = hour
    if (this._map) this.loadData()
  },

  getCurrentDate () {
    return new Date(this.date.getTime() + this.forecast * 3600000)
  }
})
