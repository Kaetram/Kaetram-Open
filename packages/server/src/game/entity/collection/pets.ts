import Collection from './collection';

import Pet from '../character/pet/pet';

import type Player from '../character/player/player';

/**
 * Pets collection class. Used for initializing and spawning pets.
 */

export default class PetCollection extends Collection<Pet> {
    public createEntity(params: { owner: Player; key: string; x: number; y: number }): Pet {
        return new Pet(params.owner, params.key, params.x, params.y);
    }
}
