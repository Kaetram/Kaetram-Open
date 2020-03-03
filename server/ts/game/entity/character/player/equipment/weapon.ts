/** @format */

import Equipment from './equipment';
import Items from '../../../../../util/items';
import Modules from '../../../../../util/modules';

class Weapon extends Equipment {
    public abilityLevel: any;
    public ability: any;
    public ranged: any;
    public level: any;
    breakable: boolean;

    constructor(name, id, count, ability, abilityLevel) {
        super(name, id, count, ability, abilityLevel);

        this.level = Items.getWeaponLevel(name);
        this.ranged = Items.isArcherWeapon(name);

        this.breakable = false;
    }

    getBaseAmplifier() {
        const base = super.getBaseAmplifier();

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

    setLevel(level) {
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
