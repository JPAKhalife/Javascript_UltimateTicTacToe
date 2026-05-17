// filepath: /Users/johnkhalife/Code/Javascript_UltimateTicTacToe/webpack-front.config.js
const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";
  const logLevel = env?.LOG_LEVEL || process.env.LOG_LEVEL || 'INFO'

  return {
    entry: "./src/FrontEnd/sketch.ts",
    output: {
      filename: "front.bundle.js",
      path: path.resolve(__dirname, "dist/FrontEnd"),
    },
    mode: argv.mode,
    devServer: isDevelopment
      ? {
          static: {
            directory: path.join(__dirname, "src/FrontEnd"),
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
          use: {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.front.json", // Use the frontend-specific tsconfig
              compilerOptions: {
                rootDir: path.resolve(__dirname, "src"),
              },
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin({}),
      new webpack.DefinePlugin({
        "process.env.REMOTE_SERVER_ADDRESS": JSON.stringify(
          process.env.REMOTE_SERVER_ADDRESS || ""
        ),
        "process.env.LOG_LEVEL": JSON.stringify(logLevel),
      }),
    ],
  };
};
