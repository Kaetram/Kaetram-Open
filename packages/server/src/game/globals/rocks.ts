import Resources from './resources';

import log from '@kaetram/common/util/log';
import _ from 'lodash-es';

import type World from '../world';

export default class Rocks extends Resources {
    public constructor(world: World) {
        super(world, world.map.rocks);
    }

    /**
     * Override for the resource loading function to display
     * debug message of how many trees were loaded.
     */

    protected override load(): void {
        super.load();

        let amount = _.size(this.resources);

        log.info(`Loaded ${amount} rocks${amount > 1 ? 's' : ''}.`);
    }
}
