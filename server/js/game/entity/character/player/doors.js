/* global module */

const _ = require('underscore'),
    DoorData = require('../../../../../data/doors'),
    Messages = require('../../../../network/messages'),
    Packets = require('../../../../network/packets');

class Doors {
    constructor(player) {
        const self = this;

        self.world = player.world;
        self.player = player;

        self.doors = {};

        self.load();
    }

    load() {
        const self = this;

        _.each(DoorData, door => {
            self.doors[door.id] = {
                id: door.id,
                x: door.x,
                y: door.y,
                status: door.status,
                requirement: door.requirement,
                level: door.level,
                questId: door.questId,
                closedIds: door.closedIds,
                openIds: door.openIds
            };
        });
    }

    getStatus(door) {
        const self = this;

        switch (door.requirement) {
            case 'quest':
                const quest = self.player.quests.getQuest(door.questId);

                if (door.status === 'open')
                    return door.status;

                return (quest && quest.hasDoorUnlocked(door)) ? 'open' : 'closed';

            case 'level':
                return self.player.level >= door.level ? 'open' : 'closed';
        }
    }

    getTiles(door) {
        const self = this,
            tiles = {
                indexes: [],
                data: [],
                collisions: []
            };

        const status = self.getStatus(door),
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
        const self = this,
            allTiles = {
                indexes: [],
                data: [],
                collisions: []
            };

        _.each(self.doors, door => {
            const tiles = self.getTiles(door);

            allTiles.indexes.push.apply(allTiles.indexes, tiles.indexes);
            allTiles.data.push.apply(allTiles.data, tiles.data);
            allTiles.collisions.push.apply(allTiles.collisions, tiles.collisions);
        });

        return allTiles;
    }

    hasCollision(x, y) {
        const self = this,
            tiles = self.getAllTiles(),
            tileIndex = self.world.map.gridPositionToIndex(x, y),
            index = tiles.indexes.indexOf(tileIndex) - 1;

        return index < 0 ? false : tiles.collisions[index];
    }

    getDoor(x, y, callback) {
        this.forEachDoor(door => {
            callback((door.x === x && door.y === y) ? door : null);
        });
    }

    isDoor(x, y, callback) {
        this.forEachDoor(door => {
            callback(door.x === x && door.y === y);
        });
    }

    forEachDoor(callback) {
        _.each(this.doors, door => {
            callback(door);
        });
    }
}

module.exports = Doors;
