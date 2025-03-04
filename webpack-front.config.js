// filepath: /Users/johnkhalife/Code/Javascript_UltimateTicTacToe/webpack-front.config.js
const path = require('path');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/sketch.ts',
    output: {
      filename: 'front.bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    mode: argv.mode,
    devServer: isDevelopment
      ? {
          static: {
            directory: path.join(__dirname, 'src'),
          },
          compress: true,
          port: 9000,
          hot: true,
          liveReload: true,
        }
      : undefined,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
  };
};