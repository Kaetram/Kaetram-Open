import type { DatabaseTypes, DebugLevel } from './types';

export default {
    name: 'Kaetram',
    host: 'localhost',

    /**
     * Whether to use HTTPS.
     */
    ssl: false,

    /**
     * Server ports, make sure this matches the client's config.
     */
    socketioPort: 9001,
    websocketPort: 9002,

    apiEnabled: false,
    apiPort: 9003,

    /**
     * Server ID (increment with each server hosted).
     */
    serverId: 1,
    accessToken: undefined as string | undefined,

    hubEnabled: false,
    /**
     * @default this.host
     */
    get hubHost() {
        return this.host;
    },
    hubPort: 9526,

    /**
     * Host ping interval (in milliseconds).
     */
    hubPing: 15_000, // Ping every 15 seconds
    /**
     * Make sure it matches with the hub.
     * Note that if you take the hub-server approach, you should NEVER
     * rely solely on `hubAccessToken`. This is just a minimal safety feature.
     * Instead, please look into properly setting up the firewall such that
     * connections are limited to only trusted clients and APIs.
     */
    hubAccessToken: '',
    /**
     * The host sent to the hub, if empty string, hub will try to find the IP.
     * Not recommended to have as empty string for production environments.
     */
    remoteServerHost: '',

    /**
     * Overrides which host client connects to.
     *
     * @default host
     */
    get clientRemoteHost() {
        return this.host;
    },
    /**
     * Overrides which port the client connects to.
     *
     * @default socketioPort
     */
    get clientRemotePort() {
        return this.socketioPort;
    },

    /**
     * Server list cleanup threshold.
     */
    cleanupThreshold: 120_000,
    /**
     * Server list cleanup time (in milliseconds).
     */
    cleanupTime: 30_000,

    /**
     * Whether to skip database checking upon login.
     */
    skipDatabase: true,
    /**
     * Used for multiple database support.
     */
    database: 'mongodb' as DatabaseTypes,

    mongodbHost: '127.0.0.1',
    mongodbPort: 27_017,
    mongodbUser: '',
    mongodbPassword: '',
    mongodbDatabase: 'kaetram_development',
    mongodbTls: false,
    /**
     * Whether to use the `mongodb+srv` syntax.
     */
    mongodbSrv: false,

    worldSwitch: false,
    /**
     * Whether players have to finish the tutorial before proceeding.
     */
    tutorialEnabled: true,
    /**
     * !! Allows login with any credentials !!
     */
    overrideAuth: false,
    /**
     * Maximum number of players allowed on the server.
     */
    maxPlayers: 200,
    /**
     * 20 updates (ticks) per second.
     */
    updateTime: 20,

    /**
     * Whether to connect to Discord or not.
     */
    discordEnabled: false,
    /**
     * The Discord channel ID to monitoring messages from.
     */
    discordChannelId: undefined as string | undefined,
    /**
     * The Discord bot token used to interact with the server.
     */
    discordBotToken: undefined as string | undefined,

    /**
     * Will print out more debugging info from log.
     */
    debugging: true,
    debugLevel: 'all' as DebugLevel,
    /**
     * Whether to write to a File Stream instead of stdout.
     */
    fsDebugging: false
};
