/* global module */

import _ from 'underscore';
import * as map from '../../data/map/world_server.json';

import Map from './map';

class Regions {

    map: Map;

    width: number;
    height: number;

    zoneWidth: number;
    zoneHeight: number;

    regionWidth: number;
    regionHeight: number;

    linkedRegions: {};

    constructor(map: Map) {
        this.map = map;

        this.width = this.map.width;
        this.height = this.map.height;

        this.zoneWidth = this.map.zoneWidth; // 25
        this.zoneHeight = this.map.zoneHeight; // 20

        this.regionWidth = this.map.regionWidth; // 40
        this.regionHeight = this.map.regionHeight; // 50

        this.linkedRegions = {};

        this.loadDoors();
    }

    loadDoors() {
        let doors = map.doors;

        _.each(doors, (door) => {
            let regionId = this.regionIdFromPosition(door.x, door.y),
                linkedRegionId = this.regionIdFromPosition(door.tx, door.ty),
                linkedRegionPosition = this.regionIdToPosition(linkedRegionId);

            if (regionId in this.linkedRegions)
                this.linkedRegions[regionId].push(linkedRegionPosition);
            else
                this.linkedRegions[regionId] = [linkedRegionPosition];
        });
    }

    // y y x y y
    // y y x y y
    // y x x x y
    // y y x y x
    // y y x y y

    getSurroundingRegions(id: string, offset = 1, stringFormat?: boolean) {
        let position = this.regionIdToPosition(id),
            x = position.x, y = position.y;

        let list = [];

        for (let i = -offset; i <= offset; i++) // y
            for (let j = -1; j <= 1; j++) // x
                if (i > -2 || i < 2)
                    list.push({ x: x + j, y: y + i });

        _.each(this.linkedRegions[id], (regionPosition) => {

            if (!_.any(list, (regionPosition) => {
                return regionPosition.x === x && regionPosition.y === y;
            })) list.push(regionPosition);

        });

        list = _.reject(list, (regionPosition) => {
            let gX = regionPosition.x,
                gY = regionPosition.y;

            return gX < 0 || gY < 0 || gX >= this.regionWidth || gY >= this.regionHeight;
        });

        return stringFormat ? this.regionsToCoordinates(list) : list;
    }

    getAdjacentRegions(id: string, offset: number, stringFormat?: boolean) {
        let surroundingRegions = this.getSurroundingRegions(id, offset);

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

        let centreRegion = this.regionIdToPosition(id),
            adjacentRegions = [];

        _.each(surroundingRegions, (region) => {
            if (region.x !== centreRegion.x && region.y !== centreRegion.y)
                return;

            adjacentRegions.push(region);
        });

        return stringFormat ? this.regionsToCoordinates(adjacentRegions) : adjacentRegions;
    }

    forEachRegion(callback: Function) {
        for (let x = 0; x < this.regionWidth; x++)
            for (let y = 0; y < this.regionHeight; y++)
                callback(x + '-' + y)
    }

    forEachSurroundingRegion(regionId: string, callback: Function, offset?: number) {
        if (!regionId)
            return;

        _.each(this.getSurroundingRegions(regionId, offset), (region) => {
            callback(region.x + '-' + region.y);
        });
    }

    forEachAdjacentRegion(regionId: string, callback: Function, offset?: number) {
        if (!regionId)
            return;

        _.each(this.getAdjacentRegions(regionId, offset), (region) => {
            callback(region.x + '-' + region.y);
        });
    }

    regionIdFromPosition(x: number, y: number) {
        return (Math.floor(x / this.zoneWidth) + '-' + (Math.floor(y / this.zoneHeight)));
    }

    regionIdToPosition(id: string) {
        let position = id.split('-');

        return {
            x: parseInt(position[0], 10),
            y: parseInt(position[1], 10)
        }
    }

    regionIdToCoordinates(id: string) {
        let position = id.split('-');

        return {
            x: parseInt(position[0]) * this.zoneWidth,
            y: parseInt(position[1]) * this.zoneHeight
        }
    }

    /**
     * Converts an array of regions from object type to string format.
     */
    regionsToCoordinates(regions: any) {
        let stringList = [];

        _.each(regions, (region: any) => {
            stringList.push(region.x + '-' + region.y);
        });

        return stringList;
    }

    isSurrounding(regionId: string, toRegionId: string) {
        return this.getSurroundingRegions(regionId, 1, true).indexOf(toRegionId) > -1;
    }
}

export default Regions;
