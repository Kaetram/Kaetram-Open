# Deterministic environment RNG

Kaetram normally uses JavaScript's process-local `Math.random()` through the
shared gameplay utilities. Confirmatory experiments can opt into a seeded,
recorded source by launching the **server** with:

```sh
KAETRAM_ENV_RNG_REQUIRED=1
KAETRAM_ENV_SEED=11001
KAETRAM_ENV_RNG_ATTESTATION_PATH=/absolute/run/path/environment-rng.json
KAETRAM_GAME_REVISION=<exact-git-commit>
```

The server fails before constructing the world when any required value is
missing, the registered revision differs from `git rev-parse HEAD`, a random
draw happened before configuration, or the attestation cannot be written. The
attestation records the SHA-256 digest of the seed rather than the seed itself;
the experiment manifest must retain the original seed and verify the digest.
The generator is `mulberry32-sha256-v1`: SHA-256 of the UTF-8 seed supplies its
initial 32-bit state.

## Audited coverage

All randomness in `packages/server` and `packages/common` that directly calls
`Math.random()` at this revision is routed through the configured source:

- `randomFloat`, `randomInt`, and `randomWeightedInt` in the shared utility;
- helpers built on them, including instance identifiers and position offsets;
- minigame lobby shuffling.

The attestation is a startup configuration record, not proof of bit-for-bit
replay. A source scan in confirmatory CI should reject any new `Math.random()`
call under `packages/server` or `packages/common` outside
`packages/common/util/random.ts`.

## Residual nondeterminism

The seed does **not** control network/input arrival order, event-loop and timer
ordering, database state or unsorted query order, wall-clock-dependent behavior,
clients, model inference, or external services. Confirmatory runs must isolate
and record those factors separately. In particular, sharing an environment seed
does not make two concurrently interactive trajectories identical after their
actions diverge.
