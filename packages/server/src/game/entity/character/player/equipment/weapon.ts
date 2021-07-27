import Items from '../../../../../util/items';
import * as Modules from '@kaetram/common/src/modules';
import Equipment from './equipment';

export default class Weapon extends Equipment {
    public level: number;
    public ranged: boolean;
    public lumberjacking: number;
    public mining: number;

    public breakable: boolean;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        super(name, id, count, ability, abilityLevel);

        this.level = Items.getWeaponLevel(name);
        this.ranged = Items.isArcherWeapon(name);
        this.lumberjacking = Items.getLumberjackingLevel(name);
        this.mining = Items.getMiningLevel(name);

        this.breakable = false;
    }

    override getBaseAmplifier(): number {
        let base = super.getBaseAmplifier();

        return base + 0.05 * this.abilityLevel;
    }

    hasCritical(): boolean {
        return this.ability === 1;
    }

    hasExplosive(): boolean {
        return this.ability === 4;
    }

    hasStun(): boolean {
        return this.ability === 5;
    }

    isRanged(): boolean {
        return this.ranged;
    }

    setLevel(level: number): void {
        this.level = level;
    }

    getLevel(): number {
        return this.level;
    }

    getType(): Modules.Equipment {
        return Modules.Equipment.Weapon;
    }
}
