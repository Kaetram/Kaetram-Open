let DiscordJS = require('discord.js'),
    Utils = require('../util/utils');

/**
 * This class will be used in Kaetram-Hub as well.
 * But we will leave it in servers if the standalone
 * approach is used.
 */

class Discord {

    constructor(world) {
        let self = this;

        if (!config.discordEnabled)
            return;

        if (config.hubEnabled) {
            log.warning('Server is in hub-mode, disabling Discord connection.');
            config.discordEnabled = false;
            return;
        }

        self.world = world;

        self.client = new DiscordJS.Client();
        self.webhook = new DiscordJS.WebhookClient(config.discordWebhookId, config.discordWebhookToken);

        self.client.on('ready', () => {
            log.notice('Successfully connected to the Discord server.');
        });

        self.client.on('message', (message) => {
            if (message.author.id === config.discordWebhookId)
                return;

            if (message.channel.id !== config.discordServerId)
                return;

            let source = `[Discord | ${message.author.username}]`,
                text = Utils.parseMessage('@goldenrod@' + message.content);

            self.world.globalMessage(source, text, 'tomato');
        });

        self.client.login(config.discordBotToken);
    }

    /**
     * Sends a message to the Discord server using the webhook.
     */

    sendWebhook(source, message, withArrow) {
        let self = this;

        if (!config.discordEnabled)
            return;

        let formattedSource = Utils.formatUsername(source);

        self.webhook.send(`**[Kaetram]** ${formattedSource}${withArrow ? ' »' : ''} ${message}`)
    }

}

module.exports = Discord;
