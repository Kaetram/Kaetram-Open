/* global module */

let MapClient = require('../../../data/map/world_client');

class Home {

    /**
     * These are implementation files for the Region manager.
     * We will be using them in order to hard-code data into
     * a region that way we can send it to a player.
     * In order to create instanced regions, we will be using
     * the player's ID as an imaginary Z index. That way we
     * can reuse the exact location as many times as we need.
     * i.e. Player-1 (ID: 1529) -> 10-12-1529
     * Player-2 (ID: 3201) -> 10-12-3201
     * We then must ensure that those regions do not overlap,
     * region packets cannot be sent in-between them,
     * and no rendering is done whatsoever.
     * Because we are not messing too much with NPC location and whatnot,
     * we can trick the user into thinking they're alone.
     */

    startRegion = '0-4';
    endRegion = '4-10';

    constructor(region) {
        let self = this;

        self.region = region;
        self.map = region.map;
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