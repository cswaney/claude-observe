import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-live-chart.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-live-chart.js',
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
