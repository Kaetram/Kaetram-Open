export default abstract class Equipment {
    public constructor(
        public key = '',
        public name = '',
        public count = 0,
        public ability = -1,
        public abilityLevel = -1,
        public power = 0,
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
     * @param power The power of the item (generally used as a power indicator in the UI).
     */

    public update(
        key = '',
        name = '',
        count = 0,
        ability = -1,
        abilityLevel = -1,
        power = 0,
        ranged = false
    ): void {
        this.key = key;
        this.name = name;
        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;
        this.power = power;
        this.ranged = ranged;
    }

    /**
     * A check for whether or not the item is equipped.
     * @returns Whether the key is an empty string or not.
     */

    public exists(): boolean {
        return this.key !== '';
    }
}
