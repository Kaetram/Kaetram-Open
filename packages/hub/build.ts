import esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/main.ts'],
    outfile: './dist/main.js',
    minify: true,
    bundle: true,
    sourcemap: true,
    format: 'esm',
    platform: 'node',
    external: ['uws', 'discord.js'],
    banner: {
        js: `
            import { createRequire as topLevelCreateRequire } from 'module';
            const require = topLevelCreateRequire(import.meta.url);
        `
    }
});
