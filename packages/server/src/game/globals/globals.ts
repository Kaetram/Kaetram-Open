import Lights from './lights';
import Signs from './signs';
import Trees from './trees';
import Rocks from './rocks';

import type World from '../world';

/**
 * Class responsible for initializing and managing all the global objects
 * in the world.
 */

export default class Globals {
    private trees: Trees;
    private rocks: Rocks;
    private lights: Lights;
    private signs: Signs;

    public constructor(private world: World) {
        this.trees = new Trees(this.world);
        this.rocks = new Rocks(this.world);
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
     * @returns The rocks handler object.
     */

    public getRocks(): Rocks {
        return this.rocks;
    }

    /**
     * @returns Returns the signs handler object.
     */

    public getSigns(): Signs {
        return this.signs;
    }
}
