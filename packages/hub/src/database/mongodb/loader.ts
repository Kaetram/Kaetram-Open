import log from '@kaetram/common/util/log';

import type { GuildData } from '../../controllers/guilds';
import type MongoDB from './mongodb';

export default class Loader {
    public constructor(private database: MongoDB) {}

    public async getGuilds(): Promise<GuildData[]> {
        let database = await this.database.getConnection(),
            guilds = database.collection<GuildData>('guild_data'),
            cursor = guilds.find();

        return await cursor.toArray();
    }

    public async getGuild(name: string): Promise<GuildData | null> {
        let database = await this.database.getConnection(),
            guilds = database.collection('guild_data'),
            cursor = guilds.find({ name: name.toLowerCase() }),
            guildsArray = await cursor.toArray(),
            [info] = guildsArray;

        if (!info) return null;

        if (info.name !== name)
            log.notice(`[Loader] Mismatch whilst retrieving guild data for ${name}`);

        return {
            name: info.name,
            owner: info.owner,
            players: info.players
        };
    }

    public async guildExists(name: string): Promise<boolean> {
        let database = await this.database.getConnection(),
            guilds = database.collection('guild_data'),
            cursor = guilds.find({ name: name.toLowerCase() }),
            data = await cursor.toArray();

        return data.length === 0;
    }
}
