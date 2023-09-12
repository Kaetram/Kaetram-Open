import fs from 'node:fs/promises';

import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

import type { DatabaseTypes } from './types/database';

export interface Config {
    name: string;
    host: string;
    port: number;
    ssl: boolean;

    serverId: number;
    accessToken: string;
    apiEnabled: boolean;
    apiPort: number;

    hubEnabled: boolean;
    hubHost: string;
    hubWsHost: string;
    hubPort: number; // API port for hub
    hubWsPort: number; // Websocket port for hub
    hubAccessToken: string;
    adminHost: string;
    adminPort: number;
    remoteServerHost: string;
    remoteApiHost: string;

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
    mongodbAuthSource: string;
    aggregateThreshold: number;

    tutorialEnabled: boolean;
    overrideAuth: boolean;
    disableRegister: boolean;
    maxPlayers: number;
    updateTime: number;
    gver: string;
    minor: string;
    regionCache: boolean;
    saveInterval: number;
    messageLimit: number;

    smtpHost: string;
    smtpPort: number;
    smtpUseSecure: boolean;
    smtpUser: string;
    smtpPassword: string;

    sentryOrg: string;
    sentryProject: string;
    sentryAuthToken: string;
    sentryDsn: string;

    stripeEndpoint: string;
    stripeKeyLocal: string;
    stripeSecretKey: string;

    discordEnabled: boolean;
    discordChannelId: string;
    discordBotToken: string;

    acceptLicense: boolean;

    debugging: boolean;
    debugLevel: 'all';
    fsDebugging: boolean;
}

console.debug(`Loading env values from [.env] with fallback to [.env.defaults]`);

function camelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/([_-][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
}

let { NODE_ENV } = process.env,
    env = dotenv.load({ path: `../../.env`, defaults: '../../.env.defaults' }),
    nodeEnvConfig = `../../.env.${NODE_ENV}`,
    nodeEnvConfigExists = await fs.stat(nodeEnvConfig).catch(() => false);

if (NODE_ENV && nodeEnvConfigExists) {
    console.debug(`Loading additional env values from [.env.${NODE_ENV}]`);

    Object.assign(env, dotenv.load({ path: nodeEnvConfig }));
}

let envConfig = dotenvParseVariables(env),
    config = {} as Config;

for (let key in envConfig) {
    let camelCaseKey = camelCase(key) as keyof Config;

    config[camelCaseKey] = envConfig[key] as never;
}

config.hubHost ||= config.host;
config.hubWsHost ||= config.hubHost;
config.adminHost ||= config.hubHost;
config.remoteServerHost ||= config.host;

if (NODE_ENV === 'e2e' && !config.mongodbDatabase.includes('e2e')) {
    console.error(
        `Something is wrong with your configuration, your NODE_ENV is set to 'e2e' and your database name does not include 'e2e'.
        This might cause you to mess up [${config.mongodbDatabase}] via the e2e tests. Stopping the server.`
    );

    throw new Error(
        `NODE_ENV and database name mismatch [NODE_ENV=${NODE_ENV},mongodbDatabase=${config.mongodbDatabase}]`
    );
}

export function exposedConfig<T extends keyof Config>(...keys: T[]) {
    let exposed = {} as Pick<Config, T>;

    for (let key of keys) exposed[key] = config[key];

    return exposed;
}

export default config;
