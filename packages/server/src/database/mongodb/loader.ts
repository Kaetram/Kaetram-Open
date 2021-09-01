import log from '@kaetram/common/util/log';

import type { PlayerAchievements, PlayerQuests } from '../../controllers/quests';
import type { ContainerArray } from '../../game/entity/character/player/containers/container';
import type { FriendsArray } from '../../game/entity/character/player/friends';
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

    public getInventory(
        player: Player,
        callback: (
            ids: number[] | null,
            counts: number[] | null,
            abilities: number[] | null,
            abilityLevels: number[] | null
        ) => void
    ): void {
        this.database.getConnection((database) => {
            let inventory = database.collection<ContainerArray>('player_inventory'),
                cursor = inventory.find({ username: player.username });

            cursor.toArray().then((inventoryArray) => {
                let [info] = inventoryArray;

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            `[Loader] Mismatch in usernames whilst retrieving inventory data for: ${player.username}`
                        );

                    callback(
                        this.parseArray(info.ids),
                        this.parseArray(info.counts),
                        this.parseArray(info.abilities),
                        this.parseArray(info.abilityLevels)
                    );
                } else callback(null, null, null, null);
            });
        });
    }

    public getBank(
        player: Player,
        callback: (
            ids: number[],
            counts: number[],
            abilities: number[],
            abilityLevels: number[]
        ) => void
    ): void {
        this.database.getConnection((database) => {
            let bank = database.collection<ContainerArray>('player_bank'),
                cursor = bank.find({ username: player.username });

            cursor.toArray().then((bankArray) => {
                let [info] = bankArray;

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            `[Loader] Mismatch in usernames whilst retrieving bank data for: ${player.username}`
                        );

                    callback(
                        this.parseArray(info.ids),
                        this.parseArray(info.counts),
                        this.parseArray(info.abilities),
                        this.parseArray(info.abilityLevels)
                    );
                }
            });
        });
    }

    public getQuests(
        player: Player,
        callback: (ids: string[] | null, stage: string[] | null) => void
    ): void {
        this.database.getConnection((database) => {
            let quests = database.collection<PlayerQuests>('player_quests'),
                cursor = quests.find({ username: player.username });

            cursor.toArray().then((questArray) => {
                let [info] = questArray;

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            `[Loader] Mismatch in usernames whilst retrieving quest data for: ${player.username}`
                        );

                    callback(info.ids.split(' '), info.stages.split(' '));
                } else callback(null, null);
            });
        });
    }

    public getAchievements(
        player: Player,
        callback: (ids: string[], progress: string[]) => void
    ): void {
        this.database.getConnection((database) => {
            let achievements = database.collection<PlayerAchievements>('player_achievements'),
                cursor = achievements.find({ username: player.username });

            cursor.toArray().then((achievementsArray) => {
                let [info] = achievementsArray;

                if (info) {
                    if (info.username !== player.username)
                        log.notice(
                            `[Loader] Mismatch in usernames whilst retrieving achievement data for: ${player.username}`
                        );

                    callback(info.ids.split(' '), info.progress.split(' '));
                }
            });
        });
    }

    public getProfessions(player: Player, callback: (data: ProfessionsData) => void): void {
        this.database.getConnection((database) => {
            let professions = database.collection<ProfessionsArray>('player_professions'),
                cursor = professions.find({ username: player.username });

            cursor.toArray().then((professionsArray) => {
                let [info] = professionsArray;

                if (info && info.data) {
                    if (info.username !== player.username)
                        log.notice(
                            `[Loader] Mismatch in usernames whilst retrieving profession data for: ${player.username}`
                        );

                    callback(info.data);
                }
            });
        });
    }

    public getFriends(player: Player, callback: (friends: unknown) => void): void {
        this.database.getConnection((database) => {
            let friends = database.collection<FriendsArray>('player_friends'),
                cursor = friends.find({ username: player.username });

            cursor.toArray().then((friendsArray) => {
                let [info] = friendsArray;

                if (info && info.friends) {
                    if (info.username !== player.username)
                        log.notice(
                            `[Loader] Mismatch in usernames whilst retrieving friends data for: ${player.username}`
                        );

                    callback(info.friends);
                }
            });
        });
    }
}
