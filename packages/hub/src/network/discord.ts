import DiscordJS from 'discord.js';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import type API from './api';

export default class Discord {
    private api!: API;
    private client!: DiscordJS.Client;
    private webhook!: DiscordJS.WebhookClient;

    public constructor(api: API) {
        if (!config.discordEnabled) return;

        this.api = api;

        this.client = new DiscordJS.Client();
        this.webhook = new DiscordJS.WebhookClient(
            config.discordWebhookId,
            config.discordWebhookToken
        );

        this.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        this.client.on('message', (message) => {
            if (message.author.id === config.discordWebhookId) return;

            if (message.channel.id !== config.discordServerId) return;

            let source = `[Discord | ${message.author.username}]`,
                text = `@goldenrod@${message.content}`;

            this.api.broadcastChat(source, text, 'tomato');
        });

        this.client.login(config.discordBotToken);
    }

    /**
     * Sends a message to the Discord server using the webhook.
     */

    public sendWebhook(
        source: string,
        text: string,
        serverName: string | null,
        withArrow: boolean
    ): void {
        if (!source || !config.discordEnabled) return;

        this.webhook.send(
            `**[${serverName || config.name}]** ${source}${withArrow ? ' »' : ''} ${text}`
        );
    }

    public sendRawWebhook(message: string): void {
        if (!message || !config.discordEnabled || config.debugging) return;

        this.webhook.send(message);
    }
}
