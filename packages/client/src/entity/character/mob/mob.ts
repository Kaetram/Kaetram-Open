import Character from '../character';

import { Modules } from '@kaetram/common/network';

export default class Mob extends Character {
    public hiddenName = false;

    public constructor(instance: string) {
        super(instance, Modules.EntityType.Mob);
    }

    public override hasShadow(): boolean {
        return !this.hiddenName;
    }

    public override drawNames(): boolean {
        return !this.hiddenName;
    }
}
