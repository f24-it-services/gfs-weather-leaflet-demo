"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ColorScale = function () {
  function ColorScale(minValue, fromRange, toRange) {
    var colorOffsets = arguments.length <= 3 || arguments[3] === undefined ? [0, 2, 4] : arguments[3];

    _classCallCheck(this, ColorScale);

    this.minValue = minValue;
    this.fromRange = fromRange;
    this.toRange = toRange;
    this.colorOffsets = colorOffsets;
  }

  _createClass(ColorScale, [{
    key: "__val",
    value: function __val(val) {
      if (val === null || val === undefined) {
        return 0;
      }

      if (val.length === 2) {
        return Math.sqrt(val[0] * val[0] + val[1] * val[1]);
      } else {
        return val[0];
      }
    }
  }, {
    key: "getMagnitude",
    value: function getMagnitude(val) {
      val = this.__val(val);

      var _fromRange = _slicedToArray(this.fromRange, 2);

      var frMin = _fromRange[0];
      var frMax = _fromRange[1];

      var _toRange = _slicedToArray(this.toRange, 2);

      var trMin = _toRange[0];
      var trMax = _toRange[1];


      return this.magnitude(val, frMin, frMax, trMin, trMax);
    }
  }, {
    key: "getColor",
    value: function getColor(val) {
      var ignoreThreshold = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      val = this.__val(val);

      if (val < this.minValue && !ignoreThreshold) {
        return null;
      }

      var _fromRange2 = _slicedToArray(this.fromRange, 2);

      var frMin = _fromRange2[0];
      var frMax = _fromRange2[1];

      var _toRange2 = _slicedToArray(this.toRange, 2);

      var trMin = _toRange2[0];
      var trMax = _toRange2[1];

      var _colorOffsets = _slicedToArray(this.colorOffsets, 3);

      var ro = _colorOffsets[0];
      var go = _colorOffsets[1];
      var bo = _colorOffsets[2];

      var mag = this.scale(val, frMin, frMax, trMin, trMax);

      var r = Math.round(Math.sin(mag + ro) * 127 + 128);
      var g = Math.round(Math.sin(mag + go) * 127 + 128);
      var b = Math.round(Math.sin(mag + bo) * 127 + 128);

      return [r, g, b];
    }
  }, {
    key: "clamp",
    value: function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
  }, {
    key: "magnitude",
    value: function magnitude(v, fmin, fmax, tmin, tmax) {
      return (this.clamp(v, fmin, fmax) - fmin) / (fmax - fmin);
    }
  }, {
    key: "scale",
    value: function scale(v, fmin, fmax, tmin, tmax) {
      return this.magnitude(v, fmin, fmax, tmin, tmax) * (tmax - tmin) + tmin;
    }
  }]);

  return ColorScale;
}();

exports.default = ColorScale;