import log from '@kaetram/common/util/log';

import type { GuildData } from '../../controllers/guilds';
import type MongoDB from './mongodb';

export default class Creator {
    public constructor(private database: MongoDB) {}

    public async saveGuild(guild: GuildData): Promise<void> {
        let data = {
            name: guild.name, // Actual name
            owner: guild.owner,
            players: guild.players
        };

        if (!data.name || !data.owner || !data.players) return;

        let database = await this.database.getConnection(),
            guilds = database.collection<GuildData>('guild_data');

        guilds.updateOne(
            { name: guild.name.toLowerCase() },
            { $set: data },
            { upsert: true },
            (error, result) => {
                if (error) throw error;

                if (result) log.debug(`Successfully saved data for ${guild.name}'s guild.`);
            }
        );
    }
}
