import defaultConfig from './default';

export let configFiles: { file: string; config: string }[] = [];

async function resolveConfig(path: string) {
    try {
        let { default: config } = await import(`kaetram/${path}`);

        configFiles.push({ file: path, config });
    } catch {
        //
    }
}

await resolveConfig(`config.${process.env.NODE_ENV}`);
await resolveConfig('config');

export default configFiles.reduce(
    (previous, current) => Object.assign(previous, current.config),
    defaultConfig
);
