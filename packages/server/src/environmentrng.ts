import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
    configureDeterministicRandom,
    DeterministicRandomAlgorithm
} from '@kaetram/common/util/random';

export const EnvironmentRngAttestationSchema = 'kaetram-environment-rng-attestation/v2' as const;

export interface EnvironmentRngAttestation {
    schema: typeof EnvironmentRngAttestationSchema;
    algorithm: typeof DeterministicRandomAlgorithm;
    seedSha256: string;
    gameRevision: string;
    serverBundleSha256: string;
    drawsAtAttestation: 0;
    coverage: string[];
    residualNondeterminism: string[];
}

function enabled(value: string | undefined): boolean {
    return ['1', 'true', 'yes'].includes(value?.toLowerCase() ?? '');
}

function writeAttestation(destination: string, attestation: EnvironmentRngAttestation): void {
    if (!path.isAbsolute(destination))
        throw new Error('KAETRAM_ENV_RNG_ATTESTATION_PATH must be an absolute path.');

    let directory = path.dirname(destination),
        temporary = `${destination}.${process.pid}.tmp`;

    if (!fs.statSync(directory).isDirectory())
        throw new Error(`Environment RNG attestation directory is not a directory: ${directory}`);

    try {
        let temporaryFd = fs.openSync(temporary, 'wx');

        try {
            fs.writeFileSync(temporaryFd, `${JSON.stringify(attestation, null, 2)}\n`, 'utf8');
            fs.fsyncSync(temporaryFd);
        } finally {
            fs.closeSync(temporaryFd);
        }

        // linkSync is an atomic no-clobber publication on the same filesystem.
        // A stale or duplicate attestation is therefore a hard startup failure.
        fs.linkSync(temporary, destination);
        let directoryFd = fs.openSync(directory, 'r');

        try {
            fs.fsyncSync(directoryFd);
        } finally {
            fs.closeSync(directoryFd);
        }
    } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
}

function detectExecutedBundleSha256(): string {
    let entrypoint = process.argv[1];

    if (!entrypoint) throw new Error('Cannot resolve the executed game-server bundle path.');

    try {
        return crypto
            .createHash('sha256')
            .update(fs.readFileSync(fs.realpathSync(entrypoint)))
            .digest('hex');
    } catch (error) {
        throw new Error(`Cannot hash the executed game-server bundle: ${error}`);
    }
}

function detectGameRevision(): string {
    try {
        return execFileSync('git', ['rev-parse', 'HEAD'], {
            cwd: process.cwd(),
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe']
        }).trim();
    } catch (error) {
        throw new Error(`Cannot resolve the game server Git revision: ${error}`);
    }
}

/**
 * Configure and attest server gameplay RNG before World/Loader construction.
 * Confirmatory runs set KAETRAM_ENV_RNG_REQUIRED=1 so missing provenance is a
 * startup error rather than an accidental fallback to the system random source.
 */
export function configureEnvironmentRng(
    environment: NodeJS.ProcessEnv = process.env
): EnvironmentRngAttestation | undefined {
    let required = enabled(environment.KAETRAM_ENV_RNG_REQUIRED),
        seed = environment.KAETRAM_ENV_SEED,
        destination = environment.KAETRAM_ENV_RNG_ATTESTATION_PATH,
        gameRevision = environment.KAETRAM_GAME_REVISION,
        expectedBundleSha256 = environment.KAETRAM_GAME_BUNDLE_SHA256;

    if (!seed) {
        if (required) throw new Error('KAETRAM_ENV_SEED is required for this run.');

        return;
    }

    if (!destination && required)
        throw new Error('KAETRAM_ENV_RNG_ATTESTATION_PATH is required for this run.');
    if (!gameRevision && required)
        throw new Error('KAETRAM_GAME_REVISION is required for this run.');
    if (required && !/^(?:[\dA-Fa-f]{40}|[\dA-Fa-f]{64})$/.test(gameRevision!))
        throw new Error('KAETRAM_GAME_REVISION must be an exact 40- or 64-character commit hash.');
    if (!expectedBundleSha256 && required)
        throw new Error('KAETRAM_GAME_BUNDLE_SHA256 is required for this run.');
    if (expectedBundleSha256 && !/^[\dA-Fa-f]{64}$/.test(expectedBundleSha256))
        throw new Error('KAETRAM_GAME_BUNDLE_SHA256 must be an exact 64-character SHA-256.');

    let detectedRevision = required ? detectGameRevision() : gameRevision,
        detectedBundleSha256 = detectExecutedBundleSha256();

    if (required && detectedRevision !== gameRevision)
        throw new Error(
            `Game revision mismatch: expected ${gameRevision}, detected ${detectedRevision}.`
        );
    if (expectedBundleSha256 && detectedBundleSha256 !== expectedBundleSha256)
        throw new Error(
            `Game bundle mismatch: expected ${expectedBundleSha256}, detected ${detectedBundleSha256}.`
        );

    let randomAttestation = configureDeterministicRandom(seed),
        attestation: EnvironmentRngAttestation = {
            schema: EnvironmentRngAttestationSchema,
            algorithm: DeterministicRandomAlgorithm,
            seedSha256: randomAttestation.seedSha256!,
            gameRevision: detectedRevision ?? 'unrecorded',
            serverBundleSha256: detectedBundleSha256,
            drawsAtAttestation: 0,
            coverage: [
                '@kaetram/common/util/utils randomFloat',
                '@kaetram/common/util/utils randomInt',
                '@kaetram/common/util/utils randomWeightedInt',
                '@kaetram/server minigame lobby shuffle'
            ],
            residualNondeterminism: [
                'network and player input arrival order',
                'event-loop timer and asynchronous callback ordering',
                'database contents and query ordering without an explicit sort',
                'wall-clock-dependent game behavior',
                'randomness in clients or external services'
            ]
        };

    if (destination) writeAttestation(destination, attestation);

    console.info(`KAETRAM_ENV_RNG_ATTESTATION ${JSON.stringify(attestation)}`);

    return attestation;
}
