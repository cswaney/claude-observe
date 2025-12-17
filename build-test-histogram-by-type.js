import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-histogram-by-type.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-histogram-by-type.js',
	loader: {
		'.js': 'jsx',
	},
	external: [
		'react',
		'ink',
	],
	logLevel: 'info',
});
