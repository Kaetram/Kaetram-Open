import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { configureEnvironmentRng, EnvironmentRngAttestationSchema } from '../src/environmentrng';

import { getRandomAttestation, random } from '@kaetram/common/util/random';

function typescriptFiles(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        let entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) return typescriptFiles(entryPath);

        return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
    });
}

test('strict environment RNG configuration is deterministic and fail closed', () => {
    let temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kaetram-rng-test-')),
        destination = path.join(temporaryDirectory, 'environment-rng.json'),
        seed = '11001',
        revision = execFileSync('git', ['rev-parse', 'HEAD'], {
            encoding: 'utf8'
        }).trim();

    try {
        assert.throws(
            () => configureEnvironmentRng({ KAETRAM_ENV_RNG_REQUIRED: '1' }),
            /KAETRAM_ENV_SEED is required/
        );
        assert.throws(
            () =>
                configureEnvironmentRng({
                    KAETRAM_ENV_RNG_REQUIRED: '1',
                    KAETRAM_ENV_SEED: seed
                }),
            /KAETRAM_ENV_RNG_ATTESTATION_PATH is required/
        );
        assert.throws(
            () =>
                configureEnvironmentRng({
                    KAETRAM_ENV_RNG_REQUIRED: '1',
                    KAETRAM_ENV_SEED: seed,
                    KAETRAM_ENV_RNG_ATTESTATION_PATH: destination
                }),
            /KAETRAM_GAME_REVISION is required/
        );
        assert.throws(
            () =>
                configureEnvironmentRng({
                    KAETRAM_ENV_RNG_REQUIRED: '1',
                    KAETRAM_ENV_SEED: seed,
                    KAETRAM_ENV_RNG_ATTESTATION_PATH: destination,
                    KAETRAM_GAME_REVISION: 'develop'
                }),
            /exact 40- or 64-character commit hash/
        );
        assert.throws(
            () =>
                configureEnvironmentRng({
                    KAETRAM_ENV_RNG_REQUIRED: '1',
                    KAETRAM_ENV_SEED: seed,
                    KAETRAM_ENV_RNG_ATTESTATION_PATH: destination,
                    KAETRAM_GAME_REVISION: '0'.repeat(40)
                }),
            /Game revision mismatch/
        );

        let attestation = configureEnvironmentRng({
                KAETRAM_ENV_RNG_REQUIRED: '1',
                KAETRAM_ENV_SEED: seed,
                KAETRAM_ENV_RNG_ATTESTATION_PATH: destination,
                KAETRAM_GAME_REVISION: revision
            })!,
            recorded = JSON.parse(fs.readFileSync(destination, 'utf8'));

        assert.equal(attestation.schema, EnvironmentRngAttestationSchema);
        assert.equal(
            attestation.seedSha256,
            crypto.createHash('sha256').update(seed, 'utf8').digest('hex')
        );
        assert.equal(attestation.gameRevision, revision);
        assert.equal(attestation.drawsAtAttestation, 0);
        assert.deepEqual(recorded, attestation);

        assert.deepEqual(
            [random(), random(), random()].map((value) => value.toFixed(15)),
            ['0.149395088665187', '0.776384564349428', '0.510862109251320']
        );
        assert.equal(getRandomAttestation().draws, 3);

        let sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
            directCalls = [
                ...typescriptFiles(path.join(sourceRoot, 'common')),
                ...typescriptFiles(path.join(sourceRoot, 'server/src'))
            ].filter((file) => /Math\.random\s*\(/.test(fs.readFileSync(file, 'utf8')));

        assert.deepEqual(directCalls, [], 'server/common code must route random calls centrally');

        assert.throws(
            () =>
                configureEnvironmentRng({
                    KAETRAM_ENV_SEED: seed,
                    KAETRAM_GAME_REVISION: revision
                }),
            /already configured/
        );
    } finally {
        fs.rmSync(temporaryDirectory, { force: true, recursive: true });
    }
});
