const esbuild = require('esbuild')
const path = require('path')

esbuild
  .build({
    entryPoints: [path.join(__dirname, 'src', 'extension.ts')], // Adjust the entry point as needed
    bundle: true,
    outfile: path.join(__dirname, 'out', 'extension.js'), // Output file
    platform: 'node', // Target platform
    target: 'node14', // Adjust the target Node.js version as needed
    minify: true,
    sourcemap: true, // Generate source maps for debugging
    external: ['vscode'], // Exclude vscode module from the bundle
  })
  .catch(() => process.exit(1))
