import Entity, { EntityData } from '../entity';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import { ItemData } from '@kaetram/common/types/item';

import rawData from '../../../../data/items.json';
import log from '@kaetram/common/util/log';

type RawData = {
    [key: string]: ItemData;
};

export default class Item extends Entity {
    private data: ItemData;

    // Item Data
    private itemType = 'object'; // weapon, armour, pendant, etc.
    public stackable = false;
    public edible = false;
    public maxStackSize = 1;
    public plugin = '';
    public price = 1;
    public storeCount = -1;
    public requirement = -1;
    public attackLevel = 1;
    public defenseLevel = 1;
    public pendantLevel = 0;
    public ringLevel = 0;
    public bootsLevel = 0;
    public movementSpeed = -1;
    public stockAmount = 1; // Used for stores to increase count by this amount.
    public maxCount = 1; // Used for stores to know maximum limit.

    private respawnTime = 30_000;
    private despawnDuration = 7000;
    private blinkDelay = 20_000;

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
        public ability = -1,
        public abilityLevel = -1
    ) {
        super(Utils.createInstance(Modules.EntityType.Item), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[Item] Could not find data for ${key}.`);
            return;
        }

        // Count cannot be less than 1 if the key is not null.
        if (!!key && this.count < 1) this.count = 1;

        // Set all the item data (set defaults if value doesn't exist).
        this.itemType = this.data.type;
        this.name = this.data.name;
        this.stackable = this.data.stackable || this.stackable;
        this.edible = this.data.edible || this.edible;
        this.maxStackSize = this.data.maxStackSize || this.maxStackSize;
        this.plugin = this.data.plugin || this.plugin;
        this.price = this.data.price || this.price;
        this.storeCount = this.data.storeCount || this.storeCount;
        this.requirement = this.data.requirement || this.requirement;
        this.attackLevel = this.data.attackLevel || this.attackLevel;
        this.defenseLevel = this.data.defenseLevel || this.defenseLevel;
        this.pendantLevel = this.data.pendantLevel || this.pendantLevel;
        this.ringLevel = this.data.ringLevel || this.ringLevel;
        this.bootsLevel = this.data.bootsLevel || this.bootsLevel;
        this.movementSpeed = this.data.movementSpeed || this.movementSpeed;
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
     * Sends the respawn callback signal after `respawnTime` milliseconds pass.
     */

    public respawn(): void {
        setTimeout(() => this.respawnCallback?.(), this.respawnTime);
    }

    /**
     * Returns the type of equipment the item classifies as.
     * @returns Equipment type from Modules.
     */

    public getEquipmentType(): Modules.Equipment {
        switch (this.itemType) {
            case 'armour':
            case 'armourarcher':
                return Modules.Equipment.Armour;

            case 'weapon':
            case 'weaponarcher':
                return Modules.Equipment.Weapon;

            case 'pendant':
                return Modules.Equipment.Pendant;

            case 'boots':
                return Modules.Equipment.Boots;

            case 'ring':
                return Modules.Equipment.Ring;
        }

        return -1;
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
     * Expands on the entity serialization and
     * adds item specific variables (count, ability, abilityLevel).
     * @returns EntityData containing item information.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.count = this.count;
        data.ability = this.ability;
        data.abilityLevel = this.abilityLevel;

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
