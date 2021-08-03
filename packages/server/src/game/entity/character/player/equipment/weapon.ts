import Items from '../../../../../util/items';
import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Weapon extends Equipment {
    public level;
    public ranged;
    public lumberjacking;
    public mining;

    public breakable = false;

    public constructor(
        name: string,
        id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        super(name, id, count, ability, abilityLevel);

        this.level = Items.getWeaponLevel(name);
        this.ranged = Items.isArcherWeapon(name);
        this.lumberjacking = Items.getLumberjackingLevel(name);
        this.mining = Items.getMiningLevel(name);
    }

    public override getBaseAmplifier(): number {
        let base = super.getBaseAmplifier();

        return base + 0.05 * this.abilityLevel;
    }

    public hasCritical(): boolean {
        return this.ability === 1;
    }

    public hasExplosive(): boolean {
        return this.ability === 4;
    }

    public hasStun(): boolean {
        return this.ability === 5;
    }

    public isRanged(): boolean {
        return this.ranged;
    }

    public setLevel(level: number): void {
        this.level = level;
    }

    public getLevel(): number {
        return this.level;
    }

    protected getType(): Modules.Equipment {
        return Modules.Equipment.Weapon;
    }
}
