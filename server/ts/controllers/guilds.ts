import _ from 'underscore';

/**
 * @class
 * A guild contains the following information:
 *
 * @param name - Identifies the guild
 * @param owner - Indicates who owns the guild
 * @param members - An array containing all the members in the guild.
 */
class Guilds {
    public guilds: any;
    public loader: any;
    public loaded: any;
    public creator: any;
    public world: any;

    constructor(world) {
        this.world = world;
        this.creator = world.database.creator;
        this.loader = world.database.loader;

        this.guilds = {};

        this.loaded = false;

        this.load();
    }

    load() {
        this.loader.getGuilds(guilds => {
            _.each(guilds, (guild: any) => {
                this.guilds[guild.name] = {
                    owner: guild.owner,
                    members: guild.members
                };
            });

            if (this.guildCount() === guilds.length) this.loaded = true;
        });
    }

    get(guild) {
        if (guild in this.guilds) return this.guilds[guild];

        return null;
    }

    create(name, owner) {
        const newGuild = {
            name,
            owner: owner.username,
            members: [owner.username]
        };

        this.loader.getGuild(newGuild.name, guild => {
            if (guild) {
                owner.notify('A guild with that name already exists.');

                return;
            }

            this.guilds[name] = newGuild;

            this.save(newGuild);
        });
    }

    join(guild, player) {
        if (player.guild) {
            player.notify(
                'You cannot join another guild. Please leave your current one.'
            );
            player.notify(
                'P.S. If you see this message, please report it as a bug.'
            );

            return;
        }

        this.loader.getGuild(guild.name, guildData => {
            //
        });
    }

    leave(player) {
        if (!player.guild) return;

        const guild = this.guilds[player.guild];
        const index = guild.this.guilds[player.guild].members;
    }

    save(guild) {
        if (!this.loaded) return;

        if (guild) {
            this.creator.saveGuild(guild);

            return;
        }

        this.forEachGuild(guild => {
            this.creator.saveGuild(guild);
        });
    }

    hasGuild(owner) {
        for (const i in this.guilds)
            if (this.guilds.hasOwnProperty(i))
                if (this.guilds[i].owner.toLowerCase() === owner.toLowerCase())
                    return true;

        return false;
    }

    guildCount() {
        return Object.keys(this.guilds).length;
    }

    forEachGuild(callback) {
        _.each(this.guilds, guild => {
            callback(guild);
        });
    }
}

export default Guilds;
