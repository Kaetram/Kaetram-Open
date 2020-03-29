/* global module */

let _ = require('underscore'),
    map = require('../../data/map/world_server');

class Regions {

    constructor(map) {
        let self = this;

        self.map = map;

        self.width = self.map.width;
        self.height = self.map.height;

        self.zoneWidth = self.map.zoneWidth; // 25
        self.zoneHeight = self.map.zoneHeight; // 20

        self.regionWidth = self.map.regionWidth; // 40
        self.regionHeight = self.map.regionHeight; // 50

        self.linkedRegions = {};

        self.loadDoors();
    }

    loadDoors() {
        let self = this,
            doors = map.doors;

        _.each(doors, (door) => {
            let regionId = self.regionIdFromPosition(door.x, door.y),
                linkedRegionId = self.regionIdFromPosition(door.tx, door.ty),
                linkedRegionPosition = self.regionIdToPosition(linkedRegionId);

            if (regionId in self.linkedRegions)
                self.linkedRegions[regionId].push(linkedRegionPosition);
            else
                self.linkedRegions[regionId] = [linkedRegionPosition];
        });
    }

    /**
     * This is a dynamic approach for getting player regions.
     * What we are doing is building surrounding regions according
     * to the player
     */

    getDynamicRegions(player) {
        let self = this;


    }

    // y y x y y
    // y y x y y
    // y x x x y
    // y y x y x
    // y y x y y

    getSurroundingRegions(id, offset = 1, stringFormat) {
        let self = this,
            position = self.regionIdToPosition(id),
            x = position.x, y = position.y;

        let list = [], stringList = [];

        for (let i = -offset; i <= offset; i++) // y
            for (let j = -1; j <= 1; j++) // x
                if (i > -2 || i < 2)
                    list.push({ x: x + j, y: y + i });

        _.each(self.linkedRegions[id], (regionPosition) => {

            if (!_.any(list, (regionPosition) => {
                return regionPosition.x === x && regionPosition.y === y;
            })) list.push(regionPosition);

        });

        list = _.reject(list, (regionPosition) => {
            let gX = regionPosition.x,
                gY = regionPosition.y;

            return gX < 0 || gY < 0 || gX >= self.regionWidth || gY >= self.regionHeight;
        });

        return stringFormat ? self.regionsToCoordinates(list) : list;
    }

    getAdjacentRegions(id, offset, stringFormat) {
        let self = this,
            surroundingRegions = self.getSurroundingRegions(id, offset);

        /**
         * We will leave this hardcoded to surrounding areas of
         * 9 since we will not be processing larger regions at
         * the moment.
         */

        if (surroundingRegions.length !== 9)
            return;

        /**
         * 11-0 12-0 13-0
         * 11-1 12-1 13-1
         * 11-2 12-2 13-2
         */

        let centreRegion = self.regionIdToPosition(id),
            adjacentRegions = [];

        _.each(surroundingRegions, (region) => {
            if (region.x !== centreRegion.x && region.y !== centreRegion.y)
                return;

            adjacentRegions.push(region);
        });

        return stringFormat ? self.regionsToCoordinates(adjacentRegions) : adjacentRegions;
    }

    forEachRegion(callback) {
        let self = this;

        for (let x = 0; x < self.regionWidth; x++)
            for (let y = 0; y < self.regionHeight; y++)
                callback(x + '-' + y)
    }

    forEachSurroundingRegion(regionId, callback, offset) {
        let self = this;

        if (!regionId)
            return;

        _.each(self.getSurroundingRegions(regionId, offset), (region) => {
            callback(region.x + '-' + region.y);
        });
    }

    forEachAdjacentRegion(regionId, callback, offset) {
        let self = this;

        if (!regionId)
            return;

        _.each(self.getAdjacentRegions(regionId, offset), (region) => {
            callback(region.x + '-' + region.y);
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

    /**
     * Converts an array of regions from object type to string format.
     */
    regionsToCoordinates(regions) {
        let self = this,
            stringList = [];

        _.each(regions, (region) => {
            stringList.push(region.x + '-' + region.y);
        });

        return stringList;
    }

    isSurrounding(regionId, toRegionId) {
        return this.getSurroundingRegions(regionId, 1, true).indexOf(regionId) > -1;
    }
}

module.exports = Regions;
