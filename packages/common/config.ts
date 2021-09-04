import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import { camelCase } from 'lodash';

import type { DatabaseTypes } from './types/database';

export interface Config {
    name: string;
    host: string;
    ssl: boolean;

    socketioPort: number;
    websocketPort: number;

    serverId: string;
    accessToken: string;
    apiEnabled: boolean;
    apiPort: number;

    hubEnabled: boolean;
    hubHost: string;
    hubPort: number;
    hubPing: number;
    hubAccessToken: string;
    remoteServerHost: string;

    cleanupThreshold: number;
    cleanupTime: number;

    database: DatabaseTypes;
    offlineMode: boolean;

    mongodbHost: string;
    mongodbPort: number;
    mongodbUser: string;
    mongodbPassword: string;
    mongodbDatabase: string;
    mongodbSrv: boolean;
    mongodbAuth: boolean;

    worldSwitch: boolean;
    tutorialEnabled: boolean;
    overrideAuth: boolean;
    maxPlayers: number;
    updateTime: number;
    gver: string;
    guildsEnabled: boolean;
    treeTick: number;
    administrators: string[];
    moderators: string[];

    discordEnabled: boolean;
    discordServerId: string;
    discordBotToken: string;
    discordWebhookId: string;
    discordWebhookToken: string;

    debugging: boolean;
    debugLevel: 'all';
    fsDebugging: boolean;
    allowConnectionsToggle: boolean;
}

let envConfig = dotenvParseVariables(
        dotenv.load({
            path: '../../.env',
            defaults: '../../.env.defaults',
            includeProcessEnv: true
        })
    ),
    config = {} as Config;

for (let key of Object.keys(envConfig)) {
    let camelCaseKey = camelCase(key) as keyof Config;

    config[camelCaseKey] = envConfig[key] as never;
}

config.hubHost = config.hubHost || config.host;

export default config;
