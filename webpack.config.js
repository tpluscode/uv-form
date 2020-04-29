const path = require('path')
const merge = require('webpack-merge')
const { createDefaultConfig } = require('@open-wc/building-webpack')

// if you need to support IE11 use "modern-and-legacy-config" instead.
// const { createCompatibilityConfig } = require('@open-wc/building-webpack');
// module.exports = createCompatibilityConfig({
//   input: path.resolve(__dirname, './index.html'),
// });

module.exports = merge(
  createDefaultConfig({
    input: path.resolve(__dirname, './web/index.html'),
  }),
  {
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.nq$/,
          use: ['raw-loader']
        }
      ]
    },
    node: {
      crypto: true,
    },
  },
)
