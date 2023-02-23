import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

import type Item from '../../../../objects/item';
import type { EquipmentData } from '@kaetram/common/types/equipment';
import type { Enchantments } from '@kaetram/common/types/item';

export default class Weapon extends Equipment {
    public attackRate: number = Modules.Defaults.ATTACK_RATE;
    public attackStyle: number = Modules.AttackStyle.None;
    public projectileName = '';
    public attackRange = 1;
    public lumberjacking = -1;
    public mining = -1;
    public manaCost = 0;

    // Default values for resetting variables when changing attack styles.
    public defaultAttackRange = 1;
    public defaultAttackRate: number = Modules.Defaults.ATTACK_RATE;

    // Weapon type
    private archer = false;
    private magic = false;
    private attackStyles: Modules.AttackStyle[] = [];

    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Weapon, key, count, enchantments);
    }

    /**
     * Override function that adds the equipment's power level.
     * @param item The item to update the equipment with.
     * @param attackStyle The attack style of the weapon.
     */

    public override update(item: Item, attackStyle?: Modules.AttackStyle): void {
        super.update(item);

        this.attackRange = item.attackRange;
        this.defaultAttackRange = item.attackRange;
        this.attackRate = item.attackRate;
        this.attackStyles = item.getAttackStyles();
        this.lumberjacking = item.lumberjacking;
        this.mining = item.mining;
        this.poisonous = item.poisonous;
        this.projectileName = item.projectileName;
        this.manaCost = item.manaCost;

        this.archer = item.isArcherWeapon();
        this.magic = item.isMagicWeapon();

        /**
         * If a parameter is provided (generally the last used attack style for the weapon type)
         * then we will use that, otherwise we will use the first attack style in the array.
         */

        if (attackStyle) this.updateAttackStyle(attackStyle);
        else this.updateAttackStyle(this.attackStyles[0]);
    }

    /**
     * Override function that resets the weapon's archery and magic properties.
     */

    public override empty(): void {
        super.empty();

        // Reset the weapon-specific properties
        this.attackStyles = [];
        this.attackRange = 1;
        this.lumberjacking = -1;
        this.mining = -1;
        this.archer = false;
        this.magic = false;

        // Attack styles
        this.updateAttackStyle(Modules.AttackStyle.None);
    }

    /**
     * Updates the attack style of the weapon.
     * @param attackStyle The new attack style of the weapon.
     */

    public updateAttackStyle(attackStyle: Modules.AttackStyle): void {
        this.attackStyle = attackStyle;

        // Rapid attack style boosts attack speed by 15%
        this.attackRate =
            attackStyle === Modules.AttackStyle.Fast
                ? this.defaultAttackRate * 0.85
                : this.defaultAttackRate;

        // Not applicable for ranged weapons.
        if (!this.archer && !this.magic) return;

        // Long range boosts attack range by 2 for bows and magic weapons
        this.attackRange =
            attackStyle === Modules.AttackStyle.LongRange
                ? this.defaultAttackRange + 2
                : this.defaultAttackRange;
    }

    /**
     * A weapon is a strength-based weapon when its strength bonus is greater than 0.
     * @returns Whether or not the weapon's strength bonus is greater than 0.
     */

    public isStrength(): boolean {
        return this.bonuses.strength > 0;
    }

    /**
     * A weapon is a accuracy based weapon when its accuracy bonus is greater than 0.
     * @returns Whether or not the weapon's accuracy bonus is above 0.
     */

    public isAccuracy(): boolean {
        return this.bonuses.accuracy > 0;
    }

    /**
     * @returns Whether or not the weapon is an archer-based weapon.
     */

    public isArcher(): boolean {
        return this.archer;
    }

    /**
     * Weapons that have a magic bonus are magic-based weapons.
     * @returns Whether or not the weapon is a magic-based weapon.
     */

    public isMagic(): boolean {
        return this.magic;
    }

    /**
     * Checks if the item is a lumberjacking item. Lumberjacking items are
     * defined by equipments that have a lumberjacking value greater than 0.
     * @returns If the lumberjacking attribute is greater than 0.
     */

    public isLumberjacking(): boolean {
        return this.lumberjacking > 0;
    }

    /**
     * Whether or not this weapon can be used for mining.
     * @returns Whether the mining weapon level is greater than 0.
     */

    public isMining(): boolean {
        return this.mining > 0;
    }

    /**
     * Checks whether the weapon contains the attack style.
     * @param attackStyle The attack style to check for.
     * @returns Whether or not the attack style is included in the weapon's attack styles.
     */

    public hasAttackStyle(attackStyle: Modules.AttackStyle): boolean {
        return this.attackStyles.includes(attackStyle);
    }

    /**
     * Override for the superclass where we add the attack styles.
     * @param clientInfo Whether or not to send the client information.
     */

    public override serialize(clientInfo = false): EquipmentData {
        let data = super.serialize(clientInfo);

        data.attackStyle = this.attackStyle;

        // Include additional properties to be sent to the client.
        if (clientInfo) {
            data.attackRange = this.attackRange;
            data.attackStyles = this.attackStyles;
        }

        return data;
    }
}
