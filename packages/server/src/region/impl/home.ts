import type Region from '../region';

interface HomeData {
    indexes: number[];
    data: number[][];
    collisions: boolean[];
}

/**
 * Class used for storing hardcoded values and actions for a specific area
 * in the game.
 * @experimental Hardcoding regions and areas is still a work in progress.
 */
export default class Home {
    private map;

    private startRegion;
    private endRegion;

    public constructor(private region: Region) {
        this.map = region.map;

        this.startRegion = '0-4';
        this.endRegion = '4-10';
    }

    private get(): void {
        let startPosition = this.region.getRegionBounds(this.startRegion),
            endPosition = this.region.getRegionBounds(this.endRegion),
            info: HomeData = {
                indexes: [],
                data: [],
                collisions: []
            };

        /**
         * Clones the region we're starting off with. After which we'll be hard-coding data into it.
         */

        for (let y = startPosition.startY; y < endPosition.endY; y++)
            for (let x = startPosition.startX; x < endPosition.endX; x++) {
                let tileIndex = this.region.gridPositionToIndex(x, y);

                info.indexes.push(tileIndex);
                info.data.push(this.map.data[tileIndex] as number[]);
                info.collisions.push(this.map.isColliding(x, y));
            }
    }
}
