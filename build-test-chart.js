import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-chart.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-chart.js',
	loader: {
		'.js': 'jsx',  // Enable JSX in .js files
	},
	external: [
		'react',
		'ink',
	],
	logLevel: 'info',
});
