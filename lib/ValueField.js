"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ValueField = function () {
  function ValueField(bounds, dlat, dlng, field) {
    _classCallCheck(this, ValueField);

    this.bounds = bounds;
    this.dlat = dlat;
    this.dlng = dlng;
    this.field = field;
  }

  _createClass(ValueField, [{
    key: "get",
    value: function get(latlng) {
      var _ValueField$fractiona = ValueField.fractionalIndex(this.bounds, latlng, this.dlat, this.dlng);

      var _ValueField$fractiona2 = _slicedToArray(_ValueField$fractiona, 2);

      var yf = _ValueField$fractiona2[0];
      var xf = _ValueField$fractiona2[1];

      var _ValueField$index = ValueField.index(this.bounds, latlng, this.dlat, this.dlng);

      var _ValueField$index2 = _slicedToArray(_ValueField$index, 2);

      var y = _ValueField$index2[0];
      var x = _ValueField$index2[1];

      var yc = y + 1;
      var xc = x + 1;

      var tr = this.field[y];
      var br = this.field[yc];

      if (!tr || !br) {
        return null;
      }

      var g00 = tr[x] && tr[x][1];
      var g10 = tr[xc] && tr[xc][1];
      var g01 = br[x] && br[x][1];
      var g11 = br[xc] && br[xc][1];

      if (!g00 || !g10 || !g01 || !g11) {
        return null;
      }

      return this.interpolate(xf - x, yf - y, g00, g10, g01, g11);
    }
  }, {
    key: "forEachFractional",
    value: function forEachFractional(dlat, dlng, cb) {
      if (!this.field.length) {
        return;
      }

      var _bounds = _slicedToArray(this.bounds, 4);

      var slat = _bounds[0];
      var slng = _bounds[1];
      var elat = _bounds[2];
      var elng = _bounds[3];


      for (var lat = slat; lat > elat; lat -= dlat) {
        for (var lng = slng; lng < elng; lng += dlng) {
          var latlng = [lat, lng];
          var value = this.get(latlng);
          if (value) cb(latlng, value);
        }
      }
    }
  }, {
    key: "forEach",
    value: function forEach(cb) {
      var field = this.field;
      for (var y = 0, yl = field.length; y < yl; y++) {
        // eslint-disable-line
        var row = field[y];
        if (!row) continue;
        for (var x = 0, xl = row.length; x < xl; x++) {
          // eslint-disable-line
          var v = row[x];
          if (v) cb(v[0], v[1]);
        }
      }
    }
  }, {
    key: "subdivide",
    value: function subdivide(sy, sx) {
      var dlat = this.dlat / sy;
      var dlng = this.dlng / sx;
      return new ValueField(this.bounds, dlat, dlng, this.__subdivide(sy, sx, dlat, dlng));
    }
  }, {
    key: "__subdivide",
    value: function __subdivide(sy, sx, dlat, dlng) {
      var _this = this;

      var field = [];

      this.forEachFractional(1 / sy, 1 / sx, function (latlng, value) {
        var _ValueField$index3 = ValueField.index(_this.bounds, latlng, dlat, dlng);

        var _ValueField$index4 = _slicedToArray(_ValueField$index3, 2);

        var y = _ValueField$index4[0];
        var x = _ValueField$index4[1];


        if (!field[y]) {
          field[y] = [];
        }

        field[y][x] = [latlng, value];
      });

      return field;
    }
  }, {
    key: "interpolate",
    value: function interpolate(x, y, g00, g10, g01, g11) {
      return [this.__interpolate(x, y, g00[0], g10[0], g01[0], g11[0])];
    }
  }, {
    key: "__interpolate",
    value: function __interpolate(x, y, g00, g10, g01, g11) {
      var rx = 1 - x;
      var ry = 1 - y;

      var a = rx * ry;
      var b = x * ry;
      var c = rx * y;
      var d = x * y;

      return g00 * a + g10 * b + g01 * c + g11 * d;
    }
  }]);

  return ValueField;
}();

exports.default = ValueField;


ValueField.fractionalIndex = function (bounds, latlng, dlat, dlng) {
  return [(bounds[0] - latlng[0]) / dlat, (latlng[1] - bounds[1]) / dlng];
};

ValueField.index = function (bounds, latlng, dlat, dlng) {
  var _ValueField$fractiona3 = ValueField.fractionalIndex(bounds, latlng, dlat, dlng);

  var _ValueField$fractiona4 = _slicedToArray(_ValueField$fractiona3, 2);

  var y = _ValueField$fractiona4[0];
  var x = _ValueField$fractiona4[1];

  return [Math.floor(y), Math.floor(x)];
};

ValueField.fromFeatures = function (bounds, dlat, dlng, features, factoryFn) {
  var field = [];

  features.forEach(function (feature) {
    var lnglat = feature.geometry.coordinates;
    var latlng = [lnglat[1], lnglat[0]];
    var value = feature.properties.value;

    var _ValueField$index5 = ValueField.index(bounds, latlng, dlat, dlng);

    var _ValueField$index6 = _slicedToArray(_ValueField$index5, 2);

    var y = _ValueField$index6[0];
    var x = _ValueField$index6[1];


    if (!field[y]) {
      field[y] = [];
    }

    field[y][x] = [latlng, value];
  });

  if (factoryFn) {
    return factoryFn(bounds, dlat, dlng, field);
  }

  return new ValueField(bounds, dlat, dlng, field);
};