import World from '../world';

import Lights from './lights';
import Signs from './signs';
import Trees from './trees';

/**
 * Class responsible for initializing and managing all the global objects
 * in the world.
 */

export default class Globals {
    private trees: Trees;
    private lights: Lights;
    private signs: Signs;

    public constructor(private world: World) {
        this.trees = new Trees(this.world);
        this.lights = new Lights(this.world.map);
        this.signs = new Signs(this.world.map);
    }

    /**
     * @returns The trees handler object.
     */

    public getTrees(): Trees {
        return this.trees;
    }

    /**
     * @returns Returns the signs handler object.
     */

    public getSigns(): Signs {
        return this.signs;
    }
}
