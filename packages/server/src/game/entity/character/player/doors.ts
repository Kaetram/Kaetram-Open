import _ from 'lodash';

import config from '@kaetram/common/config';

import doorData from '../../../../../data/doors.json';

import type Player from './player';
import type { ObjectData } from './player';

type DoorStatus = 'open' | 'closed' | undefined;

export interface Door {
    id: number;
    x?: number | undefined;
    y?: number | undefined;
    status?: DoorStatus;
    requirement: string;
    level?: number | undefined;
    questId?: number | undefined;
    achievementId?: number | undefined;
    closedIds: { [key: string]: IDs };
    openIds: { [key: string]: IDs };
}

interface IDs {
    data: number[];
    isColliding: boolean;
}

interface DoorTiles {
    indexes: number[];
    data: number[][];
    collisions: boolean[];
    objectData?: ObjectData;
}

export default class Doors {
    public world;
    public map;
    public regions;

    public doors: { [id: number]: Door } = {};

    public constructor(private player: Player) {
        this.world = player.world;
        this.map = this.world.map;
        this.regions = this.map.regions;

        this.load();
    }

    private load(): void {
        _.each(doorData, (door: Door) => {
            this.doors[door.id] = {
                id: door.id,
                x: door.x,
                y: door.y,
                status: door.status,
                requirement: door.requirement,
                level: door.level,
                questId: door.questId,
                achievementId: door.achievementId,
                closedIds: door.closedIds,
                openIds: door.openIds
            };
        });
    }

    private getStatus(door: Door): DoorStatus {
        if (door.status) return door.status;

        if (config.offlineMode) return 'open';

        switch (door.requirement) {
            case 'quest': {
                let quest = this.player.quests.getQuest(door.questId!);

                return quest && quest.hasDoorUnlocked(door) ? 'open' : 'closed';
            }

            case 'achievement': {
                let achievement = this.player.quests.getAchievement(door.achievementId!);

                return achievement && achievement.isFinished() ? 'open' : 'closed';
            }

            case 'level':
                return this.player.level >= door.level! ? 'open' : 'closed';
        }
    }

    private getTiles(door: Door): DoorTiles {
        let tiles: DoorTiles = {
                indexes: [],
                data: [],
                collisions: []
            },
            status = this.getStatus(door),
            doorState = {
                open: door.openIds,
                closed: door.closedIds
            };

        _.each(doorState[status!], (value, key) => {
            tiles.indexes.push(parseInt(key));
            tiles.data.push(value.data);
            tiles.collisions.push(value.isColliding);
        });

        return tiles;
    }

    public getAllTiles(): DoorTiles {
        let allTiles: DoorTiles = {
            indexes: [],
            data: [],
            collisions: []
        };

        _.each(this.doors, (door) => {
            /* There's no need to send dynamic data if the player is not nearby. */
            let doorRegion = this.regions.regionIdFromPosition(door.x!, door.y!);

            if (!this.regions.isSurrounding(this.player.region, doorRegion)) return;

            let tiles = this.getTiles(door);

            allTiles.indexes.push(...tiles.indexes);
            allTiles.data.push(...tiles.data);
            allTiles.collisions.push(...tiles.collisions);
        });

        return allTiles;
    }

    public hasCollision(x: number, y: number): boolean {
        let tiles = this.getAllTiles(),
            tileIndex = this.world.map.gridPositionToIndex(x, y),
            index = tiles.indexes.indexOf(tileIndex);

        /**
         * We look through the indexes of the door json file and
         * only process for collision when tile exists in the index.
         * The index represents the key in `openIds` and `closedIds`
         * in doors.json file.
         */

        if (index < 0)
            // Tile does not exist.
            return false;

        return tiles.collisions[index];
    }

    public getDoor(x: number, y: number): Door | null {
        for (let i in this.doors)
            if (
                Object.prototype.hasOwnProperty.call(this.doors, i) &&
                this.doors[i].x === x &&
                this.doors[i].y === y
            )
                return this.doors[i];

        return null;
    }

    public isDoor(x: number, y: number, callback: (door: boolean) => void): void {
        this.forEachDoor((door) => {
            callback(door.x === x && door.y === y);
        });
    }

    public isClosed(door: Door): boolean {
        return this.getStatus(door) === 'closed';
    }

    private forEachDoor(callback: (door: Door) => void): void {
        _.each(this.doors, (door) => {
            callback(door);
        });
    }
}
