const path = require('path')

module.exports = {
  mode: 'production', // or 'development'
  entry: './src/extension.ts', // Adjust this path if your entry file is different
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, 'out'), // Output directory
    libraryTarget: 'commonjs2', // Required for VSCode extensions
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'], // Resolve these file extensions
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader', // Use ts-loader for TypeScript files
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode', // Exclude vscode module from the bundle
  },
}
