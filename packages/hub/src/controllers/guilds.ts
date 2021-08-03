import _ from 'lodash';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import type { DatabaseType } from '../database/database';
import type Creator from '../database/mongodb/creator';
import type Loader from '../database/mongodb/loader';
import type API from '../network/api';

interface PlayerData {
    rank: string;
}

/**
 * Store local guild object array for easier modifications.
 * A guild contains the following information:
 */
export interface GuildData {
    /** Identifies the guild. */
    name: string;
    /** Indicates who owns the guild. */
    owner: string;
    /** An object array containing all the players in the guild. */
    players: { [name: string]: PlayerData };
}

export default class Guilds {
    private api!: API;
    private database!: DatabaseType;

    private creator!: Creator;
    private loader!: Loader;

    private guilds: { [name: string]: GuildData } = {};

    public constructor(api: API, database: DatabaseType) {
        if (!config.guildsEnabled) return;

        this.api = api;
        this.database = database;

        this.creator = database.creator;
        this.loader = database.loader;

        this.load();
    }

    private async load(): Promise<void> {
        let guilds = await this.loader.getGuilds();

        _.each(guilds, ({ name, owner, players }) => {
            this.guilds[name] = {
                name,
                owner,
                players
            };
        });

        log.info(`Finished loading ${this.getCount()} guilds.`);
    }

    public create(name: string, owner: string): void {
        if (this.exists(name)) {
            this.api.sendChatToPlayer(owner, 'Could not create a guild with that name.', 'red');
            return;
        }

        this.guilds[name] = {
            owner,
            players: {}
        } as GuildData;

        this.guilds[name].players[owner] = {
            rank: 'owner'
        };

        this.save();
    }

    public join(guild: GuildData, name: string, rank: string): void {
        let playerGuild = this.findPlayer(name);

        if (playerGuild) {
            this.api.sendChatToPlayer(name, 'You are already in a guild.', 'red');
            return;
        }

        if (name in guild.players) {
            this.api.sendChatToPlayer(name, 'You have already joined this guild.', 'red');
            return;
        }

        guild.players[name] = {
            rank
        };

        this.save();
    }

    public updatePlayer(guild: GuildData, name: string, data: PlayerData): void {
        guild.players[name] = data;
    }

    /**
     * Removes a player from a guild
     * @param name - The name of the player
     */
    public leave(name: string): void {
        let guild = this.findPlayer(name);

        if (!guild) return;

        delete guild.players[name];

        this.save();
    }

    /**
     * Finds a player within a guild and returns the guild.
     */
    private findPlayer(name: string): GuildData | null {
        for (let i in this.guilds) if (name in this.guilds[i].players) return this.guilds[i];

        return null;
    }

    private save(): void {
        this.forEachGuild((guild) => {
            this.creator.saveGuild(guild);
        });
    }

    /**
     * Checks if a guild exists.
     */
    private exists(name: string): boolean {
        for (let i in this.guilds)
            if (this.guilds[i].name.toLowerCase() === name.toLowerCase()) return true;

        return false;
    }

    private getCount(): number {
        return Object.keys(this.guilds).length;
    }

    private forEachGuild(callback: (guild: GuildData) => void): void {
        _.each(this.guilds, (guild) => {
            callback(guild);
        });
    }
}
