import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';

import type { Member, GuildData, UpdateInfo, Decoration } from '@kaetram/common/types/guild';

type JoinCallback = (username: string, serverId: number) => void;
type LeaveCallback = (username: string) => void;
type UpdateCallback = (username: string, serverId: number) => void;
type RankCallback = (username: string, rank: Modules.GuildRank) => void;

export default class Guild {
    public name = '';
    public owner = '';

    // Our current rank in the guild.
    public rank: Modules.GuildRank = Modules.GuildRank.Fledgling;

    // Decorations for the guild.
    public decoration: Decoration = {
        banner: '',
        outline: '',
        crest: ''
    };

    // Contains the members of the guild and their ranks/statuses.
    public members: Member[] = [];

    // Whether or not the guild is invite only
    public inviteOnly = false;

    // Callbacks for relaying information to the client.
    public joinCallback?: JoinCallback;
    public leaveCallback?: LeaveCallback;
    public updateCallback?: UpdateCallback;
    public rankCallback?: RankCallback;

    public constructor(data: Partial<GuildData>) {
        this.name = data.name!;
        this.owner = data.owner!;
        this.inviteOnly = data.inviteOnly || this.inviteOnly;
        this.members = data.members || this.members;
    }

    /**
     * Handles an update from the guild controller. This can be either someone
     * joining, leaving, or someone's rank being changed.
     * @param data Contains information about what kind of action was performed.
     */

    public update(data: UpdateInfo): void {
        switch (data.opcode) {
            case Opcodes.Guild.Join: {
                return this.join(data.username, data.serverId);
            }

            case Opcodes.Guild.Leave: {
                return this.leave(data.username);
            }

            case Opcodes.Guild.Update: {
                return this.updateCallback?.(data.username, data.serverId!);
            }
        }
    }

    /**
     * Adds a new member to the guild and creates a callback.
     * @param username The username of the member we are adding.
     * @param serverId (Optional) Parameter passed when a player from a different
     * server joins the guild.
     */

    private join(username: string, serverId = config.serverId): void {
        this.members.push({
            username,
            rank: Modules.GuildRank.Fledgling,
            joinDate: Date.now(),
            serverId
        });

        this.joinCallback?.(username, serverId);
    }

    /**
     * Handles a member leaving the guild from the guild controller. This creates
     * a callback to synchronize the client with the new member list.
     * @param username The username of the member we are removing.
     */

    private leave(username: string): void {
        this.members = this.members.filter((member) => member.username !== username);

        this.leaveCallback?.(username);
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
            decoration: this.decoration,
            members: this.members
        };
    }

    /**
     * Callback for when a member joins the guild.
     * @param callback Contains the username of the player.
     */

    public onJoin(callback: JoinCallback): void {
        this.joinCallback = callback;
    }

    /**
     * Callback for when a member leaves the guild.
     * @param callback Contains the username of the player.
     */

    public onLeave(callback: LeaveCallback): void {
        this.leaveCallback = callback;
    }

    /**
     * Callback for when a member's online status has changed.
     * @param callback Contains the username of the player and their new server id.
     */

    public onUpdate(callback: UpdateCallback): void {
        this.updateCallback = callback;
    }

    /**
     * Callback for when a member's rank is changed.
     * @param callback Contains the username of the player and their new rank.
     */

    public onRank(callback: RankCallback): void {
        this.rankCallback = callback;
    }
}
