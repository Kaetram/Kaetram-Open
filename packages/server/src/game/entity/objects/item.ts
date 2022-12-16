import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import PluginIndex from '@kaetram/server/data/plugins/items';

import Entity from '../entity';
import rawData from '../../../../data/items.json';

import type Player from '../character/player/player';
import type { Bonuses, Enchantments, ItemData, Stats } from '@kaetram/common/types/item';
import type { EntityData } from '@kaetram/common/types/entity';
import type { Plugin } from '@kaetram/server/data/plugins/items';

type RawData = {
    [key: string]: ItemData;
};

export default class Item extends Entity {
    private data: ItemData;

    // Item Data
    private itemType = 'object'; // weapon, armour, pendant, etc.
    public stackable = false;
    public edible = false;
    public maxStackSize: number = Modules.Constants.MAX_STACK;
    public plugin: Plugin | undefined;

    // Store variables
    public price = -2;
    public storeCount = -1;

    // Requirement for equipping the item.
    private level = -1;
    private skill = '';
    private achievement = '';
    private quest = '';

    // Equipment variables
    public attackRate: number = Modules.Defaults.ATTACK_RATE;
    public poisonous = false;

    // Stats
    public attackStats: Stats = Utils.getEmptyStats();
    public defenseStats: Stats = Utils.getEmptyStats();

    // Bonuses
    public bonuses: Bonuses = Utils.getEmptyBonuses();

    // Miscellaneous variables
    public movementSpeed = -1;
    public stockAmount = 1; // Used for stores to increase count by this amount.
    public maxCount = 1; // Used for stores to know maximum limit.
    public lumberjacking = -1;

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
        public count = 1,
        public enchantments: Enchantments = {}
    ) {
        super(Utils.createInstance(Modules.EntityType.Item), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[Item] Could not find data for ${key}.`);
            this.exists = false;
            return;
        }

        // Count cannot be less than 1
        if (this.count < 1) this.count = 1;

        // Set all the item data (set defaults if value doesn't exist).
        this.itemType = this.data.type;
        this.key = this.data.spriteName || this.key;
        this.name = this.data.name;
        this.stackable = this.data.stackable || this.stackable;
        this.edible = this.data.edible || this.edible;
        this.maxStackSize = this.data.maxStackSize || this.maxStackSize;
        this.price = this.data.price || this.price;
        this.storeCount = this.data.storeCount || this.storeCount;
        this.level = this.data.level || this.level;
        this.skill = this.data.skill || this.skill;
        this.attackStats = this.data.attackStats || this.attackStats;
        this.defenseStats = this.data.defenseStats || this.defenseStats;
        this.bonuses = this.data.bonuses || this.bonuses;
        this.attackRate = this.data.attackRate || this.attackRate;
        this.poisonous = this.data.poisonous || this.poisonous;
        this.movementSpeed = this.data.movementSpeed || this.movementSpeed;
        this.lumberjacking = this.data.lumberjacking || this.lumberjacking;
        this.undroppable = this.data.undroppable || this.undroppable;
        this.respawnDelay = this.data.respawnDelay || this.respawnDelay;

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
     * Returns the type of equipment the item classifies as.
     * @returns Equipment type from Modules.
     */

    public getEquipmentType(): Modules.Equipment {
        switch (this.itemType) {
            case 'armour':
            case 'armourarcher': {
                return Modules.Equipment.Armour;
            }

            case 'weapon':
            case 'weaponarcher': {
                return Modules.Equipment.Weapon;
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
        }

        return -1;
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
     * Grabs the weapon requirement level for the current item object.
     * @returns The weapon requirement level in a number format.
     */

    public getRequirement(): number {
        if (this.level !== -1) return this.level;

        return 0;
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
            this.itemType === 'weapon' ||
            this.itemType === 'weaponarcher' ||
            this.itemType === 'pendant' ||
            this.itemType === 'boots' ||
            this.itemType === 'ring'
        );
    }

    /**
     * Checks if the item is a ranged weapon.
     * @returns If the itemType is of type `weaponarcher`.
     */

    public isRangedWeapon(): boolean {
        return this.itemType === 'weaponarcher';
    }

    /**
     * @returns Whether or not the item type is a weapon or archer weapon.
     */

    private isWeapon(): boolean {
        return this.itemType === 'weapon' || this.itemType === 'weaponarcher';
    }

    /**
     * @returns Whether or not the item type is that of a armour or archer armour.
     */

    private isArmour(): boolean {
        return this.itemType === 'armour' || this.itemType === 'armourarcher';
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
