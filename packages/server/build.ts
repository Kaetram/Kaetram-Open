import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

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

let entrypoint = './dist/main.js',
    buildAttestation = {
        schema: 'kaetram-server-build-attestation/v1',
        gameRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        sourceTreeGitOid: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
            encoding: 'utf8'
        }).trim(),
        entrypoint: 'packages/server/dist/main.js',
        entrypointSha256: crypto
            .createHash('sha256')
            .update(fs.readFileSync(entrypoint))
            .digest('hex')
    };

fs.writeFileSync(
    './dist/kaetram-build-attestation.json',
    `${JSON.stringify(buildAttestation, null, 2)}\n`,
    'utf8'
);
