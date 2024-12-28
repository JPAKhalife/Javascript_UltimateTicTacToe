const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node', // Indicate this is for Node.js
  entry: {
    app: ['./src/server.ts'], // Your Node.js entry point
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.back.json'  // Use the server-specific tsconfig
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
    filename: 'back.bundle.js',
    path: path.resolve(__dirname, 'dist'), // Output path for Node.js
    libraryTarget: 'commonjs2', // CommonJS for Node.js
  },
  externals: [nodeExternals()], // Prevent bundling of node_modules for server-side code
};

