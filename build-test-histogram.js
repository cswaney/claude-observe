import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-histogram.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-histogram.js',
	loader: {
		'.js': 'jsx',  // Enable JSX in .js files
	},
	external: [
		'react',
		'ink',
	],
	logLevel: 'info',
});
