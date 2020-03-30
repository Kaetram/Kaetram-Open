import * as _ from 'underscore';
import map from '../../data/map/world_server.json';

/**
 *
 */
class Regions {
    public zoneWidth: any;

    public zoneHeight: any;

    public linkedRegions: any;

    public regionWidth: any;

    public regionHeight: any;

    map: any;

    width: any;

    height: any;

    constructor(map) {
        this.map = map;

        this.width = this.map.width;
        this.height = this.map.height;

        this.zoneWidth = this.map.zoneWidth;
        this.zoneHeight = this.map.zoneHeight;

        this.regionWidth = this.map.regionWidth;
        this.regionHeight = this.map.regionHeight;

        this.linkedRegions = {};

        this.loadDoors();
    }

    loadDoors() {
        const { doors } = map;

        _.each(doors, (door) => {
            const regionId = this.regionIdFromPosition(door.x, door.y);
            const linkedRegionId = this.regionIdFromPosition(door.tx, door.ty);
            const linkedRegionPosition = this.regionIdToPosition(
                linkedRegionId
            );

            if (regionId in this.linkedRegions)
                this.linkedRegions[regionId].push(linkedRegionPosition);
            else this.linkedRegions[regionId] = [linkedRegionPosition];
        });
    }

    // y y x y y
    // y y x y y
    // y x x x y
    // y y x y x
    // y y x y y

    getAdjacentRegions(id, offset = 1, stringFormat?) {
        const position = this.regionIdToPosition(id);
        const { x } = position;
        const { y } = position;

        const list = [];

        for (
            let i = -offset;
            i <= offset;
            i++ // y
        )
            for (
                let j = -1;
                j <= 1;
                j++ // x
            )
                if (i > -2 || i < 2)
                    list.push(
                        stringFormat
                            ? `${x + j}-${y + i}`
                            : { x: x + j, y: y + i }
                    );

        _.each(this.linkedRegions[id], (regionPosition) => {
            if (
                !_.any(list, (regionPosition) => {
                    return regionPosition.x === x && regionPosition.y === y;
                })
            )
                list.push(regionPosition);
        });

        return _.reject(list, (regionPosition) => {
            const gX = regionPosition.x;
            const gY = regionPosition.y;

            return (
                gX < 0 ||
                gY < 0 ||
                gX >= this.regionWidth ||
                gY >= this.regionHeight
            );
        });
    }

    forEachRegion(callback) {
        for (let x = 0; x < this.regionWidth; x++)
            for (let y = 0; y < this.regionHeight; y++) callback(`${x}-${y}`);
    }

    forEachAdjacentRegion(regionId, callback, offset) {
        if (!regionId) return;

        _.each(this.getAdjacentRegions(regionId, offset), (position) => {
            callback(`${position.x}-${position.y}`);
        });
    }

    regionIdFromPosition(x, y) {
        return `${Math.floor(x / this.zoneWidth)}-${Math.floor(
            y / this.zoneHeight
        )}`;
    }

    regionIdToPosition(id) {
        const position = id.split('-');

        return {
            x: parseInt(position[0], 10),
            y: parseInt(position[1], 10)
        };
    }

    regionIdToCoordinates(id) {
        const position = id.split('-');

        return {
            x: parseInt(position[0]) * this.zoneWidth,
            y: parseInt(position[1]) * this.zoneHeight
        };
    }

    isAdjacent(regionId, toRegionId) {
        return (
            this.getAdjacentRegions(regionId, 1, true).indexOf(regionId) > -1
        );
    }
}

export default Regions;
