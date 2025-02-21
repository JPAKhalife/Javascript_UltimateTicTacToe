const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    app: './src/sketch.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.front.json'  // Use the server-specific tsconfig
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'front.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  externals: {
    express: 'commonjs express',
    p5: 'p5',
  },
  plugins: [
    new webpack.ProvidePlugin({
      require: ['some-library', 'require'], // Adjust if needed
    }),
  ],
};
