import rawData from '../../../../data/items.json';
import Entity from '../entity';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import PluginIndex from '@kaetram/server/data/plugins/items';

import type { EntityData } from '@kaetram/common/types/entity';
import type { Bonuses, Enchantments, ItemData, Stats } from '@kaetram/common/types/item';
import type { Plugin } from '@kaetram/server/data/plugins/items';
import type Player from '../character/player/player';

interface RawData {
    [key: string]: ItemData;
}

export default class Item extends Entity {
    private data: ItemData;

    // Item Data
    private itemType = 'object'; // weapon, armour, pendant, etc.
    public stackable = false;
    public edible = false;
    public maxStackSize = 1; // Default max stack size.
    public plugin: Plugin | undefined;

    // Store variables
    public price = -2;
    public storeCount = -1;

    // Requirement for equipping the item.
    private level = -1;
    private skill = '';
    private achievement = '';
    private quest = '';

    // Points usage
    public manaCost = 0;

    // Item information
    public description = '';
    public projectileName = 'projectile-arrow';

    // Equipment variables
    public attackRate: number = Modules.Defaults.ATTACK_RATE;
    public poisonous = false;
    public weaponType = '';

    // Stats
    public attackStats: Stats = Utils.getEmptyStats();
    public defenseStats: Stats = Utils.getEmptyStats();

    // Bonuses
    public bonuses: Bonuses = Utils.getEmptyBonuses();

    // Miscellaneous variables
    public movementModifier = -1;
    public stockAmount?: number; // Used for stores to increase count by this amount.
    public maxCount = -1; // Used for stores to know maximum limit.
    public lumberjacking = -1;
    public mining = -1;
    public attackRange = 1;

    public exists = true;
    public undroppable = false;

    private respawnDelay = Modules.ItemDefaults.RESPAWN_DELAY;
    private despawnDuration = Modules.ItemDefaults.DESPAWN_DURATION;
    private blinkDelay = Modules.ItemDefaults.BLINK_DELAY;

    private blinkTimeout: NodeJS.Timeout | null = null;
    private despawnTimeout: NodeJS.Timeout | null = null;

    private blinkCallback?(): void;
    private respawnCallback?(): void;
    private despawnCallback?(): void;

    public constructor(
        key: string,
        x: number,
        y: number,
        public dropped = false,
        public count = -1,
        public enchantments: Enchantments = {},
        public owner = ''
    ) {
        super(Utils.createInstance(Modules.EntityType.Item), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[Item] Could not find data for ${key}.`);
            this.exists = false;
            return;
        }

        // Set all the item data (set defaults if value doesn't exist).
        this.itemType = this.data.type;
        this.key = this.data.spriteName || this.key;
        this.name = this.data.name;
        this.stackable = this.data.stackable || this.stackable;
        this.edible = this.data.edible || this.edible;
        this.maxStackSize = this.getMaxStackSize(this.data.maxStackSize);
        this.price = this.data.price || this.price;
        this.storeCount = this.data.storeCount || this.storeCount;
        this.level = this.data.level || this.level;
        this.skill = this.data.skill || this.skill;
        this.attackStats = this.data.attackStats || this.attackStats;
        this.defenseStats = this.data.defenseStats || this.defenseStats;
        this.bonuses = this.data.bonuses || this.bonuses;
        this.attackRate = this.data.attackRate || this.attackRate;
        this.poisonous = this.data.poisonous || this.poisonous;
        this.movementModifier = this.data.movementModifier || this.movementModifier;
        this.lumberjacking = this.data.lumberjacking || this.lumberjacking;
        this.mining = this.data.mining || this.mining;
        this.undroppable = this.data.undroppable || this.undroppable;
        this.respawnDelay = this.data.respawnDelay || this.respawnDelay;
        this.attackRange = this.data.attackRange || this.getDefaultAttackRange();
        this.projectileName = this.data.projectileName || this.projectileName;
        this.description = this.data.description || this.description;
        this.manaCost = this.data.manaCost || this.manaCost;
        this.weaponType = this.data.weaponType || this.weaponType;

        if (this.data.plugin) this.loadPlugin();
    }

    /**
     * Initializes the plugin for an item. Checks if the item plugin key provided
     * in the configuration file exists as an actual plugin.
     */

    private loadPlugin(): void {
        if (!(this.data.plugin! in PluginIndex)) {
            log.error(`[Item] Could not find plugin ${this.data.plugin}.`);
            return;
        }

        this.plugin = new PluginIndex[this.data.plugin! as keyof typeof PluginIndex](this.data);
    }

    /**
     * Copies an item and returns a clone of it.
     * @returns A copy of the item and all its properties
     */

    public copy(): this {
        return new Item(
            this.key,
            this.x,
            this.y,
            this.dropped,
            this.count,
            this.enchantments,
            this.owner
        ) as this;
    }

    /**
     * Clears all the timeouts and attempts
     * to respawn the item if it's static.
     */

    public destroy(): void {
        clearTimeout(this.blinkTimeout!);
        clearTimeout(this.despawnTimeout!);

        if (!this.dropped) this.respawn();
    }

    /**
     * Despawns an item. If forcibly despawned it jumps straight
     * to the despawn callback, otherwise it runs through the blink
     * timeout then despawn timeout. The blink/despawn combo
     * applies to items that are dropped.
     * @param noTimeout Indicates if to foricbly despawn the item.
     */

    public despawn(noTimeout = false): void {
        if (noTimeout) return this.despawnCallback?.();

        this.blinkTimeout = setTimeout(() => {
            this.blinkCallback?.();

            // Clear the owner of the item when it starts blinking.
            this.owner = '';

            this.despawnTimeout = setTimeout(() => this.despawnCallback?.(), this.despawnDuration);
        }, this.blinkDelay);
    }

    /**
     * Sends the respawn callback signal after `respawnDelay` milliseconds pass.
     */

    public respawn(): void {
        setTimeout(() => this.respawnCallback?.(), this.respawnDelay);
    }

    /**
     * Checks whether or not the player can equip the current item.
     * @param player The player we are checking the level of and sending notifications to.
     * @returns Whether or not the player can equip the item.
     */

    public canEquip(player: Player): boolean {
        let requirement = this.getRequirement();

        /**
         * If the item has a skill requirement we check the existence
         * of that skill and compare the level against the requirement.
         */

        if (this.skill) {
            let skill = player.skills.get(Utils.getSkill(this.skill));

            // Separate conditional if skill exists.
            if (skill)
                if (skill.level < requirement) {
                    // If the player's skill level is less than the requirement.
                    player.notify(
                        `Your ${skill.name} level must be at least ${requirement} to equip this item.`
                    );
                    return false;
                } else return true; // If the player's skill fulfills the requirement.
        }

        // Default to using the total level for the requirement.
        if (player.level < requirement) {
            player.notify(`Your total level must be at least ${requirement} to equip this item.`);
            return false;
        }

        // Check if the item has an achievement requirement and if it is completed.
        if (this.achievement && !player.achievements.get(this.achievement)?.isFinished()) {
            player.notify(`This item requires a secret achievement to wield.`);
            return false;
        }

        // If an item has a quest requirement, we check it here.
        if (this.quest) {
            let quest = player.quests.get(this.quest);

            // Send an error if the quest cannot be found.
            if (!quest) {
                log.error(`[Item: ${this.key}] Could not find quest ${this.quest}.`);
                return false;
            }

            // Check if the quest is finished.
            if (!quest.isFinished()) {
                player.notify(`You must complete ${quest.name} to wield this item.`);
                return false;
            }
        }

        return true;
    }

    /**
     * Returns the type of equipment the item classifies as.
     * @returns Equipment type from Modules.
     */

    public getEquipmentType(): Modules.Equipment {
        switch (this.itemType) {
            case 'armour':
            case 'armourarcher': {
                return Modules.Equipment.Armour;
            }

            case 'armourskin': {
                return Modules.Equipment.ArmourSkin;
            }

            case 'weapon':
            case 'weaponarcher':
            case 'weaponmagic': {
                return Modules.Equipment.Weapon;
            }

            case 'weaponskin': {
                return Modules.Equipment.WeaponSkin;
            }

            case 'pendant': {
                return Modules.Equipment.Pendant;
            }

            case 'boots': {
                return Modules.Equipment.Boots;
            }

            case 'ring': {
                return Modules.Equipment.Ring;
            }

            case 'arrow': {
                return Modules.Equipment.Arrows;
            }
        }

        return -1;
    }

    /**
     * Grabs the weapon requirement level for the current item object.
     * @returns The weapon requirement level in a number format.
     */

    public getRequirement(): number {
        if (this.level !== -1) return this.level;

        return 0;
    }

    /**
     * @returns The description of the item.
     */

    public getDescription(): string {
        return this.description;
    }

    /**
     * Extracts the max stack size of an item based on the type of item
     * and whether it has a specified max stack size in the configuration.
     * @param maxStackSize The maximum stack size from the configuration.
     */

    public getMaxStackSize(maxStackSize?: number): number {
        if (this.stackable) return maxStackSize || Modules.Constants.MAX_STACK;

        return this.maxStackSize;
    }

    /**
     * @returns The default attack range for an item if none is specified in the configuraiton.
     */

    private getDefaultAttackRange(): number {
        return this.isArcherWeapon() ? Modules.Constants.ARCHER_ATTACK_RANGE : this.attackRange;
    }

    /**
     * Depending on the weapon attack type, we determine
     * which attack styles apply to the item.
     * @return A list of attack styles that apply to the item.
     */

    public getAttackStyles(): Modules.AttackStyle[] {
        // Why would you want to attack with a non-weapon?
        if (!this.isWeapon()) return [];

        // If the item has a specified attack style, we use that.
        switch (this.weaponType) {
            case 'sword': {
                return [
                    Modules.AttackStyle.Stab,
                    Modules.AttackStyle.Slash,
                    Modules.AttackStyle.Crush,
                    Modules.AttackStyle.Defensive
                ];
            }

            case 'bigsword': {
                return [
                    Modules.AttackStyle.Slash,
                    Modules.AttackStyle.Crush,
                    Modules.AttackStyle.Defensive
                ];
            }

            case 'axe': {
                return [
                    Modules.AttackStyle.Hack,
                    Modules.AttackStyle.Chop,
                    Modules.AttackStyle.Defensive
                ];
            }

            case 'pickaxe': {
                return [Modules.AttackStyle.Stab, Modules.AttackStyle.Defensive];
            }

            case 'club': {
                return [Modules.AttackStyle.Crush, Modules.AttackStyle.Defensive];
            }

            case 'spear': {
                return [
                    Modules.AttackStyle.Stab,
                    Modules.AttackStyle.Slash,
                    Modules.AttackStyle.Defensive
                ];
            }

            case 'bow': {
                return [
                    Modules.AttackStyle.Accurate,
                    Modules.AttackStyle.Fast,
                    Modules.AttackStyle.LongRange
                ];
            }

            case 'staff': {
                return [Modules.AttackStyle.Focused, Modules.AttackStyle.LongRange];
            }
        }

        return [];
    }

    /**
     * @param id The enchantment id we are checking for.
     * @returns Whether or not the item has the enchantment.
     */

    public hasEnchantment(id: Modules.Enchantment): boolean {
        return id in this.enchantments;
    }

    /**
     * Check if the item is owned by the player. An item owned by the player
     * can only be picked up by that player. Once the item starts blinking,
     * its ownership is renounced.
     * @param username Username of the player we are checking the ownership of.
     * @returns Whether or not the item is owned by the player.
     */

    public isOwner(username: string): boolean {
        if (!this.owner) return true;

        return this.owner === username;
    }

    /**
     * Checks if the item is equippable by comparing the type
     * against all the equippable items. Will probably be
     * rewritten for compactness in the future.
     * @returns If the item is equippable or not.
     */

    public isEquippable(): boolean {
        return (
            this.itemType === 'armour' ||
            this.itemType === 'armourarcher' ||
            this.itemType === 'armourskin' ||
            this.itemType === 'weapon' ||
            this.itemType === 'weaponarcher' ||
            this.itemType === 'weaponmagic' ||
            this.itemType === 'weaponskin' ||
            this.itemType === 'pendant' ||
            this.itemType === 'boots' ||
            this.itemType === 'ring' ||
            this.itemType === 'arrow'
        );
    }

    /**
     * @returns Whether or not the item is a weapon.
     */

    public isWeapon(): boolean {
        return this.itemType.includes('weapon');
    }

    /**
     * Verifies whether or not the weapon is an archer weapon. We use this
     * to default an attack range for range combat.
     * @returns If the itemType is of type `weaponarcher`.
     */

    public isArcherWeapon(): boolean {
        return this.itemType === 'weaponarcher';
    }

    /**
     * @returns Whether or not the weapon is a magic-based weapon.
     */

    public isMagicWeapon(): boolean {
        return this.itemType === 'weaponmagic';
    }

    /**
     * Sets an enchantment onto an item or updates the level if it already exists.
     * @param id The id of the enchantment.
     * @param level The level of the enchantment.
     */

    public setEnchantment(id: Modules.Enchantment, level: number): void {
        this.enchantments[id] = { level };
    }

    /**
     * Expands on the entity serialization and
     * adds item specific variables (count and enchantments).
     * @returns EntityData containing item information.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.count = this.count;
        data.enchantments = this.enchantments;

        return data;
    }

    /**
     * Callback signal for when the item respawns.
     */

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    /**
     * Callback signal for when the item starts
     * blinking (signaling upcoming despawn).
     */

    public onBlink(callback: () => void): void {
        this.blinkCallback = callback;
    }

    /**
     * Callback signal for when we should despawn
     * the entity and remove it from the world.
     */

    public onDespawn(callback: () => void): void {
        this.despawnCallback = callback;
    }
}
