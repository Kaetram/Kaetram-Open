import { Client, Message, WebhookClient } from 'discord.js';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type World from '../game/world';

/**
 * This class is a standalone integration with the Discord server.
 * The hub contains a variant of this class but adapted for
 * integration with the hub instead. When the server runs in standalone
 * mode (that is, without a hub) it uses this class. Otherwise, it is disabled
 * automatically.
 */

export default class Discord {
    private client: Client = new Client();
    private webhook: WebhookClient = new WebhookClient(
        config.discordWebhookId,
        config.discordWebhookToken
    );

    public constructor(private world: World) {
        if (!config.discordEnabled) return;

        if (config.hubEnabled) {
            log.warning('Server is in hub-mode, disabling Discord connection.');
            config.discordEnabled = false;
            return;
        }

        this.client.on('ready', this.ready.bind(this));
        this.client.on('message', this.handleMessage.bind(this));

        this.client.login(config.discordBotToken);
    }

    private ready(): void {
        log.notice('Successfully connected to the Discord server.');
    }

    /**
     * Relays the message that occurs in the Discord channel to the world.
     * @param message The discord message object.
     */

    private handleMessage(message: Message): void {
        // Ignore messages from the bot to prevent recursive madness.
        if (message.author.id === config.discordWebhookId) return;

        // Ignore messages from other channels.
        if (message.channel.id !== config.discordServerId) return;

        let source = `[Discord | ${message.author.username}]`,
            text = Utils.parseMessage(`@goldenrod@${message.content}`);

        // Broadcasts the message to the whole world.
        this.world.globalMessage(source, text, 'tomato');
    }

    /**
     * Sends a message from in-game to the Discord server channel.
     * @param source Who is sending the message.
     * @param message The contents of the message.
     * @param withArrow Whether to display an arrow between source and message content.
     */

    public sendWebhook(source: string, message: string, withArrow = false): void {
        if (!config.discordEnabled) return;

        let formattedSource = Utils.formatName(source);

        this.webhook.send(
            `**[${config.name}]** ${formattedSource}${withArrow ? ' »' : ''} ${message}`
        );
    }
}
