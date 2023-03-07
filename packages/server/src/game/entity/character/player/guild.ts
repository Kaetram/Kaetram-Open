import { Modules } from '@kaetram/common/network';

import type { Member, GuildData } from '@kaetram/common/types/guild';

export default class Guild {
    public name = '';
    public owner = '';

    // Our current rank in the guild.
    public rank: Modules.GuildRank = Modules.GuildRank.Fledgling;

    // Contains the members of the guild and their ranks/statuses.
    public members: Member[] = [];

    // Whether or not the guild is invite only
    public inviteOnly = false;

    public constructor(data: Partial<GuildData>) {
        this.name = data.name!;
        this.owner = data.owner!;
        this.inviteOnly = data.inviteOnly || this.inviteOnly;
        this.members = data.members || this.members;
    }

    /**
     * Condenses the information of the guild into a single object so that
     * we may store it in the database.
     * @returns The guild data object.
     */

    public serialize(): GuildData {
        return {
            identifier: this.name.toLowerCase(),
            name: this.name,
            owner: this.owner,
            inviteOnly: this.inviteOnly,
            members: this.members
        };
    }
}
