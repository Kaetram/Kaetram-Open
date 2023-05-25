import Sign from './impl/sign';

import log from '@kaetram/common/util/log';

import type Map from '../map/map';

export default class Signs {
    private signs: { [coordinate: string]: Sign } = {};

    public constructor(private map: Map) {
        for (let sign of this.map.signs) {
            let coordinate = `${sign.x}-${sign.y}`;

            if (!sign.text) {
                log.warning(`Sign at ${coordinate} has no text.`);

                continue;
            }

            this.signs[coordinate] = new Sign(sign.x, sign.y, sign.text.split(','));
        }

        log.info(`Loaded ${this.map.signs.length} sign${this.map.signs.length > 1 ? 's' : ''}.`);
    }

    /**
     * Grabs a sign given a provided coordinate.
     * @param coordinate Coordinate (or instance) of the sign we're trying to find.
     * @returns A sign object if found, otherwise undefined.
     */

    public get(coordinate: string): Sign {
        return this.signs[coordinate];
    }
}
