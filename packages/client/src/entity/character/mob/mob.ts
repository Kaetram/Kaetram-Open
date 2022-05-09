import { Modules } from '@kaetram/common/network';
import Character from '../character';

export default class Mob extends Character {
    public hiddenName = false;

    public override hasShadow(): boolean {
        return !this.hiddenName;
    }

    public override drawNames(): boolean {
        return !this.hiddenName;
    }
}
