import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['test-scrollable-list.js'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node16',
	outfile: 'dist/test-scrollable-list.js',
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
