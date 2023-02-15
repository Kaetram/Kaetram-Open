import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import { Client, IntentsBitField } from 'discord.js';

import type { Message, TextChannel } from 'discord.js';

/**
 * It is important that the bot has the correct permissions in the Discord server
 * to ensure optimal functionality. The bot needs to be able to send messages and
 * modify the server topic (manage channels).
 */

export default class Discord {
    private client!: Client;

    private messageCallback?: (source: string, text: string, colour: string) => void;

    public constructor(skip = false) {
        if (!config.discordEnabled || skip) return;

        this.client = new Client({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildPresences
            ]
        });

        // Discord is successfully connected.
        this.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        // Receive any message acitivty from the Discord server.
        this.client.on('messageCreate', this.handleMessage.bind(this));

        // Connect to the Discord server.
        this.client.login(config.discordBotToken);
    }

    /**
     * Handles an incoming message from the Discord server.
     * @param message A DiscordJS.Message object.
     */

    private handleMessage(message: Message): void {
        try {
            if (message.channel.id !== config.discordChannelId) return;
            if (this.client.user?.id === message.author.id) return; // Skip if it's the bot.
            if (!message.content) return; // Picture sent or something.

            let source = `[Discord | ${message.author.username}]`,
                text = `@goldenrod@${message.content}`;

            this.messageCallback?.(source, text, 'tomato');
        } catch {
            log.error(`An error has occurred while handling a message from the Discord server.`);
        }
    }

    /**
     * Sets the topic of the primary Discord channel.
     * @param message Message to set as the topic.
     */

    public setTopic(message: string): void {
        if (!message || !config.discordEnabled || !this.client) return;

        try {
            let channel = this.getChannel();

            if (channel) channel.setTopic(message).catch((error) => log.error(error));
        } catch {
            log.error('An error has occurred while setting the Discord channel topic.');
        }
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
        if (!source || !config.discordEnabled) return;

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

        try {
            let channel = this.getChannel();

            if (channel) channel.send(message).catch((error) => console.error(error));
        } catch {
            log.error('An error has occurred while sending a message to the Discord server.');
        }
    }

    /**
     * A callback for when the discord server requests message to be broadcast.
     * @param callback Callback containing the source, text, and colour of the message.
     */

    public onMessage(callback: (source: string, text: string, colour: string) => void): void {
        this.messageCallback = callback;
    }

    /**
     * @returns The default channel that the bot is assigned to.
     */

    private getChannel(): TextChannel {
        return this.client.channels.cache.get(config.discordChannelId) as TextChannel;
    }
}
