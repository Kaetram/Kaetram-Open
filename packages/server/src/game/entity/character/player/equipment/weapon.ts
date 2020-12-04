/* global module */

import Equipment from './equipment';
import Items from '../../../../../util/items';
import Modules from '../../../../../util/modules';

class Weapon extends Equipment {
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

    getBaseAmplifier() {
        let base = super.getBaseAmplifier();

        return base + 0.05 * this.abilityLevel;
    }

    hasCritical() {
        return this.ability === 1;
    }

    hasExplosive() {
        return this.ability === 4;
    }

    hasStun() {
        return this.ability === 5;
    }

    isRanged() {
        return this.ranged;
    }

    setLevel(level: number) {
        this.level = level;
    }

    getLevel() {
        return this.level;
    }

    getType() {
        return Modules.Equipment.Weapon;
    }
}

export default Weapon;
