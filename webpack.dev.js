const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
// noinspection JSUnresolvedVariable
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist'
  },
  plugins: [new BundleAnalyzerPlugin()]
});
