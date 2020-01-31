class Guilds {

    constructor(world) {
        let self = this;

        self.world = world;
        self.creator = world.database.creator;
        self.loader = world.database.loader;

        /**
         * A guild contains the following information:
         * `name` - Identifies the guild
         * `owner` - Indicates who owns the guild
         * `members` - An array containing all the members in the guild.
         */

        self.guilds = {};
    }

    load() {
        let self = this;

        self.loader.getGuilds((guildInfo) => {

        });
    }

    join(guild, player) {
        let self = this;

        if (player.guild) {
            player.notify('You cannot join another guild. Please leave your current one.');
            player.notify('P.S. If you see this message, please report it as a bug.');
            return;
        }

        self.loader.getGuild(guild.name, (guildData) => {

        });
    }

    leave(player) {
        let self = this;

        if (!player.guild)
            return;

        let guild = self.guilds[player.guild],
            index = guild.

        self.guilds[player.guild].members
    }

    save(guild) {
        let self = this;

        if (guild) {
            self.creator.saveGuild(guild);
            return;
        }

        self.forEachGuild((guild) => {
            self.creator.saveGuild(guild);
        });
    }

    forEachGuild(callback) {
        _.each(this.guilds, (guild) => { callback(guild); });
    }

}

module.exports = Guilds;
