/**
 * Class used for storing hardcoded values and actions for a specific area
 * in the game.
 * @experiemntal Hardcoding regions and areas is still a work in progress.
 */

import Map from '../../map/map';
import Region from '../region';

export default class Home {
    private region: Region;
    private map: Map;

    private startRegion: string;
    private endRegion: string;

    constructor(region: Region) {
        this.region = region;
        this.map = region.map;

        this.startRegion = '0-4';
        this.endRegion = '4-10';
    }

    get(): void {
        let startPosition = this.region.getRegionBounds(this.startRegion),
            endPosition = this.region.getRegionBounds(this.endRegion),
            info = {
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
                info.data.push(this.map.data[tileIndex]);
                info.collisions.push(this.map.isColliding(x, y));
            }
    }
}
