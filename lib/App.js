'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _Pbf = require('Pbf');

var _Pbf2 = _interopRequireDefault(_Pbf);

var _ColorScale = require('./ColorScale');

var _ColorScale2 = _interopRequireDefault(_ColorScale);

var _GFSLayer = require('./GFSLayer');

var _GFSLayer2 = _interopRequireDefault(_GFSLayer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

_superagent2.default.parse['application/x-protobuf'] = function (buffer) {
  return new _Pbf2.default(buffer);
};

var L = require('leaflet');
L.Control.Slider = require('./slider/leaflet-slider.js');

var App = function (_Component) {
  _inherits(App, _Component);

  function App(props, context) {
    _classCallCheck(this, App);

    var _this = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props, context));

    _this.onClick = _this.onClick.bind(_this);
    _this.state = {
      layers: {
        uvgrd: new _GFSLayer2.default('uvgrd', new _ColorScale2.default(5, [0, 17], [4, 9])),
        tmp: new _GFSLayer2.default('tmp', new _ColorScale2.default(300, [300, 340], [5, 6], [2, 4, 0])),
        prate: new _GFSLayer2.default('prate', new _ColorScale2.default(1e-4, [0, 1e-2], [3, 5], [2, 0, 4]))
      }
    };
    return _this;
  }

  _createClass(App, [{
    key: 'onClick',
    value: function onClick(e) {
      var _this2 = this;

      console.log(e);

      var layers = [];
      var time = void 0;

      Object.keys(this.state.layers).forEach(function (key) {
        if (_this2.map.hasLayer(_this2.state.layers[key])) {
          time = _this2.state.layers[key].getCurrentDate().getTime();
          layers.push(key);
        }
      });

      if (layers.length < 1) return;

      _superagent2.default.get('http://localhost:9080/forecast/' + layers.join(',') + '/' + time).query({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }).end(function (err, res) {
        console.log(err, res.body);
      });
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this3 = this;

      this.map = L.map('map', {
        maxZoom: 14
      });
      this.map.setView([53.74871079689897, -24.257812500000004], 4);
      this.map.on('click', this.onClick);

      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      new L.Control.Slider(function (value) {
        _this3.state.layers.uvgrd.setForecast(value);
        _this3.state.layers.tmp.setForecast(value);
        _this3.state.layers.prate.setForecast(value);
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
      }).addTo(this.map);

      L.control.layers({}, {
        Wind: this.state.layers.uvgrd.addTo(this.map),
        Temperature: this.state.layers.tmp,
        Precipitation: this.state.layers.prate
      }).addTo(this.map);
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement('div', { id: 'map', style: { width: 600, height: 500 } })
      );
    }
  }]);

  return App;
}(_react.Component);

exports.default = App;