/* global module */

let MapClient = require('../../../data/map/world_client');

/**
 * Class used for storing hardcoded values and actions for a specific area
 * in the game.
 * @experiemntal Hardcoding regions and areas is still a work in progress.
 */

class Home {

    constructor(region) {
        let self = this;

        self.region = region;
        self.map = region.map;

        self.startRegion = '0-4';
        self.endRegion = '4-10';
    }

    get() {
        let self = this,
            startPosition = self.region.getRegionBounds(self.startRegion),
            endPosition = self.region.getRegionBounds(self.endRegion),
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
                let tileIndex = self.region.gridPositionToIndex(x, y);

                info.indexes.push(tileIndex);
                info.data.push(MapClient.data[data]);
                info.collisions.push(self.map.isColliding(x, y));
            }
        }
    }
}

module.exports = Home;
