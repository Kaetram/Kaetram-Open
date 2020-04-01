import MapClient from '../../../data/map/world_client.json';

/**
 * Class used for storing hard-coded values and actions for a specific area
 * in the game.
 * @beta Hard-coding regions and areas is still a work in progress.
 */
class Home {
    public region: any;

    public startRegion: any;

    public endRegion: any;

    public map: any;

    constructor(region) {
        this.region = region;
        this.map = region.map;

        this.startRegion = '0-4';
        this.endRegion = '4-10';
    }

    get() {
        const startPosition = this.region.getRegionBounds(this.startRegion);
        const endPosition = this.region.getRegionBounds(this.endRegion);
        const info = {
            indexes: [],
            data: [],
            collisions: [],
        };

        /**
         * Clones the region we're starting off with. After which we'll be hard-coding data into it.
         */

        for (let y = startPosition.startY; y < endPosition.endY; y++) {
            for (let x = startPosition.startX; x < endPosition.endX; x++) {
                const tileIndex = this.region.gridPositionToIndex(x, y);

                info.indexes.push(tileIndex);
                info.data.push((MapClient as any).data[tileIndex]);
                info.collisions.push(this.map.isColliding(x, y));
            }
        }
    }
}

export default Home;
