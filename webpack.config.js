var webpack = require('webpack')
var config = require('./package.json')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  entry: {
    bundle: './src/index.js',
    // Cant have style or css in the name, ExtractTextPlugin fails otherwise
    asdf: './src/style.css',
    vendor: ['geobuf', 'react', 'react-dom', 'superagent']
  },
  output: {
    path: './build',
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: config.babel.presets
      }
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
    }, {
      test: /\.(?:png|jpg)$/,
      loader: 'url-loader'
    }]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
    new ExtractTextPlugin('style.css')
  ]
}
