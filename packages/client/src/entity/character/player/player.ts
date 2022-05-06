import $ from 'jquery';

import { Modules } from '@kaetram/common/network';

import Character from '../character';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';

import type { WelcomeData } from '@kaetram/common/types/messages';
import type Game from '../../../game';
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

    public disableAction = false;

    private lastLogin!: number | null;

    public armour: Armour = new Armour();
    public pendant: Pendant = new Pendant();
    public ring: Ring = new Ring();
    public boots: Boots = new Boots();
    public weapon: Weapon = new Weapon();

    public poison = false;

    private experienceCallback?(): void;
    private updateArmourCallback?(string: string, power?: number): void;
    private updateWeaponCallback?(string: string, power?: number): void;
    private updateEquipmentCallback?(type: number, power?: number): void;

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

    public setId(id: string): void {
        this.id = id;
    }

    public isRanged(): boolean {
        return this.weapon?.ranged || false;
    }

    public override hasWeapon(): boolean {
        return this.weapon?.exists() || false;
    }

    public override setName(name: string): void {
        this.username = name;
        this.name = name;
    }

    public getSpriteName(): string {
        return this.armour ? this.armour.string : 'clotharmor';
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

    public setEquipment(equipment: EquipmentData): void {
        let { type, name, key, count, ability, abilityLevel, power } = equipment;

        switch (type) {
            case Modules.Equipment.Armour:
                this.armour.update(name, key, count, ability, abilityLevel, power);

                this.updateArmourCallback?.(key, power);

                break;

            case Modules.Equipment.Weapon:
                this.weapon.update(name, key, count, ability, abilityLevel, power);

                this.weapon.ranged = key.includes('bow');

                this.updateWeaponCallback?.(key, power);

                break;

            case Modules.Equipment.Pendant:
                return this.pendant.update(name, key, count, ability, abilityLevel, power);

            case Modules.Equipment.Ring:
                return this.ring.update(name, key, count, ability, abilityLevel, power);

            case Modules.Equipment.Boots:
                return this.boots.update(name, key, count, ability, abilityLevel, power);
        }

        this.updateEquipmentCallback?.(type, power);
    }

    public unequip(type: Modules.Equipment): void {
        switch (type) {
            case Modules.Equipment.Armour:
                this.armour.update('Cloth Armour', 'clotharmor', 1, -1, -1);

                this.updateArmourCallback?.('clotharmor');
                break;

            case Modules.Equipment.Weapon:
                this.weapon.update('', '', -1, -1, -1);

                this.updateWeaponCallback?.('', 1);
                break;

            case Modules.Equipment.Pendant:
                this.pendant.update('', '', -1, -1, -1);
                break;

            case Modules.Equipment.Ring:
                this.ring.update('', '', -1, -1, -1);
                break;

            case Modules.Equipment.Boots:
                this.boots.update('', '', -1, -1, -1);
                break;
        }
    }

    // tempBlink(): void {
    //     this.blink(90);

    //     if (!this.tempBlinkTimeout)
    //         this.tempBlinkTimeout = window.setTimeout(() => this.stopBlinking(), 500);
    // }

    public onUpdateArmour(callback: (armourName: string, power: number) => void): void {
        this.updateArmourCallback = callback;
    }

    public onUpdateWeapon(callback: (string: string, power: number) => void): void {
        this.updateWeaponCallback = callback;
    }

    public onUpdateEquipment(callback: (type: number, power: number) => void): void {
        this.updateEquipmentCallback = callback;
    }

    public onExperience(callback: () => void): void {
        this.experienceCallback = callback;
    }
}
