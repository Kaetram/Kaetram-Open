import DiscordJS from 'discord.js';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import type API from './api';

export default class Discord {
    private client!: DiscordJS.Client;
    private webhook!: DiscordJS.WebhookClient;

    public constructor(private api: API) {
        if (!config.discordEnabled) return;

        this.client = new DiscordJS.Client();
        this.webhook = new DiscordJS.WebhookClient(
            config.discordWebhookId,
            config.discordWebhookToken
        );

        this.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        this.client.on('message', this.handleMessage.bind(this));

        this.client.login(config.discordBotToken);
    }

    private handleMessage(message: DiscordJS.Message): void {
        if (message.author.id === config.discordWebhookId) return;

        if (message.channel.id !== config.discordServerId) return;

        let source = `[Discord | ${message.author.username}]`,
            text = `@goldenrod@${message.content}`;

        this.api.broadcastChat(source, text, 'tomato');
    }

    /**
     * Sends a message to the Discord server.
     * @param source The player username that is sending the message.
     * @param text The message that the player is sending.
     * @param serverName The serverName the message is coming from.
     * @param withArrow If to add an arrow ASCII character to the message.
     */

    public sendWebhook(
        source: string,
        text: string,
        serverName: string | null,
        withArrow: boolean
    ): void {
        if (!source || !config.discordEnabled) return;

        this.sendRawWebhook(
            `**[${serverName || config.name}]** ${source}${withArrow ? ' »' : ''} ${text}`
        );
    }

    /**
     * Sends a raw message string to the Discord server.
     * @param message The message string to send.
     */

    public sendRawWebhook(message: string): void {
        if (!message || !config.discordEnabled || config.debugging) return;

        this.webhook.send(message);
    }
}
