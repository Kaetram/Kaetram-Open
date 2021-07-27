import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import { camelCase } from 'lodash';

import type { DatabaseTypes } from './src/database/database';

interface Config {
    name: string;
    host: string;

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

    database: DatabaseTypes;
    offlineMode: boolean;

    mongodbHost: string;
    mongodbPort: number;
    mongodbUser: string;
    mongodbPassword: string;
    mongodbDatabase: string;
    mongodbAuth: boolean;

    tutorialEnabled: boolean;
    overrideAuth: boolean;
    maxPlayers: number;
    updateTime: number;
    gver: string;
    treeTick: number;
    administrators: string[];
    moderators: string[];

    discordEnabled: boolean;
    discordServerId: string;
    discordBotToken: string;
    discordWebhookId: string;
    discordWebhookToken: string;

    debug: boolean;
    debugLevel: 'all';
    fsDebugging: boolean;
    devClient: boolean;
    allowConnectionsToggle: boolean;
}

const envConfig = dotenvParseVariables(dotenv.load()),
    appConfig = {} as Config;

for (const key of Object.keys(envConfig)) {
    const camelCaseKey = camelCase(key) as keyof Config;

    appConfig[camelCaseKey] = envConfig[key] as never;
}

export default appConfig;
