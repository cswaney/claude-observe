import * as esbuild from 'esbuild';
import path from 'path';

// Get the entry point from command line arguments
const entryPoint = process.argv[2];

if (!entryPoint) {
	console.error('Usage: node build-test-generic.js <entry-point.js>');
	process.exit(1);
}

// Extract filename without extension
const basename = path.basename(entryPoint, '.js');
const outfile = `dist/${basename}.js`;

await esbuild.build({
	entryPoints: [entryPoint],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile,
	loader: {
		'.js': 'jsx',
	},
	external: [
		'react',
		'ink',
		'@mishieck/ink-titled-box',
	],
	logLevel: 'info',
});

console.log(`\n✓ Built ${outfile}`);
