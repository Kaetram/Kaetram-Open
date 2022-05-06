import { Client, Message, TextChannel } from 'discord.js';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

export default class Discord {
    private client!: Client;

    private messageCallback?: (source: string, text: string, colour: string) => void;

    public constructor() {
        if (!config.discordEnabled) return;

        this.client = new Client();

        // Discord is successfully connected.
        this.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        // Receive any message acitivty from the Discord server.
        this.client.on('message', this.handleMessage.bind(this));

        // Connect to the Discord server.
        this.client.login(config.discordBotToken);
    }

    /**
     * Handles an incoming message from the Discord server.
     * @param message A DiscordJS.Message object.
     */

    private handleMessage(message: Message): void {
        if (message.channel.id !== config.discordChannelId) return;

        let source = `[Discord | ${message.author.username}]`,
            text = `@goldenrod@${message.content}`;

        this.messageCallback?.(source, text, 'tomato');
    }

    /**
     * Formats a message and then sends the raw string to the Discord server.
     * @param source The player username that is sending the message.
     * @param text The message that the player is sending.
     * @param serverName The `serverName` the message is coming from.
     * @param withArrow If to add an arrow ASCII character to the message.
     */

    public sendMessage(
        source: string,
        text: string,
        serverName?: string,
        withArrow?: boolean
    ): void {
        if (!source || !config.discordEnabled || config.debugging) return;

        this.sendRawMessage(
            `**[${serverName || config.name}]** ${source}${withArrow ? ' »' : ''} ${text}`
        );
    }

    /**
     * Sends a raw message string to the Discord server.
     * @param message The message string to send.
     */

    public sendRawMessage(message: string): void {
        if (!this.client) return;

        (this.client.channels.cache.get(config.discordChannelId) as TextChannel).send(message);
    }

    /**
     * A callback for when the discord server requests message to be broadcast.
     * @param callback Callback containing the source, text, and colour of the message.
     */

    public onMessage(callback: (source: string, text: string, colour: string) => void): void {
        this.messageCallback = callback;
    }
}
