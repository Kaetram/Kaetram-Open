import { Stats, Bonuses } from '@kaetram/common/types/item';

export default abstract class Equipment {
    public attackStats: Stats = {
        crush: 0,
        slash: 0,
        stab: 0,
        magic: 0
    };

    public defenseStats: Stats = {
        crush: 0,
        slash: 0,
        stab: 0,
        magic: 0
    };

    public bonuses: Bonuses = {
        dexterity: 0,
        strength: 0,
        archery: 0
    };

    public constructor(
        public key = '',
        public name = '',
        public count = 0,
        public ability = -1,
        public abilityLevel = -1,
        public ranged = false
    ) {}

    /**
     * An update function that is called when the equipment is equipped.
     * The function can be called with no parameters when the equipment is unequipped.
     * @param key The key of the item.
     * @param name The visual name of the item (the one the player sees).
     * @param count The amount of items in the equipment (if it is stackable).
     * @param ability The ability that the item gives.
     * @param abilityLevel The level of the ability.
     * @param ranged Whether or not the item is ranged.
     * @param attackStats The attack stats of the item.
     * @param defenseStats The defense stats of the item.
     * @param bonuses The bonuses of the item.
     */

    public update(
        key = '',
        name = '',
        count = 0,
        ability = -1,
        abilityLevel = -1,
        ranged = false,
        attackStats?: Stats,
        defenseStats?: Stats,
        bonuses?: Bonuses
    ): void {
        this.key = key;
        this.name = name;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.ranged = ranged;

        // Add the stats and bonuses only if they exist.
        if (attackStats) this.attackStats = attackStats;
        if (defenseStats) this.defenseStats = defenseStats;
        if (bonuses) this.bonuses = bonuses;
    }

    /**
     * A check for whether or not the item is equipped.
     * @returns Whether the key is an empty string or not.
     */

    public exists(): boolean {
        return this.key !== '';
    }
}
