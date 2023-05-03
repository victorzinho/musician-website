// noinspection NodeCoreCodingAssistance
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const i18n = require('./src/i18n');

module.exports = {
  entry: {
    index: './src/main.js'
  },
  resolve: {
    fallback: {
      fs: false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index_redirect.html',
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'es/index.html',
      templateParameters: { i18n: i18n.es, lang: 'es' }
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'en/index.html',
      templateParameters: { i18n: i18n.en, lang: 'en' }
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      jquery: 'jquery',
      $: 'jquery'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'images', to: 'images' }
      ]
    }),
    new MiniCssExtractPlugin()
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }, {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  }
};
