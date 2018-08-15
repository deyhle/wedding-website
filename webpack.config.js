const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const WebpackChunkHash = require('webpack-chunk-hash');
const ManifestPlugin = require('webpack-manifest-plugin');
const { LoaderOptionsPlugin, DefinePlugin } = require('webpack');

module.exports = {
  entry: './src/script.js',

  output: {
    path: path.resolve('static'),
    filename: 'main.js?hash=[chunkhash]',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      { 
        test: /\.svg$/, 
        loader: 'file-loader',
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader'],
        }),
      },
    ],
  },

  plugins: [
    new DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new ExtractTextPlugin('main.css?hash=[contenthash]'), // generate main css file
    new LoaderOptionsPlugin({
      minimize: true, // minimize css
    }),
    new MinifyPlugin(), // minify js
    new WebpackChunkHash(), // calculates hashes for all generated files
    new ManifestPlugin(), // outputs hashes to manifest.json for getMinifiedFile nunjucks filter
  ],

  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },
};
