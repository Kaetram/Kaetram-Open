import rawData from '../../../../data/items.json';
import Entity from '../entity';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import PluginIndex from '@kaetram/server/data/plugins/items';
import { Modules } from '@kaetram/common/network';

import type Player from '../character/player/player';
import type { EntityData } from '@kaetram/common/types/entity';
import type { Plugin } from '@kaetram/server/data/plugins/items';
import type { Bonuses, Enchantments, ItemData, Light, Stats } from '@kaetram/common/types/item';

interface RawData {
    [key: string]: ItemData;
}

export default class Item extends Entity {
    private data: ItemData;

    // Item Data
    private itemType = 'object'; // weapon, armour, pendant, etc.
    public stackable = false;
    public edible = false;
    public interactable = false;
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

    // Pet information
    public pet = '';

    // Item information
    public description = '';
    public projectileName = 'arrow';

    // Equipment variables
    public attackRate: number = Modules.Defaults.ATTACK_RATE;
    public twoHanded = false;
    public poisonous = false;
    public freezing = false;
    public burning = false;

    public light: Light = {};
    public weaponType = '';

    // Bowl variables
    public smallBowl = false;
    public mediumBowl = false;

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
    public fishing = -1;
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

        // Prevent invalid count values.
        this.count = Utils.sanitizeNumber(this.count);

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
        this.interactable = this.data.interactable || this.interactable;
        this.maxStackSize = this.getMaxStackSize(this.data.maxStackSize);
        this.price = this.data.price || this.price;
        this.storeCount = this.data.storeCount || this.storeCount;
        this.level = this.data.level || this.level;
        this.skill = this.data.skill || this.skill;
        this.attackStats = this.data.attackStats || this.attackStats;
        this.defenseStats = this.data.defenseStats || this.defenseStats;
        this.bonuses = this.data.bonuses || this.bonuses;
        this.attackRate = this.data.attackRate || this.attackRate;
        this.twoHanded = this.data.twoHanded || this.twoHanded;
        this.poisonous = this.data.poisonous || this.poisonous;
        this.freezing = this.data.freezing || this.freezing;
        this.burning = this.data.burning || this.burning;
        this.light = this.data.light || this.light;
        this.movementModifier = this.data.movementModifier || this.movementModifier;
        this.lumberjacking = this.data.lumberjacking || this.lumberjacking;
        this.mining = this.data.mining || this.mining;
        this.fishing = this.data.fishing || this.fishing;
        this.undroppable = this.data.undroppable || this.undroppable;
        this.respawnDelay = this.data.respawnDelay || this.respawnDelay;
        this.attackRange = this.data.attackRange || this.getDefaultAttackRange();
        this.projectileName = this.data.projectileName || this.projectileName;
        this.description = this.data.description || this.description;
        this.manaCost = this.data.manaCost || this.manaCost;
        this.weaponType = this.data.weaponType || this.weaponType;
        this.smallBowl = this.data.smallBowl || this.smallBowl;
        this.mediumBowl = this.data.mediumBowl || this.mediumBowl;
        this.pet = this.data.pet || this.pet;

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
        // These are weird hacks because of pointer references junk.
        return new Item(
            `${this.key}`,
            this.x,
            this.y,
            this.dropped,
            Utils.sanitizeNumber(this.count),
            this.copyEnchantments(),
            this.owner
        ) as this;
    }

    /**
     * Copies the enchantments one by one in order to avoid any references
     * to the original item's enchantments in the slot.
     * @returns A new enchantment object that is a copy of the original.
     */

    private copyEnchantments(): Enchantments {
        let enchantments: Enchantments = {};

        for (let key in this.enchantments) enchantments[key] = this.enchantments[key];

        return enchantments;
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
            let skill = player.skills.get(Utils.getSkill(this.skill)!);

            // Separate conditional if skill exists.
            if (skill)
                if (skill.level < requirement) {
                    // If the player's skill level is less than the requirement.
                    player.notify(
                        `item:SKILL_LEVEL_REQUIREMENT_EQUIP;skill=${skill.name};level=${requirement}`
                    );
                    return false;
                } else return true; // If the player's skill fulfills the requirement.
        }

        // Default to using the total level for the requirement.
        if (player.level < requirement) {
            player.notify(`item:TOTAL_LEVEL_REQUIREMENT;level=${requirement}`);
            return false;
        }

        // Check if the item has an achievement requirement and if it is completed.
        if (this.achievement && !player.achievements.get(this.achievement)?.isFinished()) {
            player.notify(`item:REQUIRES_ACHIEVEMENT`);
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
                player.notify(`item:REQUIRES_QUEST;quest=${quest.name}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Returns the type of equipment the item classifies as.
     * @returns Equipment type from Modules.
     */

    public getEquipmentType(): Modules.Equipment | undefined {
        switch (this.itemType) {
            case 'helmet': {
                return Modules.Equipment.Helmet;
            }

            case 'chestplate': {
                return Modules.Equipment.Chestplate;
            }

            case 'legplates': {
                return Modules.Equipment.Legplates;
            }

            case 'skin': {
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

            case 'shield': {
                return Modules.Equipment.Shield;
            }

            case 'cape': {
                return Modules.Equipment.Cape;
            }
        }
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
                    Modules.AttackStyle.Shared,
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

            case 'blunt': {
                return [
                    Modules.AttackStyle.Crush,
                    Modules.AttackStyle.Shared,
                    Modules.AttackStyle.Defensive
                ];
            }

            case 'spear': {
                return [
                    Modules.AttackStyle.Stab,
                    Modules.AttackStyle.Slash,
                    Modules.AttackStyle.Defensive
                ];
            }

            case 'scythe': {
                return [
                    Modules.AttackStyle.Slash,
                    Modules.AttackStyle.Crush,
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

            case 'whip': {
                return [Modules.AttackStyle.Slash, Modules.AttackStyle.Defensive];
            }

            case 'staff': {
                return [Modules.AttackStyle.Focused, Modules.AttackStyle.LongRange];
            }
        }

        return [];
    }

    /**
     * Depending on the item type, they may have different enchantments available. We return
     * a list of enchantments that we pick from based on the item type.
     * @returns A list of enchantments that are available for the item or empty if not applicable.
     */

    public getAvailableEnchantments(): Modules.Enchantment[] {
        switch (this.itemType) {
            case 'weapon': {
                return [
                    Modules.Enchantment.Bloodsucking,
                    Modules.Enchantment.Critical,
                    Modules.Enchantment.DoubleEdged
                ];
            }

            case 'weaponarcher':
            case 'weaponmagic': {
                return [Modules.Enchantment.Explosive, Modules.Enchantment.Stun];
            }

            case 'armour':
            case 'armourarcher': {
                return [
                    Modules.Enchantment.Evasion,
                    Modules.Enchantment.Thorns,
                    Modules.Enchantment.AntiStun
                ];
            }

            default: {
                return [];
            }
        }
    }

    /**
     * Grabs the enchantment level for an item based on the enchantment id. We
     * assume that we already checked the item has the enchantment.
     * @param enchantment The enchantment id we are checking for.
     * @returns The level of the enchantment.
     */

    public getEnchantmentLevel(enchantment: number): number {
        return this.enchantments[enchantment].level;
    }

    /**
     * @param id The enchantment id we are checking for.
     * @returns Whether or not the item has the enchantment.
     */

    public hasEnchantment(id: Modules.Enchantment): boolean {
        return id in this.enchantments;
    }

    /**
     * Check if the item is enchanted.
     * @returns Whether or not the item has any enchantments.
     */

    public isEnchanted(): boolean {
        return Object.keys(this.enchantments).length > 0;
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
        let types = [
            'helmet',
            'chestplate',
            'legplates',
            'skin',
            'weapon',
            'weaponarcher',
            'weaponmagic',
            'weaponskin',
            'pendant',
            'boots',
            'ring',
            'arrow',
            'shield',
            'cape'
        ];

        return types.includes(this.itemType);
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
     * @returns Whether or not the item is a small bowl item.
     */

    public isSmallBowl(): boolean {
        return this.smallBowl;
    }

    /**
     * @returns Whether or not the item is a medium bowl item.
     */

    public isMediumBowl(): boolean {
        return this.mediumBowl;
    }

    /**
     * @returns Whether or not the item is a pet type, used to spawn pets.
     */

    public isPetItem(): boolean {
        return this.pet !== '';
    }

    /**
     * Checks whether the weapon type is a bow.
     * @returns Whether or not the item is a bow.
     */

    public isBow(): boolean {
        return this.weaponType === 'bow';
    }

    /**
     * @returns Whether or not the equipment is two handed.
     */

    public isTwoHanded(): boolean {
        return this.twoHanded;
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
