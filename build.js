import {readFileSync} from 'node:fs';
import * as esbuild from 'esbuild';

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

await esbuild.build({
	entryPoints: ['source/cli.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/cli.js',
	sourcemap: true, // Generate source maps for better debugging
	jsx: 'automatic', // Use modern JSX transform (React 17+)
	loader: {
		'.js': 'jsx', // Enable JSX in .js files
	},
	external: [
		// External dependencies that shouldn't be bundled
		'react',
		'ink',
		'ink-gradient',
		'ink-big-text',
		'@mishieck/ink-titled-box',
	],
	define: {
		// Inject version at build time
		'process.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
	},
	logLevel: 'info',
});
