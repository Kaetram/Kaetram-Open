import Character from '../character';

export default class Mob extends Character {
    hiddenName: boolean;

    constructor(id: string, type: string) {
        super(id, type);

        this.hitPoints = -1;
        this.maxHitPoints = -1;

        this.hiddenName = false;

        this.type = 'mob';
    }

    hasShadow(): boolean {
        return !this.hiddenName;
    }

    drawNames(): boolean {
        return !this.hiddenName;
    }
}
