import { Modules } from '@kaetram/common/network';

import Character from '../character';

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
