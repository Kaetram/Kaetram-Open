import { Equipment } from './../../../../../common/network/opcodes';
import $ from 'jquery';

import { Modules } from '@kaetram/common/network';

import Character from '../character';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';

import type Game from '../../../game';
import type { WelcomeData } from '@kaetram/common/types/messages';
import { EquipmentData } from '@kaetram/common/types/equipment';

export default class Player extends Character {
    public username = '';

    public rights = 0;
    public wanted = false;

    public override experience = -1;
    public nextExperience = -1;
    public prevExperience = -1;
    public override level = -1;

    public pvpKills = -1;
    public pvpDeaths = -1;

    public override hitPoints = -1;
    public override maxHitPoints = -1;

    public override mana = -1;
    public override maxMana = -1;

    public override pvp = false;

    public moveLeft = false;
    public moveRight = false;
    public moveUp = false;
    public moveDown = false;

    public poison = false;
    public disableAction = false;

    private lastLogin!: number | null;

    // Mapping of all equipments to their type.
    public equipments = {
        [Modules.Equipment.Armour]: new Armour(),
        [Modules.Equipment.Boots]: new Boots(),
        [Modules.Equipment.Pendant]: new Pendant(),
        [Modules.Equipment.Ring]: new Ring(),
        [Modules.Equipment.Weapon]: new Weapon()
    };

    private experienceCallback?: () => void;
    private equipmentCallback?: () => void;

    // private tempcBlinkTimeout!: number;
    public moving!: boolean;

    public constructor() {
        super('-1', Modules.Types.Player.toString());
    }

    public load({
        instance,
        username,
        x,
        y,
        hitPoints,
        mana,
        experience,
        nextExperience,
        prevExperience,
        level,
        lastLogin,
        orientation,
        movementSpeed
    }: WelcomeData): void {
        this.setId(instance);
        this.setName(username);
        this.setGridPosition(x, y);
        this.setPointsData(hitPoints, mana);
        this.setExperience(experience, nextExperience!, prevExperience);

        this.level = level;

        this.lastLogin = lastLogin;

        this.orientation = orientation;

        this.movementSpeed = movementSpeed;

        this.type = Modules.EntityType.Player;
    }

    public loadHandler(game: Game): void {
        /**
         * This is for other player characters
         */

        this.handler.setGame(game);
        this.handler.load();
    }

    public hasKeyboardMovement(): boolean {
        return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
    }

    public equip(equipment: EquipmentData): void {
        let { type, name, key, count, ability, abilityLevel, power, ranged } = equipment;

        this.equipments[type].update(key, name, count, ability, abilityLevel, power, ranged);

        this.equipmentCallback?.();
    }

    public unequip(type: Modules.Equipment): void {
        this.equipments[type].update();

        this.equipmentCallback?.();
    }

    public setId(id: string): void {
        this.id = id;
    }

    public isRanged(): boolean {
        return this.equipments[Modules.Equipment.Weapon].ranged;
    }

    public override hasWeapon(): boolean {
        return this.equipments[Modules.Equipment.Weapon].exists();
    }

    public override setName(name: string): void {
        this.username = name;
        this.name = name;
    }

    public getSpriteName(): string {
        return this.equipments[Modules.Equipment.Armour].key;
    }

    public getArmour(): Armour {
        return this.equipments[Modules.Equipment.Armour] as Armour;
    }

    public getBoots(): Boots {
        return this.equipments[Modules.Equipment.Boots] as Boots;
    }

    public getPendant(): Pendant {
        return this.equipments[Modules.Equipment.Pendant] as Pendant;
    }

    public getRing(): Ring {
        return this.equipments[Modules.Equipment.Ring] as Ring;
    }

    public getWeapon(): Weapon {
        return this.equipments[Modules.Equipment.Weapon] as Weapon;
    }

    public setMana(mana: number): void {
        this.mana = mana;
    }

    public setMaxMana(maxMana: number): void {
        this.maxMana = maxMana;
    }

    public setPoison(poison: boolean): void {
        if (this.poison === poison) return;

        this.poison = poison;

        if (this.poison)
            $('#health').css('background', '-webkit-linear-gradient(right, #079231, #012b0c)');
        else $('#health').css('background', '-webkit-linear-gradient(right, #ff0000, #ef5a5a)');
    }

    public setExperience(experience: number, nextExperience: number, prevExperience: number): void {
        this.experience = experience;
        this.nextExperience = nextExperience;
        this.prevExperience = prevExperience || 0;

        this.experienceCallback?.();
    }

    private setPointsData([hitPoints, maxHitPoints]: number[], [mana, maxMana]: number[]): void {
        this.setMaxHitPoints(maxHitPoints);
        this.setMaxMana(maxMana);

        this.setHitPoints(hitPoints);
        this.setMana(mana);
    }

    public onExperience(callback: () => void): void {
        this.experienceCallback = callback;
    }

    public onEquipment(callback: () => void): void {
        this.equipmentCallback = callback;
    }
}
