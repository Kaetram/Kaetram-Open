import defaultConfig from './default';

export type Config = typeof defaultConfig;

export function defineConfig(config: Partial<Config>) {
    return config;
}
