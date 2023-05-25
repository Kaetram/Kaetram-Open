import Resources from './resources';

import log from '@kaetram/common/util/log';

import type World from '../world';

export default class Foraging extends Resources {
    public constructor(world: World) {
        super(world, world.map.foraging);
    }

    /**
     * Override for the resource loading function to display
     * debug message of how many trees were loaded.
     */

    protected override load(): void {
        super.load();

        let amount = Object.keys(this.resources).length;

        log.info(`Loaded ${amount} foraging spot${amount > 1 ? 's' : ''}.`);
    }
}
