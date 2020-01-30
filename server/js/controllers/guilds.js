class Guilds {

    constructor(world) {
        let self = this;

        self.world = world;
        self.creator = world.database.creator;
        self.loader = world.database.loader;

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

    }

}

module.exports = Guilds;
