export default class ColorScale {
  constructor (minValue, fromRange, toRange, colorOffsets = [0, 2, 4]) {
    this.minValue = minValue
    this.fromRange = fromRange
    this.toRange = toRange
    this.colorOffsets = colorOffsets
  }

  __val (val) {
    if (val === null || val === undefined) {
      return 0
    }

    if (val.length === 2) {
      return Math.sqrt(val[0] * val[0] + val[1] * val[1])
    } else {
      return val[0]
    }
  }

  getMagnitude (val) {
    val = this.__val(val)

    let [frMin, frMax] = this.fromRange
    let [trMin, trMax] = this.toRange

    return this.magnitude(val, frMin, frMax, trMin, trMax)
  }

  getColor (val, ignoreThreshold = false) {
    val = this.__val(val)

    if (val < this.minValue && !ignoreThreshold) {
      return null
    }

    let [frMin, frMax] = this.fromRange
    let [trMin, trMax] = this.toRange
    let [ro, go, bo] = this.colorOffsets
    let mag = this.scale(val, frMin, frMax, trMin, trMax)

    let r = Math.round(Math.sin(mag + ro) * 127 + 128)
    let g = Math.round(Math.sin(mag + go) * 127 + 128)
    let b = Math.round(Math.sin(mag + bo) * 127 + 128)

    return [r, g, b]
  }

  clamp (v, min, max) {
    return Math.max(min, Math.min(max, v))
  }

  magnitude (v, fmin, fmax, tmin, tmax) {
    return (this.clamp(v, fmin, fmax) - fmin) / (fmax - fmin)
  }

  scale (v, fmin, fmax, tmin, tmax) {
    return this.magnitude(v, fmin, fmax, tmin, tmax) * (tmax - tmin) + tmin
  }

}
