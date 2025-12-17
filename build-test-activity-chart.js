import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-activity-chart.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-activity-chart.js',
	loader: {
		'.js': 'jsx',
	},
	external: [
		'react',
		'ink',
	],
	logLevel: 'info',
});
