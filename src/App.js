import React, {Component, PropTypes} from 'react'
import request from 'superagent'
import Pbf from 'pbf'
import {ColorScale, GFSLayer} from 'gfs-weather-leaflet'

let L = require('leaflet')
L.Control.Slider = require('./slider/leaflet-slider.js')

request.parse['application/x-protobuf'] = (buffer) => new Pbf(buffer)

export default class App extends Component {
  static propTypes = {
    config: PropTypes.shape({
      serverURI: PropTypes.string.isRequired,
      layers: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        surface: PropTypes.string.isRequired
      })).isRequired
    }).isRequired
  }

  onClick (e) {
    if (!this.map) {
      return
    }

    let layers = []
    let time

    this.map.eachLayer((layer) => {
      if (layer instanceof GFSLayer) {
        time = layer.getCurrentDate().getTime()
        layers.push(`${layer.options.type}@${layer.options.surface}`)
      }
    })

    if (layers.length < 1) {
      return
    }

    request
    .get(`${this.props.config.serverURI}/forecast`)
    .query({
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      from: time,
      layers: layers
    })
    .end((err, res) => {
      console.log(err, res.body)
    })
  }

  componentDidMount () {
    this.map = L.map('map', {
      maxZoom: 14
    })
    this.map.setView([62, 179], 5)
    this.map.on('click', this.onClick.bind(this))

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    })
    .addTo(this.map)

    let today = new Date(new Date().setUTCHours(0, 0, 0, 0))
    let layers = {}
    this.props.config.layers.forEach((layer) => {
      layers[layer.label] = new GFSLayer({
        type: layer.type,
        surface: layer.surface,
        colorScale: ColorScale[layer.type],
        baseUrl: this.props.config.serverURI,
        date: today,
        forecast: 0
      })

      if (layer.visible) {
        layers[layer.label].addTo(this.map)
      }
    })

    L.control.layers({}, layers).addTo(this.map)

    new L.Control.Slider((value) => {
      this.map.eachLayer((layer) => {
        if (layer instanceof GFSLayer) {
          layer.setForecast(value)
        }
      })
    }, {
      width: '200px',
      position: 'bottomleft',
      collapsed: false,
      orientation: 'horizontal',
      increment: true,
      min: 0,
      max: 72,
      value: 0,
      step: 3
    }).addTo(this.map)
  }

  render () {
    return <div id='map' />
  }
}
