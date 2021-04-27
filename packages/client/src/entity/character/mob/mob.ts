import Character from '../character';

export default class Mob extends Character {
    public hitPoints = -1;
    public maxHitPoints = -1;

    public hiddenName = false;

    public type = 'mob';

    public hasShadow(): boolean {
        return !this.hiddenName;
    }

    public drawNames(): boolean {
        return !this.hiddenName;
    }
}
