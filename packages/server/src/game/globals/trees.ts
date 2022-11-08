import _ from 'lodash-es';

import World from '../world';
import Resources from './resources';

import log from '@kaetram/common/util/log';

export default class Trees extends Resources {
    public constructor(world: World) {
        super(world, world.map.trees);
    }

    /**
     * Override for the resource loading function to display
     * debug message of how many trees were loaded.
     */

    protected override load(): void {
        super.load();

        let amount = _.size(this.resources);

        log.info(`Loaded ${amount} tree${amount > 1 ? 's' : ''}.`);
    }
}
