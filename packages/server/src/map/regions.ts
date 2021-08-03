import _ from 'lodash';

import type Map from './map';

export default class Regions {
    private width;
    private height;

    private regionWidth;
    private regionHeight;

    private linkedRegions: { [id: string]: Pos[] } = {};

    public constructor(private map: Map) {
        this.width = map.width;
        this.height = map.height;

        this.regionWidth = map.regionWidth;
        this.regionHeight = map.regionHeight;

        this.loadDoors();
    }

    private loadDoors(): void {
        let { doors } = this.map;

        _.each(doors, (door) => {
            let regionId = this.regionIdFromPosition(door.x, door.y),
                linkedRegionId = this.regionIdFromPosition(door.x, door.y), //? tx, ty
                linkedRegionPosition = this.regionIdToPosition(linkedRegionId);

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

    private getSurroundingRegions<StringFormat = false>(
        id: string,
        offset = 1,
        stringFormat?: StringFormat
    ): (StringFormat extends true ? string : Pos)[] {
        let position = this.regionIdToPosition(id),
            { x } = position,
            { y } = position,
            list: Pos[] = [];

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
                if (i > -2 || i < 2) list.push({ x: x + j, y: y + i });

        _.each(this.linkedRegions[id], (regionPosition) => {
            if (
                !_.some(list, (regionPosition) => {
                    return regionPosition.x === x && regionPosition.y === y;
                })
            )
                list.push(regionPosition);
        });

        list = _.reject(list, (regionPosition) => {
            let gX = regionPosition.x,
                gY = regionPosition.y;

            return gX < 0 || gY < 0 || gX >= this.regionWidth || gY >= this.regionHeight;
        });

        return (stringFormat ? this.regionsToCoordinates(list) : list) as never;
    }

    private getAdjacentRegions<StringFormat = false>(
        id: string,
        offset?: number,
        stringFormat?: StringFormat
    ): (StringFormat extends true ? string : Pos)[] | undefined {
        let surroundingRegions = this.getSurroundingRegions(id, offset);

        /**
         * We will leave this hardcoded to surrounding areas of
         * 9 since we will not be processing larger regions at
         * the moment.
         */

        if (surroundingRegions.length !== 9) return;

        /**
         * 11-0 12-0 13-0
         * 11-1 12-1 13-1
         * 11-2 12-2 13-2
         */

        let centreRegion = this.regionIdToPosition(id),
            adjacentRegions: Pos[] = [];

        _.each(surroundingRegions, (region) => {
            if (region.x !== centreRegion.x && region.y !== centreRegion.y) return;

            adjacentRegions.push(region);
        });

        return (
            stringFormat ? this.regionsToCoordinates(adjacentRegions) : adjacentRegions
        ) as never;
    }

    public forEachRegion(callback: (region: string) => void): void {
        for (let x = 0; x < this.regionWidth; x++)
            for (let y = 0; y < this.regionHeight; y++) callback(`${x}-${y}`);
    }

    public forEachSurroundingRegion(
        regionId: string | null,
        callback: (region: string) => void,
        offset?: number
    ): void {
        if (!regionId) return;

        _.each(this.getSurroundingRegions(regionId, offset), (region) => {
            callback(`${region.x}-${region.y}`);
        });
    }

    public forEachAdjacentRegion(
        regionId: string,
        callback: (region: string) => void,
        offset?: number
    ): void {
        if (!regionId) return;

        _.each(this.getAdjacentRegions(regionId, offset), (region) => {
            callback(`${region.x}-${region.y}`);
        });
    }

    public regionIdFromPosition(x: number, y: number): string {
        return `${Math.floor(x / this.regionWidth)}-${Math.floor(y / this.regionHeight)}`;
    }

    private regionIdToPosition(id: string): Pos {
        let position = id.split('-');

        return {
            x: parseInt(position[0], 10),
            y: parseInt(position[1], 10)
        };
    }

    public regionIdToCoordinates(id: string): Pos {
        let position = id.split('-');

        return {
            x: parseInt(position[0]) * this.regionWidth,
            y: parseInt(position[1]) * this.regionHeight
        };
    }

    /**
     * Converts an array of regions from object type to string format.
     */
    private regionsToCoordinates(regions: Pos[]): string[] {
        let stringList: string[] = [];

        _.each(regions, (region) => {
            stringList.push(`${region.x}-${region.y}`);
        });

        return stringList;
    }

    public isSurrounding(regionId: string | null, toRegionId: string): boolean {
        if (!regionId || !toRegionId) return false;

        return this.getSurroundingRegions(regionId, 1, true).includes(toRegionId);
    }
}
