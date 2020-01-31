let _ = require('underscore');

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

        self.load();
    }

    load() {
        let self = this;

        //self.create('testGuild', { username: 'test' });

        self.loader.getGuilds((guilds) => {
            log.info(guilds);
        });
    }

    create(name, owner) {
        let self = this,
            newGuild = {
                name: name,
                owner: owner.username,
                members: [owner.username]
            };

        self.loader.getGuild(newGuild.name, (guild) => {
            if (guild) {
                owner.notify('A guild with that name already exists.');
                return;
            }

            self.guilds[name] = newGuild;

            self.save(newGuild);
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
