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

        self.loaded = false;

        if (config.offlineMode) {
            log.debug('Server in offline mode, not loading guilds.');
            return;
        }

        self.load();
    }

    load() {
        let self = this;

        self.loader.getGuilds((guilds) => {
            _.each(guilds, (guild) => {

                self.guilds[guild.name] = {
                    owner: guild.owner,
                    members: guild.members
                };

            });

            if (self.guildCount() === guilds.length)
                self.loaded = true;
        });

    }

    get(guild) {
        let self = this;

        if (guild in self.guilds)
            return self.guilds[guild];

        return null;
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

        if (!self.loaded)
            return;

        if (guild) {
            self.creator.saveGuild(guild);
            return;
        }

        self.forEachGuild((guild) => {
            self.creator.saveGuild(guild);
        });
    }

    hasGuild(owner) {
        let self = this;

        for (let i in self.guilds)
            if (self.guilds.hasOwnProperty(i))
                if (self.guilds[i].owner.toLowerCase() === owner.toLowerCase())
                    return true;

        return false;
    }

    guildCount() {
        return Object.keys(this.guilds).length;
    }

    forEachGuild(callback) {
        _.each(this.guilds, (guild) => { callback(guild); });
    }

}

module.exports = Guilds;
