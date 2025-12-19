import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-controlled-list.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-controlled-list.js',
	loader: {
		'.js': 'jsx',
	},
	external: [
		'react',
		'ink',
	],
	logLevel: 'info',
});
