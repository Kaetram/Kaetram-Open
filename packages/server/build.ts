import { build } from 'esbuild';

import { nodeExternalsPlugin } from 'esbuild-node-externals';

build({
    entryPoints: ['src/main.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node17',
    format: 'esm',
    sourcemap: true,
    plugins: [
        nodeExternalsPlugin({
            allowList: ['@kaetram/common']
        })
    ]
});
