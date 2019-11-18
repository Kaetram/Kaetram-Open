/* global module */

const Messages = require('../../../../network/messages');
const Packets = require('../../../../network/packets');

class Guild {
    constructor(player, data) {
        const self = this;

        self.player = player;
        self.data = data;
    }

    join() {
        const self = this;

        if (self.data && self.data.name)
            self.leave();
    }

    leave() {
        const self = this;

        if (!self.data) {
            self.player.notify('You are not in a guild.');
            return;
        }

        self.getController().remove(self.player, self.data.string);

        self.data = null;

        self.player.send(new Messages.Guild(Packets.GuildOpcode.Leave));
    }

    /*
     * We keep each player up to date with changes
     * to the guild.
     */

    update(data) {
        const self = this;

        // Do a server-sided update.
        self.data = data;

        // Do a client-sided update.
        self.player.send(new Messages.Guild(Packets.GuildOpcode.Update, data));
    }

    getController() {
        return this.player.world.guilds;
    }
}

module.exports = Guild;
