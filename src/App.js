import React, {Component} from 'react'

import request from 'superagent'
import Pbf from 'Pbf'
request.parse['application/x-protobuf'] = (buffer) => new Pbf(buffer)

import ColorScale from './ColorScale'
import GFSLayer from './GFSLayer'

let L = require('leaflet')
L.Control.Slider = require('./slider/leaflet-slider.js')

export default class App extends Component {
  constructor (props, context) {
    super(props, context)

    this.onClick = this.onClick.bind(this)
    this.state = {
      layers: {
        uvgrd: new GFSLayer('uvgrd', new ColorScale(5, [0, 17], [4, 9])),
        tmp: new GFSLayer('tmp', new ColorScale(300, [300, 340], [5, 6], [2, 4, 0])),
        prate: new GFSLayer('prate', new ColorScale(1e-4, [0, 1e-2], [3, 5], [2, 0, 4]))
      }
    }
  }

  onClick (e) {
    console.log(e)

    let layers = []
    let time

    Object.keys(this.state.layers).forEach((key) => {
      if (this.map.hasLayer(this.state.layers[key])) {
        time = this.state.layers[key].getCurrentDate().getTime()
        layers.push(key)
      }
    })

    if (layers.length < 1) return

    request
    .get(`http://localhost:9080/forecast/${layers.join(',')}/${time}`)
    .query({
      lat: e.latlng.lat,
      lng: e.latlng.lng
    })
    .end((err, res) => {
      console.log(err, res.body)
    })
  }

  componentDidMount () {
    this.map = L.map('map', {
      maxZoom: 14
    })
    this.map.setView([53.74871079689897, -24.257812500000004], 4)
    this.map.on('click', this.onClick)

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    })
    .addTo(this.map)

    new L.Control.Slider((value) => {
      this.state.layers.uvgrd.setForecast(value)
      this.state.layers.tmp.setForecast(value)
      this.state.layers.prate.setForecast(value)
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

    L.control.layers({}, {
      Wind: this.state.layers.uvgrd.addTo(this.map),
      Temperature: this.state.layers.tmp,
      Precipitation: this.state.layers.prate
    })
    .addTo(this.map)
  }

  render () {
    return (
      <div>
        <div id='map' style={{width: 600, height: 500}} />
        {}
      </div>
    )
  }
}
