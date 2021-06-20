import Character from '../character';

export default class Mob extends Character {
    public override type = 'mob';

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
