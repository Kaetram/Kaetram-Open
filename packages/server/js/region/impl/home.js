/* global module */

/**
 * Class used for storing hardcoded values and actions for a specific area
 * in the game.
 * @experiemntal Hardcoding regions and areas is still a work in progress.
 */

class Home {

    constructor(region) {
        this.region = region;
        this.map = region.map;
        this.clientMap = this.map.clientMap;

        this.startRegion = '0-4';
        this.endRegion = '4-10';
    }

    get() {
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

        for (let y = startPosition.startY; y < endPosition.endY; y++) {
            for (let x = startPosition.startX; x < endPosition.endX; x++) {
                let tileIndex = this.region.gridPositionToIndex(x, y);

                info.indexes.push(tileIndex);
                info.data.push(this.clientMap.data[data]);
                info.collisions.push(this.map.isColliding(x, y));
            }
        }
    }
}

module.exports = Home;
