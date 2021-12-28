import _ from 'lodash';

import log from '@kaetram/common/util/log';
import { Modules } from '@kaetram/common/network';
import { SEquipment } from '@kaetram/common/types/equipment';

import Player from '../player';

import Armour from './impl/armour';
import Boots from './impl/boots';
import Equipment from './impl/equipment';
import Pendant from './impl/pendant';
import Ring from './impl/ring';
import Weapon from './impl/weapon';

export default class Equipments {
    private armour: Armour = new Armour(-1);
    private boots: Boots = new Boots(-1);
    private pendant: Pendant = new Pendant(-1);
    private ring: Ring = new Ring(-1);
    private weapon: Weapon = new Weapon(-1);

    // Store all equipments for parsing.
    // Make sure these are in the order of the enum.
    private equipments: Equipment[] = [
        this.armour,
        this.boots,
        this.pendant,
        this.ring,
        this.weapon
    ];

    private loadCallback?: () => void;

    public constructor(private player: Player) {}

    /**
     * Takes the equipment data stored in the database and 'de-serializes' it
     * by updating each individual equipment.
     * @param equipmentInfo The information about equipments from the database.
     */

    public load(equipmentInfo: SEquipment[]): void {
        _.each(equipmentInfo, (info: SEquipment) => {
            let equipment = this.getEquipment(info.type);

            if (!equipment) return;
            if (info.id === -1) return; // Skip if the item is already null

            equipment.update(info.id, info.count, info.ability, info.abilityLevel);
        });

        this.loadCallback?.();
    }

    /**
     * Takes information about an item and equips it onto the player. It figures
     * out what equipment type it is, and updates that equipment's information.
     */

    public equip(id: number, count: number, ability: number, abilityLevel: number): void {
        log.warning('equip not implemented.');
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

        // TODO
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
        return this.getEquipment(Modules.Equipment.Armour);
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
        return this.getEquipment(Modules.Equipment.Weapon);
    }

    /**
     * Goes through each one of our equipments and serializes it. It extracts
     * cruical information, such as the id, count, ability, and abilityLevel.
     * @returns A serialized version of the equipment information.
     */

    public serialize(): SEquipment[] {
        let equipments: SEquipment[] = [];

        this.forEachEquipment((equipment: Equipment) => equipments.push(equipment.serialize()));

        return equipments;
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
}
