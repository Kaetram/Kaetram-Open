import log from '@kaetram/common/util/log';

import type { PlayerAchievements, PlayerQuests } from '../../controllers/quests';
import type { ContainerArray } from '../../game/entity/character/player/containers/container';
import type { FriendsArray, FriendsList } from '../../game/entity/character/player/friends';
import type Player from '../../game/entity/character/player/player';
import type {
    ProfessionsArray,
    ProfessionsData
} from '../../game/entity/character/player/professions/professions';
import type MongoDB from './mongodb';

export default class Loader {
    public constructor(private database: MongoDB) {}

    private parseArray(value: string): number[] {
        return value.split(' ').map((string) => parseInt(string));
    }

    public async getInventory(player: Player): Promise<{
        ids: number[];
        counts: number[];
        abilities: number[];
        abilityLevels: number[];
    }> {
        let database = await this.database.getConnection(),
            inventory = database.collection<ContainerArray>('player_inventory'),
            cursor = inventory.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (info) {
            if (info.username !== player.username)
                log.notice(
                    `[Loader] Mismatch in usernames whilst retrieving inventory data for: ${player.username}`
                );

            return {
                ids: this.parseArray(info.ids),
                counts: this.parseArray(info.counts),
                abilities: this.parseArray(info.abilities),
                abilityLevels: this.parseArray(info.abilityLevels)
            };
        }
        throw 'Could not get inventory';
    }

    public async getBank(
        player: Player
    ): Promise<{ ids: number[]; counts: number[]; abilities: number[]; abilityLevels: number[] }> {
        let database = await this.database.getConnection(),
            bank = database.collection<ContainerArray>('player_bank'),
            cursor = bank.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (info) {
            if (info.username !== player.username)
                log.notice(
                    `[Loader] Mismatch in usernames whilst retrieving bank data for: ${player.username}`
                );

            return {
                ids: this.parseArray(info.ids),
                counts: this.parseArray(info.counts),
                abilities: this.parseArray(info.abilities),
                abilityLevels: this.parseArray(info.abilityLevels)
            };
        }
        throw 'Could not get bank';
    }

    public async getQuests(player: Player): Promise<{ ids: string[]; stages: string[] }> {
        let database = await this.database.getConnection(),
            quests = database.collection<PlayerQuests>('player_quests'),
            cursor = quests.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (info) {
            if (info.username !== player.username)
                log.notice(
                    `[Loader] Mismatch in usernames whilst retrieving quest data for: ${player.username}`
                );

            return { ids: info.ids.split(' '), stages: info.stages.split(' ') };
        }
        throw 'Could not get quests';
    }

    public async getAchievements(player: Player): Promise<{ ids: string[]; progress: string[] }> {
        let database = await this.database.getConnection(),
            achievements = database.collection<PlayerAchievements>('player_achievements'),
            cursor = achievements.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (info) {
            if (info.username !== player.username)
                log.notice(
                    `[Loader] Mismatch in usernames whilst retrieving achievement data for: ${player.username}`
                );

            return { ids: info.ids.split(' '), progress: info.progress.split(' ') };
        }
        throw 'Could not get achievements';
    }

    public async getProfessions(player: Player): Promise<ProfessionsData> {
        let database = await this.database.getConnection(),
            professions = database.collection<ProfessionsArray>('player_professions'),
            cursor = professions.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (info && info.data) {
            if (info.username !== player.username)
                log.notice(
                    `[Loader] Mismatch in usernames whilst retrieving profession data for: ${player.username}`
                );

            return info.data;
        }
        throw 'Could not get professions';
    }

    public async getFriends(player: Player): Promise<FriendsList> {
        let database = await this.database.getConnection(),
            friends = database.collection<FriendsArray>('player_friends'),
            cursor = friends.find({ username: player.username }),
            [info] = await cursor.toArray();

        if (info && info.friends) {
            if (info.username !== player.username)
                log.notice(
                    `[Loader] Mismatch in usernames whilst retrieving friends data for: ${player.username}`
                );

            return info.friends;
        }
        throw 'Could not get friends'; // :(
    }
}
