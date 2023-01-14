import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import _ from 'lodash-es';

import Item from '../../objects/item';

import Armour from './equipment/impl/armour';
import Boots from './equipment/impl/boots';
import Pendant from './equipment/impl/pendant';
import Ring from './equipment/impl/ring';
import Weapon from './equipment/impl/weapon';

import type { EquipmentData, SerializedEquipment } from '@kaetram/common/types/equipment';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type Equipment from './equipment/equipment';
import type Player from './player';

export default class Equipments {
    private armour: Armour = new Armour();
    private boots: Boots = new Boots();
    private pendant: Pendant = new Pendant();
    private ring: Ring = new Ring();
    private weapon: Weapon = new Weapon();

    // Store all equipments for parsing.
    // Make sure these are in the order of the enum.
    private equipments: Equipment[] = [
        this.armour,
        this.boots,
        this.pendant,
        this.ring,
        this.weapon
    ];

    public totalAttackStats: Stats = Utils.getEmptyStats();
    public totalDefenseStats: Stats = Utils.getEmptyStats();
    public totalBonuses: Bonuses = Utils.getEmptyBonuses();

    private loadCallback?: () => void;
    private equipCallback?: (equipment: Equipment) => void;
    private unequipCallback?: (type: Modules.Equipment) => void;

    public constructor(private player: Player) {}

    /**
     * Takes the equipment data stored in the database and 'de-serializes' it
     * by updating each individual equipment.
     * @param equipmentInfo The information about equipments from the database.
     */

    public load(equipmentInfo: EquipmentData[]): void {
        _.each(equipmentInfo, (info: EquipmentData) => {
            let equipment = this.getEquipment(info.type);

            if (!equipment) return;
            if (!info.key) return; // Skip if the item is already null

            equipment.update(new Item(info.key, -1, -1, true, info.count, info.enchantments));
        });

        this.loadCallback?.();

        this.player.sync();

        this.calculateStats();
    }

    /**
     * Takes information about an item and equips it onto the player. It figures
     * out what equipment type it is, and updates that equipment's information.
     */

    public equip(item: Item): void {
        if (!item) return log.warning('Tried to equip something mysterious.');

        let type = item.getEquipmentType(),
            equipment = this.getEquipment(type);

        if (!equipment) return;

        if (!equipment.isEmpty())
            this.player.inventory.add(
                new Item(equipment.key, -1, -1, true, equipment.count, equipment.enchantments)
            );

        equipment.update(item);

        this.equipCallback?.(equipment);

        this.calculateStats();
    }

    /**
     * Finds the equipment type passed and attempts to unequip if there is
     * enough space in the inventory.
     * @param type The equipment we are attempting to unequip.
     */

    public unequip(type: Modules.Equipment): void {
        if (!this.player.inventory.hasSpace())
            return this.player.notify('You do not have enough space in your inventory.');

        let equipment = this.getEquipment(type);

        this.player.inventory.add(
            new Item(equipment.key, -1, -1, true, equipment.count, equipment.enchantments)
        );

        equipment.empty();

        this.unequipCallback?.(type);

        this.calculateStats();
    }

    /**
     * We use this function to calculate total stats and bonsuses every time
     * an item is equipped or unequipped. This is so that it is not calculated
     * each time the player's damage is calculated. We iterate through every
     * equipment and add up the stats and bonuses to the total.
     */

    private calculateStats(): void {
        // Clear the current stats and bonuses.
        this.totalAttackStats = Utils.getEmptyStats();
        this.totalDefenseStats = Utils.getEmptyStats();
        this.totalBonuses = Utils.getEmptyBonuses();

        this.forEachEquipment((equipment: Equipment) => {
            if (equipment.isEmpty()) return;

            // Attack stats
            this.totalAttackStats.crush += equipment.attackStats.crush;
            this.totalAttackStats.slash += equipment.attackStats.slash;
            this.totalAttackStats.stab += equipment.attackStats.stab;
            this.totalAttackStats.magic += equipment.attackStats.magic;

            // Defense stats
            this.totalDefenseStats.crush += equipment.defenseStats.crush;
            this.totalDefenseStats.slash += equipment.defenseStats.slash;
            this.totalDefenseStats.stab += equipment.defenseStats.stab;
            this.totalDefenseStats.magic += equipment.defenseStats.magic;

            // Bonuses
            this.totalBonuses.accuracy += equipment.bonuses.accuracy;
            this.totalBonuses.strength += equipment.bonuses.strength;
            this.totalBonuses.archery += equipment.bonuses.archery;
            this.totalBonuses.magic += equipment.bonuses.magic;
        });
    }

    /**
     * Each equipment is organized in the same order as the `Modules.Equipment`
     * enum. As such, we use the type to pick from the array. We must make sure
     * that any new equipments that are added have to follow the SAME order
     * as the enumeration.
     * @param type The type of equipment from Modules.
     * @returns The equipment in the index.
     */

    public getEquipment(type: Modules.Equipment): Equipment {
        return this.equipments[type];
    }

    /**
     * Supplemental getters for more easily accessing equipments.
     * Instead of having to write `player.equipment.getEquipment(Modules.Equipment.Armour)`
     * you can just use these getters -> `player.equipment.getArmour()`
     */

    /**
     * Grabs the armour equipment of the player.
     * @returns Armour equipment type.
     */

    public getArmour(): Armour {
        return this.getEquipment(Modules.Equipment.Armour) as Armour;
    }

    /**
     * Grabs the boots equipment of the player.
     * @returns Botos equipment type.
     */

    public getBoots(): Boots {
        return this.getEquipment(Modules.Equipment.Boots);
    }

    /**
     * Grabs the pendant equipment of the player.
     * @returns Pendant equipment type.
     */

    public getPendant(): Pendant {
        return this.getEquipment(Modules.Equipment.Pendant);
    }

    /**
     * Grabs the ring equipment of the player.
     * @returns Ring equipment type.
     */

    public getRing(): Ring {
        return this.getEquipment(Modules.Equipment.Ring);
    }

    /**
     * Grabs the weapon equipment of the player.
     * @returns Weapon equipment type.
     */

    public getWeapon(): Weapon {
        return this.getEquipment(Modules.Equipment.Weapon) as Weapon;
    }

    /**
     * Goes through each one of our equipments and serializes it. It extracts
     * cruical information, such as the id, count, and enchantments
     * @param clientInfo Whether or not we are sending this information to the client.
     * @returns A serialized version of the equipment information.
     */

    public serialize(clientInfo = false): SerializedEquipment {
        let equipments: EquipmentData[] = [];

        this.forEachEquipment((equipment: Equipment) =>
            equipments.push(equipment.serialize(clientInfo))
        );

        // Store in an object so that it gets saved into Database faster.
        return { equipments };
    }

    /**
     * Parses through each equipment in the equipments array.
     * @param callback Calls back each individual equipment.
     */

    public forEachEquipment(callback: (equipment: Equipment) => void): void {
        _.each(this.equipments, callback);
    }

    /**
     * Callback signal for when the equipment is loaded.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }

    /**
     * Callback signal for when an item is equipped.
     * @param callback The equipment slot that we just updated.
     */

    public onEquip(callback: (equipment: Equipment) => void): void {
        this.equipCallback = callback;
    }

    /**
     * Callback for when an equipment is removed.
     * @param callback The equipment type we are removing.
     */

    public onUnequip(callback: (type: Modules.Equipment) => void): void {
        this.unequipCallback = callback;
    }
}
