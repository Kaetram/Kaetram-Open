import defaultConfig from './default';

import type { Config } from './types';

async function resolveConfig(path: string) {
    let { default: config } = await import(`kaetram/${path}`);

    return { path, config };
}

export let { path, config } = await resolveConfig(
    `config.${process.env.NODE_ENV?.toLowerCase()}`
).catch(() => resolveConfig('config').catch(() => ({ path: undefined, config: undefined })));

export default Object.assign(defaultConfig, config) as Readonly<Config>;
