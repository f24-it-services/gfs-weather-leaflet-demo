'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _Pbf = require('Pbf');

var _Pbf2 = _interopRequireDefault(_Pbf);

var _geobuf = require('geobuf');

var _geobuf2 = _interopRequireDefault(_geobuf);

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _VectorField = require('./VectorField');

var _VectorField2 = _interopRequireDefault(_VectorField);

var _ValueField = require('./ValueField');

var _ValueField2 = _interopRequireDefault(_ValueField);

var _CanvasLayer = require('./CanvasLayer');

var _CanvasLayer2 = _interopRequireDefault(_CanvasLayer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_superagent2.default.parse['application/x-protobuf'] = function (buffer) {
  return new _Pbf2.default(buffer);
};
exports.default = _CanvasLayer2.default.extend({
  initialize: function initialize(type, colorScale) {
    _CanvasLayer2.default.prototype.initialize.call(this);
    this.type = type;
    this.date = new Date(new Date().setUTCHours(0, 0, 0, 0));
    this.forecast = 0;
    this.colorScale = colorScale;
  },
  coordsToPx: function coordsToPx(coords) {
    return this._map.latLngToContainerPoint(coords);
  },
  renderVector: function renderVector(ctx, start, dir, scale) {
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(start.x + dir[0] * scale, start.y + dir[1] * scale);
    ctx.closePath();
    ctx.stroke();
  },
  onDrawLayer: function onDrawLayer(info) {
    var _this = this;

    if (!this.data) {
      return;
    }

    console.time('render()');
    var canvas = info.canvas;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // this.data.forEach((latlng, value) => {
    //   const pos = this.coordsToPx(latlng)
    //   this.renderVector(ctx, pos, value, 5)
    // })

    if (this.colormap) {
      Object.keys(this.colormap).forEach(function (color) {
        var points = _this.colormap[color];
        ctx.fillStyle = color;
        points.forEach(function (point) {
          var pos = _this.coordsToPx(point);
          ctx.beginPath();
          ctx.arc(pos.x + Math.random() * 3, pos.y + Math.random() * 3, 20, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        });
      });
    }

    console.timeEnd('render()');
  },
  setData: function setData(field) {
    this.data = field;
    this.colormap = {};

    var density = 5;
    var size = this._map.getSize();
    var width = size.x;
    var height = size.y;

    for (var y = 0; y < height; y += density) {
      for (var x = 0; x < width; x += density) {
        var latlng = this._map.containerPointToLatLng([x, y]);
        var value = this.data.get([latlng.lat, latlng.lng]);

        var colorValues = this.colorScale.getColor(value);

        if (colorValues !== null) {
          var _colorValues = _slicedToArray(colorValues, 3);

          var r = _colorValues[0];
          var g = _colorValues[1];
          var b = _colorValues[2];

          var color = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.02)';

          if (!this.colormap[color]) {
            this.colormap[color] = [];
          }

          this.colormap[color].push(latlng);
        }
      }
    }

    this.needRedraw();
  },
  onAdd: function onAdd(map) {
    _CanvasLayer2.default.prototype.onAdd.call(this, map);
    map.on('click', this.onClick, this).on('move', this.onMove, this);

    this.loadData();
  },
  onRemove: function onRemove(map) {
    map.off('click', this.onClick);
    _CanvasLayer2.default.prototype.onRemove.call(this, map);
  },
  onClick: function onClick(_ref) {
    var latlng = _ref.latlng;

    var value = this.data.get([latlng.lat, latlng.lng]);
    var ev = {
      variable: this.type,
      latlng: latlng
    };

    ev.date = this.getCurrentDate();

    if (value && value.length === 2) {
      ev.value = Math.sqrt(value[0] * value[0] + value[1] * value[1]);
    } else {
      ev.value = value;
    }

    this.fire('click', ev);
  },
  onMove: function onMove() {
    var _this2 = this;

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(function () {
      return _this2.loadData();
    }, 500);
  },
  getBounds: function getBounds() {
    var size = this._map.getSize();
    var top = this._map.containerPointToLatLng([size.x / 2, 0]);
    var bottom = this._map.containerPointToLatLng([size.x / 2, size.y]);
    var sw = this._map.containerPointToLatLng([0, size.y]);
    var ne = this._map.containerPointToLatLng([size.x, 0]);

    console.log(bottom.lat, sw.lat);
    console.log(top.lat, ne.lat);

    var lngDelta = ne.lng - sw.lng;
    var latDelta = top.lat - bottom.lat;
    if (lngDelta < 3) {
      sw.lng -= (3 - lngDelta) / 2;
      ne.lng += (3 - lngDelta) / 2;
    }
    if (latDelta < 3) {
      top.lat += (3 - latDelta) / 2;
      bottom.lat -= (3 - latDelta) / 2;
    }

    console.log(bottom.lat, sw.lat);
    console.log(top.lat, ne.lat);

    var bounds = _leaflet2.default.latLngBounds([Math.floor(Math.min(bottom.lat, sw.lat)), Math.floor(sw.lng)], [Math.ceil(Math.max(top.lat, ne.lat)), Math.ceil(ne.lng)]);
    // .pad(0.4, 0.4)

    return bounds;
  },
  loadData: function loadData() {
    var _this3 = this;

    var bounds = this.getBounds();
    var time = this.getCurrentDate().getTime();

    _superagent2.default.get('http://localhost:9080/layer/' + this.type + '/' + time).query({ bb: bounds.toBBoxString() }).responseType('arraybuffer').end(function (err, res) {
      console.log(err, res);
      var points = _geobuf2.default.decode(res.body);

      var aBounds = [bounds.getNorth(), bounds.getWest(), bounds.getSouth(), bounds.getEast()];
      var field = void 0;

      if (_this3.type === 'uvgrd') {
        field = _VectorField2.default.fromFeatures(aBounds, 1, 1, points.features);
      } else {
        field = _ValueField2.default.fromFeatures(aBounds, 1, 1, points.features);
      }

      _this3.setData(field);
    });
  },
  setForecast: function setForecast(hour) {
    this.forecast = hour;
    if (this._map) this.loadData();
  },
  getCurrentDate: function getCurrentDate() {
    return new Date(this.date.getTime() + this.forecast * 3600000);
  }
});