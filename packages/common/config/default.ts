import type { DatabaseTypes, DebugLevel } from './types';

export default {
    /**
     * @default 'Kaetram'
     */
    name: 'Kaetram',
    /**
     * @default 'localhost'
     */
    host: 'localhost',

    /**
     * Whether to use HTTPS.
     * @default false
     */
    ssl: false,

    /**
     * Server ports, make sure this matches the client's config.
     * @default 9001
     */
    socketioPort: 9001,
    /**
     * @default 9002
     */
    websocketPort: 9002,

    /**
     * @default false
     */
    apiEnabled: false,
    /**
     * @default 9003
     */
    apiPort: 9003,

    /**
     * Server ID (increment with each server hosted).
     * @default 1
     */
    serverId: 1,
    /**
     * @default undefined
     */
    accessToken: undefined as string | undefined,

    /**
     * @default false
     */
    hubEnabled: false,
    /**
     * @default this.host
     */
    get hubHost() {
        return this.host;
    },
    /**
     * @default 9526
     */
    hubPort: 9526,

    /**
     * Host ping interval (in milliseconds).
     * @default 15_000
     */
    hubPing: 15_000, // Ping every 15 seconds
    /**
     * Make sure it matches with the hub.
     * Note that if you take the hub-server approach, you should NEVER
     * rely solely on `hubAccessToken`. This is just a minimal safety feature.
     * Instead, please look into properly setting up the firewall such that
     * connections are limited to only trusted clients and APIs.
     * @default ''
     */
    hubAccessToken: '',
    /**
     * The host sent to the hub, if empty string, hub will try to find the IP.
     * Not recommended to have as empty string for production environments.
     * @default ''
     */
    remoteServerHost: '',

    /**
     * Overrides which host client connects to.
     * @default host
     */
    get clientRemoteHost() {
        return this.host;
    },
    /**
     * Overrides which port the client connects to.
     * @default socketioPort
     */
    get clientRemotePort() {
        return this.socketioPort;
    },

    /**
     * Server list cleanup threshold.
     * @default 120_000
     */
    cleanupThreshold: 120_000,
    /**
     * Server list cleanup time (in milliseconds).
     * @default 30_000
     */
    cleanupTime: 30_000,

    /**
     * Whether to skip database checking upon login.
     * @default true
     */
    skipDatabase: true,
    /**
     * Used for multiple database support.
     * @default 'mongodb'
     */
    database: 'mongodb' as DatabaseTypes,

    /**
     * @default '127.0.0.1'
     */
    mongodbHost: '127.0.0.1',
    /**
     * @default 27017
     */
    mongodbPort: 27_017,
    /**
     * @default ''
     */
    mongodbUser: '',
    /**
     * @default ''
     */
    mongodbPassword: '',
    /**
     * @default 'kaetram_devlopment'
     */
    mongodbDatabase: 'kaetram_devlopment',
    /**
     * @default false
     */
    mongodbTls: false,
    /**
     * Whether to use the `mongodb+srv` syntax.
     * @default false
     */
    mongodbSrv: false,

    /**
     * @default false
     */
    worldSwitch: false,
    /**
     * Whether players have to finish the tutorial before proceeding.
     * @default true
     */
    tutorialEnabled: true,
    /**
     * !! Allows login with any credentials !!
     * @default false
     */
    overrideAuth: false,
    /**
     * Maximum number of players allowed on the server.
     * @default 200
     */
    maxPlayers: 200,
    /**
     * 20 updates (ticks) per second.
     * @default 20
     */
    updateTime: 20,

    /**
     * Whether to connect to Discord or not.
     * @default false
     */
    discordEnabled: false,
    /**
     * The Discord channel ID to monitoring messages from.
     * @default undefined
     */
    discordChannelId: undefined as string | undefined,
    /**
     * The Discord bot token used to interact with the server.
     * @default undefined
     */
    discordBotToken: undefined as string | undefined,

    /**
     * Will print out more debugging info from log.
     * @default true
     */
    debugging: true,
    /**
     * @default 'all'
     */
    debugLevel: 'all' as DebugLevel,
    /**
     * Whether to write to a File Stream instead of stdout.
     * @default false
     */
    fsDebugging: false
};
