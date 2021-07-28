import { Client, Message, WebhookClient } from 'discord.js';

import config from '../../config';
import log from '../util/log';
import Utils from '../util/utils';

import type World from '../game/world';

/**
 * This class will be used in Kaetram-Hub as well.
 * But we will leave it in servers if the standalone
 * approach is used.
 */
export default class Discord {
    client!: Client;
    webhook!: WebhookClient;

    constructor(private world: World) {
        if (!config.discordEnabled) return;

        if (config.hubEnabled) {
            log.warning('Server is in hub-mode, disabling Discord connection.');
            config.discordEnabled = false;
            return;
        }

        this.client = new Client();
        this.webhook = new WebhookClient(config.discordWebhookId, config.discordWebhookToken);

        this.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        this.client.on('message', (message: Message) => {
            if (message.author.id === config.discordWebhookId) return;

            if (message.channel.id !== config.discordServerId) return;

            let source = `[Discord | ${message.author.username}]`,
                text = Utils.parseMessage('@goldenrod@' + message.content);

            this.world.globalMessage(source, text, 'tomato');
        });

        this.client.login(config.discordBotToken);
    }

    /**
     * Sends a message to the Discord server using the webhook.
     */

    sendWebhook(source: string, message: string, withArrow?: boolean): void {
        if (!config.discordEnabled) return;

        let formattedSource = Utils.formatUsername(source);

        this.webhook.send(`**[Kaetram]** ${formattedSource}${withArrow ? ' »' : ''} ${message}`);
    }
}
