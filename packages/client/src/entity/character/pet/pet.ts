import Character from '../character';

import { Modules } from '@kaetram/common/network';

import type Game from '../../../game';

export default class Pet extends Character {
    public constructor(
        instance: string,
        public owner: string,
        game: Game
    ) {
        super(instance, Modules.EntityType.Pet, game);
    }

    /**
     * Subclass implementation that prevents the animations from being set
     * to idle state while the pet is moving/following its owner.
     */

    public override idle(o?: Modules.Orientation, force = false): void {
        // If it's moving, do not idle.
        if (this.moving) return;

        super.idle(o, force);
    }
}
