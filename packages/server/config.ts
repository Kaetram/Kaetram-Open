import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import { camelCase } from 'lodash';

import type { DatabaseType } from './src/database/database';

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

    database: DatabaseType;
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

let envConfig = dotenvParseVariables(dotenv.load()),
    appConfig = {} as Config;

for (let key of Object.keys(envConfig)) {
    let camelCaseKey = camelCase(key) as keyof Config;

    appConfig[camelCaseKey] = envConfig[key] as never;
}

export default appConfig;
