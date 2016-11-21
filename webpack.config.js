var path = require('path')
var webpack = require('webpack')
var config = require('./package.json')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  context: __dirname,
  entry: {
    bundle: './src/index.js',
    // Cant have style or css in the name, ExtractTextPlugin fails otherwise
    vendor: ['geobuf', 'react', 'react-dom', 'superagent']
  },
  output: {
    path: './build',
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map',
  resolve: {
    root: path.resolve('node_modules')
  },
  resolveLoader: {
    root: path.resolve('node_modules')
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/,
      query: {
        presets: config.babel.presets.map(
          (name) => require.resolve('babel-preset-' + name)
        )
      }
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
    }, {
      test: /\.(?:png|jpg)$/,
      loader: 'url-loader'
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
    new ExtractTextPlugin('style.css')
  ]
}
