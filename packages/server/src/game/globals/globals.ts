import Lights from './lights';
import Signs from './signs';

import type World from '../world';

/**
 * Class responsible for initializing and managing all the global objects
 * in the world.
 */

export default class Globals {
    private lights: Lights;
    private signs: Signs;

    public constructor(private world: World) {
        this.lights = new Lights(this.world.map);
        this.signs = new Signs(this.world.map);
    }

    /**
     * @returns Returns the signs handler object.
     */

    public getSigns(): Signs {
        return this.signs;
    }
}
