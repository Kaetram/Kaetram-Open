import Equipment from './equipment';

export default class Armour extends Equipment {
    public constructor(
        key = 'clotharmor',
        name = 'Cloth Armor',
        count = 1,
        ability = -1,
        abilityLevel = -1,
        power = 1
    ) {
        super(key, name, count, ability, abilityLevel, power);
    }

    /**
     * An override for the superclass where we specify
     * the default parameters for the key and name of the armour.
     * This will be removed once the paper-doll system
     * is improved to use a base character properly.
     */

    public override update(
        key = 'clotharmor',
        name = 'Cloth Armor',
        count = 0,
        ability = -1,
        abilityLevel = -1,
        power = 0
    ): void {
        this.key = key;
        this.name = name;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power;
    }
}
