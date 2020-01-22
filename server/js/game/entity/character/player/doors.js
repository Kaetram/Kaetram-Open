/* global module */

let _ = require('underscore'),
    DoorData = require('../../../../../data/doors'),
    Messages = require('../../../../network/messages'),
    Packets = require('../../../../network/packets'),
    config = require('../../../../../config');

class Doors {

    constructor(player) {
        let self = this;

        self.world = player.world;
        self.player = player;
        self.map = self.world.map;
        self.regions = self.map.regions;

        self.doors = {};

        self.load();
    }

    load() {
        let self = this;

        _.each(DoorData, (door) => {
            self.doors[door.id] = {
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
            }
        });

    }

    getStatus(door) {
        let self = this;

        if (door.status)
            return door.status;

        if (config.offlineMode)
            return true;

        switch(door.requirement) {

            case 'quest':
                let quest = self.player.quests.getQuest(door.questId);

                return (quest && quest.hasDoorUnlocked(door)) ? 'open' : 'closed';

            case 'achievement':
                let achievement = self.player.quests.achievements[door.achievementId];

                return (achievement && achievement.isFinished()) ? 'open' : 'closed';

            case 'level':
                return self.player.level >= door.level ? 'open' : 'closed';

        }
    }

    getTiles(door) {
        let self = this,
            tiles = {
                indexes: [],
                data: [],
                collisions: []
            };

        let status = self.getStatus(door),
            doorState = {
            open: door.openIds,
            closed: door.closedIds
        };

        _.each(doorState[status], (value, key) => {
            tiles.indexes.push(parseInt(key));
            tiles.data.push(value.data);
            tiles.collisions.push(value.isColliding);
        });

        return tiles;
    }

    getAllTiles() {
        let self = this,
            allTiles = {
                indexes: [],
                data: [],
                collisions: []
            };

        _.each(self.doors, (door) => {
            /* There's no need to send dynamic data if the player is not nearby. */
            let doorRegion = self.regions.regionIdFromPosition(door.x, door.y);

            if (!self.regions.isAdjacent(self.player.region, doorRegion))
                return;

            let tiles = self.getTiles(door);

            allTiles.indexes.push.apply(allTiles.indexes, tiles.indexes);
            allTiles.data.push.apply(allTiles.data, tiles.data);
            allTiles.collisions.push.apply(allTiles.collisions, tiles.collisions)
        });

        return allTiles;
    }

    hasCollision(x, y) {
        let self = this,
            tiles = self.getAllTiles(),
            tileIndex = self.world.map.gridPositionToIndex(x, y),
            index = tiles.indexes.indexOf(tileIndex) - 1 ;

        return index < 0 ? false : tiles.collisions[index];
    }
    getDoor(x, y, callback) {
        this.forEachDoor((door) => {
            callback((door.x === x && door.y === y) ? door : null);
        })
    }

    isDoor(x, y, callback) {
        this.forEachDoor((door) => {
            callback(door.x === x && door.y === y);
        });
    }

    forEachDoor(callback) {
        _.each(this.doors, (door) => {
            callback(door);
        })
    }

}

module.exports = Doors;
