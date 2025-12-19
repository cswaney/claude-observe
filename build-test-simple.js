import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-scrollable-simple.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-scrollable-simple.js',
	loader: {
		'.js': 'jsx',
	},
	external: [
		'react',
		'ink',
	],
	logLevel: 'info',
});
