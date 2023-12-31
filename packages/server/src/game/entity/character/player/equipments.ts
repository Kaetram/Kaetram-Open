import Helmet from './equipment/impl/helmet';
import Pendant from './equipment/impl/pendant';
import Arrows from './equipment/impl/arrows';
import Chestplate from './equipment/impl/chestplate';
import Weapon from './equipment/impl/weapon';
import Shield from './equipment/impl/shield';
import Ring from './equipment/impl/ring';
import ArmourSkin from './equipment/impl/armourskin';
import WeaponSkin from './equipment/impl/weaponskin';
import Legplates from './equipment/impl/legplates';
import Cape from './equipment/impl/cape';
import Boots from './equipment/impl/boots';

import Item from '../../objects/item';

import Utils from '@kaetram/common/util/utils';
import log from '@kaetram/common/util/log';
import { Modules } from '@kaetram/common/network';

import type Player from './player';
import type Equipment from './equipment/equipment';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type { EquipmentData, SerializedEquipment } from '@kaetram/common/network/impl/equipment';

export default class Equipments {
    private helmet: Helmet = new Helmet();
    private pendant: Pendant = new Pendant();
    private arrows: Arrows = new Arrows();
    private chestplate: Chestplate = new Chestplate();
    private weapon: Weapon = new Weapon();
    private shield: Shield = new Shield();
    private ring: Ring = new Ring();
    private armourSkin: ArmourSkin = new ArmourSkin();
    private weaponSkin: WeaponSkin = new WeaponSkin();
    private legplates: Legplates = new Legplates();
    private cape: Cape = new Cape();
    private boots: Boots = new Boots();

    // Store all equipments for parsing.
    // Make sure these are in the order of the enum.
    private equipments: Equipment[] = [
        this.helmet,
        this.pendant,
        this.arrows,
        this.chestplate,
        this.weapon,
        this.shield,
        this.ring,
        this.armourSkin,
        this.weaponSkin,
        this.legplates,
        this.cape,
        this.boots
    ];

    public totalAttackStats: Stats = Utils.getEmptyStats();
    public totalDefenseStats: Stats = Utils.getEmptyStats();
    public totalBonuses: Bonuses = Utils.getEmptyBonuses();

    private loadCallback?: () => void;
    private equipCallback?: (equipment: Equipment) => void;
    private unequipCallback?: (type: Modules.Equipment, count?: number) => void;
    private attackStyleCallback?: (style: Modules.AttackStyle) => void;

    public constructor(private player: Player) {}

    /**
     * Takes the equipment data stored in the database and 'de-serializes' it
     * by updating each individual equipment.
     * @param equipmentInfo The information about equipments from the database.
     */

    public load(equipmentInfo: EquipmentData[]): void {
        for (let info of equipmentInfo) {
            let equipment = this.get(info.type);

            if (!equipment) continue;
            if (!info.key) continue; // Skip if the item is already null

            equipment.update(new Item(info.key, -1, -1, true, info.count, info.enchantments));

            // Only weapons have attack styles, so we update the last selected one.
            if (info.attackStyle) this.updateAttackStyle(info.attackStyle);
        }

        this.loadCallback?.();

        this.player.sync();

        this.calculateStats();
    }

    /**
     * Takes information about an item and equips it onto the player. It figures
     * out what equipment type it is, and updates that equipment's information.
     * @param item The item to equip.
     * @param fromIndex The index of the item in the inventory.
     */

    public equip(item: Item, fromIndex: number): void {
        if (!item)
            return log.warning(
                `[${this.player.username}] Attempted to equip something mysterious.`
            );

        let type = item.getEquipmentType()!,
            equipment = this.get(type);

        if (!equipment) return;

        /**
         * If the player is equipping a two-handed weapon and they have a shield currently equipped, then we
         * need to ensure that they have enough space in their inventory before removing the shield.
         */

        if (item.isTwoHanded() && !this.getShield().isEmpty()) {
            if (!this.player.inventory.hasSpace()) return this.player.notify('misc:NO_SPACE');

            this.unequip(Modules.Equipment.Shield);
        }

        /**
         * If the player is equipping the Moonlight Greatsword, then we add the skill Moonbeam
         * to the player's abilities.
         */



        /**
         * Similarly to handling the two-handed weapon, we must also cover the case when the player tries
         * to equip a shield while wielding a two-handed weapon. We must ensure that they have enough space
         * in their inventory before removing the weapon.
         */

        if (type === Modules.Equipment.Shield && this.getWeapon().isTwoHanded()) {
            if (!this.player.inventory.hasSpace()) return this.player.notify('misc:NO_SPACE');

            this.unequip(Modules.Equipment.Weapon);
        }

        // Remove the item from the inventory.
        this.player.inventory.remove(fromIndex, item.count);

        // If there is already an item equipped, we unequip it.
        if (!equipment.isEmpty())
            this.player.inventory.add(
                new Item(equipment.key, -1, -1, false, equipment.count, equipment.enchantments)
            );

        // Include the last attack style when we're equipping a weapon.
        if (equipment instanceof Weapon)
            equipment.update(item, this.player.getLastAttackStyle(item.weaponType));
        else equipment.update(item);

        this.equipCallback?.(equipment);

        this.calculateStats();
    }

    /**
     * Finds the equipment type passed and attempts to unequip if there is
     * enough space in the inventory.
     * @param type The equipment we are attempting to unequip.
     */

    public unequip(type: Modules.Equipment): void {
        let equipment = this.get(type);

        if (!equipment.key) return;

        let item = new Item(equipment.key, -1, -1, false, equipment.count, equipment.enchantments),
            count = this.player.inventory.add(item);

        // We stop here if the item cannot be added to the inventory.
        if (count < 1) return;

        equipment.count -= count;
        if (equipment.count < 1) equipment.empty();
        else {
            item.count = equipment.count;
            equipment.update(item);
        }

        this.unequipCallback?.(type, equipment.count);

        this.calculateStats();
    }

    /**
     * Handles decrementing an item from the equipment. This is used in the case
     * of arrows. In the future this will be generalized to handle other items
     * that can be used up throughout combat.
     */

    public decrementArrows(): void {
        let arrows = this.get(Modules.Equipment.Arrows);

        // Remove 1 arrow from the stack.
        arrows.count -= 1;

        // If there are no more arrows, we empty the equipment.
        if (arrows.count < 1) arrows.empty();

        this.unequipCallback?.(Modules.Equipment.Arrows, arrows.count);
    }

    /**
     * Updates the attack style of a weapon.
     * @param style The new attack style of the weapon.
     */

    public updateAttackStyle(style: Modules.AttackStyle): void {
        let weapon = this.getWeapon();

        // Ensure the weapon has the attack style.
        if (!weapon.hasAttackStyle(style))
            return log.warning(`[${this.player.username}] Invalid attack style.`);

        // Set new attack style.
        this.getWeapon().updateAttackStyle(style);

        // Sync the player for everyone else and update data.
        this.player.sync();

        // Callback with the new attack style.
        this.attackStyleCallback?.(style);
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

    public get(type: Modules.Equipment): Equipment {
        return this.equipments[type];
    }

    /**
     * Supplemental getters for more easily accessing equipments.
     * Instead of having to write `player.equipment.getEquipment(Modules.Equipment.Armour)`
     * you can just use these getters -> `player.equipment.getArmour()`
     */

    /**
     * Grabs the helmet equipment of the player.
     * @returns Helmet equipment object.
     */

    public getHelmet(): Helmet {
        return this.get(Modules.Equipment.Helmet) as Helmet;
    }

    /**
     * Grabs the chestplate equipment of the player.
     * @returns Chestplate equipment object.
     */

    public getChestplate(): Chestplate {
        return this.get(Modules.Equipment.Chestplate) as Chestplate;
    }

    /**
     * Grabs the legplates equipment of the player.
     * @returns Legplates equipment object.
     */

    public getLegplates(): Legplates {
        return this.get(Modules.Equipment.Legplates) as Legplates;
    }

    /**
     * Grabs the armour skin equipment of the player.
     * @returns The armour skin equipment type.
     */

    public getSkin(): ArmourSkin {
        return this.get(Modules.Equipment.ArmourSkin) as ArmourSkin;
    }

    /**
     * Grabs the boots equipment of the player.
     * @returns Botos equipment object.
     */

    public getBoots(): Boots {
        return this.get(Modules.Equipment.Boots);
    }

    /**
     * Grabs the pendant equipment of the player.
     * @returns Pendant equipment object.
     */

    public getPendant(): Pendant {
        return this.get(Modules.Equipment.Pendant);
    }

    /**
     * Grabs the ring equipment of the player.
     * @returns Ring equipment object.
     */

    public getRing(): Ring {
        return this.get(Modules.Equipment.Ring);
    }

    /**
     * Grabs the weapon equipment of the player.
     * @returns Weapon equipment object.
     */

    public getWeapon(): Weapon {
        return this.get(Modules.Equipment.Weapon) as Weapon;
    }

    /**
     * Grabs the arrows equipment of the player.
     * @returns Arrow equipment object.
     */

    public getArrows(): Arrows {
        return this.get(Modules.Equipment.Arrows) as Arrows;
    }

    /**
     * Grabs the shield equipment of the player.
     * @returns Shield equipment object.
     */

    public getShield(): Shield {
        return this.get(Modules.Equipment.Shield) as Shield;
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
        for (let equipment of this.equipments) callback(equipment);
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

    /**
     * Callback for when the attack style is updated.
     * @param callback The new attack style.
     */

    public onAttackStyle(callback: (style: Modules.AttackStyle) => void): void {
        this.attackStyleCallback = callback;
    }
}
