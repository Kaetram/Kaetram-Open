import Character from '../character';

import { Modules } from '@kaetram/common/network';

import type Game from '../../../game';

export default class Mob extends Character {
    public hiddenName = false;

    public constructor(instance: string, game: Game) {
        super(instance, Modules.EntityType.Mob, game);
    }

    public override hasShadow(): boolean {
        return !this.hiddenName;
    }

    public override drawNames(): boolean {
        return !this.hiddenName;
    }
}
