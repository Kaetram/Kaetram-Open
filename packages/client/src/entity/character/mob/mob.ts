import { Modules } from '@kaetram/common/network';
import Character from '../character';

export default class Mob extends Character {
    public override type = Modules.EntityType.Mob;

    // public hitPoints = -1;
    // public maxHitPoints = -1;

    public hiddenName = false;

    public override hasShadow(): boolean {
        return !this.hiddenName;
    }

    public override drawNames(): boolean {
        return !this.hiddenName;
    }
}
