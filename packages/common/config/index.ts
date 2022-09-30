import log from '../util/log';

import resolvedConfig, { configFiles } from './resolved';

let formatter = new Intl.ListFormat(),
    files = formatter.format(configFiles.map(({ file }) => `\`${file}\``));

if (files) log.debug(`Loading options from ${files}.`);

let { NODE_ENV } = process.env;

if (NODE_ENV === 'e2e' && !resolvedConfig.mongodbDatabase.includes('e2e')) {
    log.critical(
        `Something is wrong with your configuration, your NODE_ENV is set to 'e2e' and your database name does not include 'e2e'. This might cause you to mess up [${resolvedConfig.mongodbDatabase}] via the e2e tests. Stopping the server.`
    );

    throw new Error(
        `NODE_ENV and database name mismatch [NODE_ENV=${NODE_ENV}, mongodbDatabase=${resolvedConfig.mongodbDatabase}].`
    );
}

export type { Config } from './define';

export { default } from './resolved';
