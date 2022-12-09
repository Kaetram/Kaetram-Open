import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import { camelCase } from 'lodash-es';

import type { DatabaseTypes } from './types/database';

export interface Config {
    name: string;
    host: string;
    ssl: boolean;

    socketioPort: number;
    websocketPort: number;

    serverId: number;
    accessToken: string;
    apiEnabled: boolean;
    apiPort: number;

    hubEnabled: boolean;
    hubHost: string;
    hubPort: number;
    hubPing: number;
    hubAccessToken: string;
    remoteServerHost: string;

    clientRemoteHost: string;
    clientRemotePort: number;

    cleanupThreshold: number;
    cleanupTime: number;

    database: DatabaseTypes;
    skipDatabase: boolean;

    mongodbHost: string;
    mongodbPort: number;
    mongodbUser: string;
    mongodbPassword: string;
    mongodbDatabase: string;
    mongodbSrv: boolean;
    mongodbTls: boolean;

    worldSwitch: boolean;
    tutorialEnabled: boolean;
    overrideAuth: boolean;
    maxPlayers: number;
    updateTime: number;
    gver: string;
    regionCache: boolean;

    discordEnabled: boolean;
    discordChannelId: string;
    discordBotToken: string;

    debugging: boolean;
    debugLevel: 'all';
    fsDebugging: boolean;
}

console.debug(`Loading env values from [.env] with fallback to [.env.defaults]`);

let { NODE_ENV } = process.env,
    env = dotenv.load({ path: `../../.env`, defaults: '../../.env.defaults' });

if (NODE_ENV) {
    console.debug(`Loading additional env values from [.env.${NODE_ENV}]`);

    Object.assign(env, dotenv.load({ path: `../../.env.${NODE_ENV}` }));
}

let envConfig = dotenvParseVariables(env),
    config = {} as Config;

for (let key of Object.keys(envConfig)) {
    let camelCaseKey = camelCase(key) as keyof Config;

    config[camelCaseKey] = envConfig[key] as never;
}

config.hubHost = config.hubHost || config.host;

if (NODE_ENV === 'e2e' && !config.mongodbDatabase.includes('e2e')) {
    console.error(
        `Something is wrong with your configuration, your NODE_ENV is set to 'e2e' and your database name does not include 'e2e'.
        This might cause you to mess up [${config.mongodbDatabase}] via the e2e tests. Stopping the server.`
    );

    throw new Error(
        `NODE_ENV and database name mismatch [NODE_ENV=${NODE_ENV},mongodbDatabase=${config.mongodbDatabase}]`
    );
}

export default config;
