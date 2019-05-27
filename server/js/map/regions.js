/* global module */

let _ = require('underscore'),
    map = require('../../data/map/world_server');

class Regions {

    constructor(map) {
        let self = this;

        self.map = map;

        self.width = self.map.width;
        self.height = self.map.height;

        self.zoneWidth = self.map.zoneWidth;
        self.zoneHeight = self.map.zoneHeight;

        self.regionWidth = self.map.regionWidth;
        self.regionHeight = self.map.regionHeight;

        self.linkedRegions = {};

        self.loadDoors();
    }

    loadDoors() {
        let self = this,
            doors = map.doors;

        _.each(doors, function(door) {
            let regionId = self.regionIdFromPosition(door.x, door.y),
                linkedRegionId = self.regionIdFromPosition(door.tx, door.ty),
                linkedRegionPosition = self.regionIdToPosition(linkedRegionId);

            if (regionId in self.linkedRegions)
                self.linkedRegions[regionId].push(linkedRegionPosition);
            else
                self.linkedRegions[regionId] = [linkedRegionPosition];
        });
    }

    getAdjacentRegions(id) {
        let self = this,
            position = self.regionIdToPosition(id),
            x = position.x, y = position.y;

        let list = [];

        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++)
                list.push({ x: x + j, y: y + i });

        _.each(self.linkedRegions[id], function(regionPosition) {

            if (!_.any(list, function(regionPosition) {
                return regionPosition.x === x && regionPosition.y === y;
            })) list.push(regionPosition);

        });

        return _.reject(list, function(regionPosition) {
            let gX = regionPosition.x,
                gY = regionPosition.y;

            return gX < 0 || gY < 0 || gX >= self.regionWidth || gY >= self.regionHeight;
        });

    }

    forEachRegion(callback) {
        let self = this;

        for (let x = 0; x < self.regionWidth; x++)
            for (let y = 0; y < self.regionHeight; y++)
                callback(x + '-' + y)
    }

    forEachAdjacentRegion(regionId, callback) {
        let self = this;

        if (!regionId)
            return;

        _.each(self.getAdjacentRegions(regionId), function(position) {
            callback(position.x + '-' + position.y);
        });
    }

    regionIdFromPosition(x, y) {
        return (Math.floor(x / this.zoneWidth) + '-' + (Math.floor(y / this.zoneHeight)));
    }

    regionIdToPosition(id) {
        let position = id.split('-');

        return {
            x: parseInt(position[0], 10),
            y: parseInt(position[1], 10)
        }
    }

    regionIdToCoordinates(id) {
        let self = this,
            position = id.split('-');

        return {
            x: parseInt(position[0]) * self.zoneWidth,
            y: parseInt(position[1]) * self.zoneHeight
        }
    }
}

module.exports = Regions;