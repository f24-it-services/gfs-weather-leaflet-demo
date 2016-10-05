export default class ValueField {
  constructor (bounds, dlat, dlng, field) {
    this.bounds = bounds
    this.dlat = dlat
    this.dlng = dlng
    this.field = field
  }

  get (latlng) {
    let [yf, xf] = ValueField.fractionalIndex(this.bounds, latlng, this.dlat, this.dlng)
    let [y, x] = ValueField.index(this.bounds, latlng, this.dlat, this.dlng)
    let yc = y + 1
    let xc = x + 1

    let tr = this.field[y]
    let br = this.field[yc]

    if (!tr || !br) {
      return null
    }

    let g00 = tr[x] && tr[x][1]
    let g10 = tr[xc] && tr[xc][1]
    let g01 = br[x] && br[x][1]
    let g11 = br[xc] && br[xc][1]

    if (!g00 || !g10 || !g01 || !g11) {
      return null
    }

    return this.interpolate(xf - x, yf - y, g00, g10, g01, g11)
  }

  forEachFractional (dlat, dlng, cb) {
    if (!this.field.length) {
      return
    }

    let [slat, slng, elat, elng] = this.bounds

    for (let lat = slat; lat > elat; lat -= dlat) {
      for (let lng = slng; lng < elng; lng += dlng) {
        let latlng = [lat, lng]
        let value = this.get(latlng)
        if (value) cb(latlng, value)
      }
    }
  }

  forEach (cb) {
    const field = this.field
    for (let y = 0, yl = field.length; y < yl; y++) { // eslint-disable-line
      let row = field[y]
      if (!row) continue
      for (let x = 0, xl = row.length; x < xl; x++) {  // eslint-disable-line
        let v = row[x]
        if (v) cb(v[0], v[1])
      }
    }
  }

  subdivide (sy, sx) {
    let dlat = this.dlat / sy
    let dlng = this.dlng / sx
    return new ValueField(
      this.bounds, dlat, dlng,
      this.__subdivide(sy, sx, dlat, dlng)
    )
  }

  __subdivide (sy, sx, dlat, dlng) {
    let field = []

    this.forEachFractional(1 / sy, 1 / sx, (latlng, value) => {
      let [y, x] = ValueField.index(this.bounds, latlng, dlat, dlng)

      if (!field[y]) {
        field[y] = []
      }

      field[y][x] = [latlng, value]
    })

    return field
  }

  interpolate (x, y, g00, g10, g01, g11) {
    return [this.__interpolate(x, y, g00[0], g10[0], g01[0], g11[0])]
  }

  __interpolate (x, y, g00, g10, g01, g11) {
    const rx = (1 - x)
    const ry = (1 - y)

    const a = rx * ry
    const b = x * ry
    const c = rx * y
    const d = x * y

    return g00 * a + g10 * b + g01 * c + g11 * d
  }
}

ValueField.fractionalIndex = function (bounds, latlng, dlat, dlng) {
  return [(bounds[0] - latlng[0]) / dlat, (latlng[1] - bounds[1]) / dlng]
}

ValueField.index = function (bounds, latlng, dlat, dlng) {
  let [y, x] = ValueField.fractionalIndex(bounds, latlng, dlat, dlng)
  return [Math.floor(y), Math.floor(x)]
}

ValueField.fromFeatures = function (bounds, dlat, dlng, features, factoryFn) {
  const field = []

  features.forEach((feature) => {
    let lnglat = feature.geometry.coordinates
    let latlng = [lnglat[1], lnglat[0]]
    let value = feature.properties.value
    let [y, x] = ValueField.index(bounds, latlng, dlat, dlng)

    if (!field[y]) {
      field[y] = []
    }

    field[y][x] = [latlng, value]
  })

  if (factoryFn) {
    return factoryFn(bounds, dlat, dlng, field)
  }

  return new ValueField(bounds, dlat, dlng, field)
}
