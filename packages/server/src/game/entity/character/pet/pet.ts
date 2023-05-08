import Handler from './handler';

import Character from '../character';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Player from '../player/player';
import type { PetData } from '@kaetram/common/types/pet';

export default class Pet extends Character {
    private handler: Handler;

    public constructor(public owner: Player, key: string, x = owner.x, y = owner.y) {
        super(Utils.createInstance(Modules.EntityType.Pet), owner.world, key, x, y);

        this.handler = new Handler(this);
    }

    /**
     * Serializes the pet data and includes the owner and the movement speed.
     * @returns A serialized pet data object.
     */

    public override serialize(): PetData {
        return {
            ...super.serialize(),
            owner: this.owner.instance,
            movementSpeed: this.owner.movementSpeed
        };
    }
}
