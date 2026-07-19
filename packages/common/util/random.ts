import crypto from 'node:crypto';

export const DeterministicRandomAlgorithm = 'mulberry32-sha256-v1' as const;

export interface RandomAttestation {
    schemaVersion: 1;
    mode: 'deterministic' | 'system';
    algorithm: typeof DeterministicRandomAlgorithm | 'math-random';
    seedSha256?: string;
    draws: number;
}

type RandomSource = () => number;

let source: RandomSource = Math.random,
    mode: RandomAttestation['mode'] = 'system',
    seedSha256: string | undefined,
    draws = 0;

/**
 * Configure the process-wide source used by Kaetram's shared gameplay random
 * helpers. Configuration is intentionally one-shot and must happen before the
 * first draw so a run cannot silently mix system and seeded randomness.
 */
export function configureDeterministicRandom(seed: string): RandomAttestation {
    if (seed.length === 0) throw new Error('Environment RNG seed must not be empty.');
    if (mode === 'deterministic') throw new Error('Environment RNG is already configured.');
    if (draws > 0)
        throw new Error(
            `Cannot configure deterministic environment RNG after ${draws} system random draw(s).`
        );

    let digest = crypto.createHash('sha256').update(seed, 'utf8').digest(),
        state = digest.readUInt32LE(0);

    source = () => {
        state = (state + 0x6d_2b_79_f5) >>> 0;

        let value = state;

        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

        return ((value ^ (value >>> 14)) >>> 0) / 2 ** 32;
    };

    mode = 'deterministic';
    seedSha256 = digest.toString('hex');

    return getRandomAttestation();
}

/** The only random draw primitive used by common server gameplay helpers. */
export function random(): number {
    draws++;

    return source();
}

export function getRandomAttestation(): RandomAttestation {
    return {
        schemaVersion: 1,
        mode,
        algorithm: mode === 'deterministic' ? DeterministicRandomAlgorithm : 'math-random',
        ...(seedSha256 ? { seedSha256 } : {}),
        draws
    };
}
