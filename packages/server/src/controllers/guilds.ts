import Guild from '../game/entity/character/player/guild';
import { Player as PlayerPacket } from '../network/packets';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';

import type World from '../game/world';
import type Player from '../game/entity/character/player/player';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';
import type { GuildData, Member, UpdateInfo } from '@kaetram/common/types/guild';

export default class Guilds {
    private database: MongoDB;

    public constructor(private world: World) {
        this.database = world.database;
    }

    /**
     * Creates a guild and stores it in the database. We also assign the guild
     * object onto the player and add the player to the guild.
     * @param player The player who is creating the guild.
     * @param guildName The name of the guild.
     */

    public create(player: Player, guildName: string): void {
        /**
         * We use the lower case of the guild name as the identifier. That way
         * we allow players to have guilds with capital letters in their name.
         */

        let identifier = guildName.toLowerCase();

        this.database.loader.loadGuild(identifier, (guild?: GuildData) => {
            // Ensure a guild doesn't already exist with that name.
            if (guild) return player.notify('A guild with that name already exists.');

            // Create a new guild object and assign it to the player.
            player.guild = new Guild({ name: guildName, owner: player.username });

            // Create the database entry for the guild.
            this.database.creator.saveGuild(player);
        });
    }

    /**
     * Adds a member to a specified guild and synchronizes the member list among
     * all the players in the guild.
     * @param player The player that is joining the guild.
     * @param identifier Used to determine the guild the player is joining.
     */

    public join(player: Player, identifier: string): void {
        if (player.guild) return player.notify('You are already in a guild.');

        // Attempt to grab the guild from the database.
        this.database.loader.loadGuild(identifier, (guild?: GuildData) => {
            if (!guild)
                return log.general(
                    `Player ${player.username} tried to join a guild that doesn't exist.`
                );

            // Append the player to the guild's member list.
            guild.members.push({
                username: player.username,
                rank: Modules.GuildRank.Fledgling,
                joinDate: Date.now(),
                serverId: config.serverId
            });

            // Create a guild object with the data from the database.
            player.guild = new Guild(guild);

            // Save the guild to the database.
            this.database.creator.saveGuild(player);

            // Relay information to all the guild members.
            this.updateGuild(guild.members, {
                opcode: Opcodes.Guild.Join,
                username: player.username
            });
        });
    }

    /**
     * Handles a player leaving the guild. We want to update the guild in the database
     * and relay that information to all the members currently in the guild.
     * @param player The player that is leaving the guild.
     */

    public leave(player: Player): void {
        // No need to do anything if the player doesn't have a guild.
        if (!player.guild) return;

        // Grab the guild from the database.
        this.database.loader.loadGuild(player.getGuildIdentifier(), (guild?: GuildData) => {
            if (!guild)
                return log.general(
                    `Player ${player.username} tried to leave a guild that doesn't exist.`
                );

            // Remove the player from the guild's member list.
            guild.members = guild.members.filter((member) => member.username !== player.username);

            // Save the guild to the database.
            this.database.creator.saveGuild(player);

            // We use this to relay the leaving packet to the player.
            player.guild?.leaveCallback?.(player.username);

            // Remove the guild object from the player.
            player.guild = undefined;

            // Update the guild for all the other players.
            this.updateGuild(guild.members, {
                opcode: Opcodes.Guild.Leave,
                username: player.username
            });
        });
    }

    /**
     * Relays information to all the guild members about a player joining or leaving
     * the guild. This can also be used to update ranks and other information.
     * @param members List of all the members of the guild we want to update.
     */

    private updateGuild(members: Member[], data: UpdateInfo): void {
        for (let member of members) {
            // Member is offline.
            if (member.serverId === -1) continue;

            // Have the hub relay the packet to the other server.
            if (member.serverId !== config.serverId) {
                this.world.client.send(
                    new PlayerPacket(Opcodes.Player.Guild, {
                        serverId: member.serverId,
                        guild: data
                    })
                );

                continue;
            }

            let player = this.world.getPlayerByName(member.username);

            // Update the member of the guild if they are online.
            player?.guild?.update(data);
        }
    }
}
