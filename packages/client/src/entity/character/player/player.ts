import $ from 'jquery';

import * as Modules from '@kaetram/common/src/modules';

import Game from '../../../game';
import Character from '../character';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';

export type PlayerData = Player & {
    hitPoints: number[];
    mana: number[];
};

export default class Player extends Character {
    username = '';
    password = '';
    email = '';

    avatar = null;
    rights = 0;
    wanted = false;

    experience = -1;
    nextExperience = -1;
    prevExperience = -1;
    level = -1;

    pvpKills = -1;
    pvpDeaths = -1;

    hitPoints = -1;
    maxHitPoints = -1;

    mana = -1;
    maxMana = -1;

    prevX = 0;
    prevY = 0;

    direction = null;

    pvp = false;

    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;

    disableAction = false;

    attackRange!: number;
    orientation!: number;
    movementSpeed!: number;

    lastLogin!: number | null;

    armour!: Armour;
    pendant!: Pendant;
    ring!: Ring;
    boots!: Boots;
    poison!: boolean;

    experienceCallback?(): void;
    updateArmourCallback?(string: string, power?: number): void;
    updateWeaponCallback?(string: string, power?: number): void;
    updateEquipmentCallback?(type: number, power?: number): void;

    tempBlinkTimeout!: number;
    moving!: boolean;

    constructor() {
        super('-1', Modules.Types.Player.toString());

        this.loadEquipment();
    }

    load({
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
        pvpKills,
        pvpDeaths,
        orientation,
        movementSpeed
    }: PlayerData): void {
        this.setId(instance);
        this.setName(username);
        this.setGridPosition(x, y);
        this.setPointsData(hitPoints, mana);
        this.setExperience(experience, nextExperience, prevExperience);

        this.level = level;

        this.lastLogin = lastLogin;
        this.pvpKills = pvpKills;
        this.pvpDeaths = pvpDeaths;

        this.orientation = orientation;

        this.movementSpeed = movementSpeed;

        this.type = 'player';
    }

    loadHandler(game: Game): void {
        /**
         * This is for other player characters
         */

        this.handler.setGame(game);
        this.handler.load();
    }

    hasKeyboardMovement(): boolean {
        return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
    }

    setId(id: string): void {
        this.id = id;
    }

    loadEquipment(): void {
        this.armour = null!;
        this.weapon = null!;
        this.pendant = null!;
        this.ring = null!;
        this.boots = null!;
    }

    isRanged(): boolean {
        return this.weapon?.ranged || false;
    }

    hasWeapon(): boolean {
        return this.weapon?.exists() || false;
    }

    setName(name: string): void {
        this.username = name;
        this.name = name;
    }

    getSpriteName(): string {
        return this.armour ? this.armour.string : 'clotharmor';
    }

    setMana(mana: number): void {
        this.mana = mana;
    }

    setMaxMana(maxMana: number): void {
        this.maxMana = maxMana;
    }

    setPoison(poison: boolean): void {
        if (this.poison === poison) return;

        this.poison = poison;

        if (this.poison)
            $('#health').css('background', '-webkit-linear-gradient(right, #079231, #012b0c)');
        else $('#health').css('background', '-webkit-linear-gradient(right, #ff0000, #ef5a5a)');
    }

    getX(): number {
        return this.gridX;
    }

    getY(): number {
        return this.gridY;
    }

    setExperience(experience: number, nextExperience: number, prevExperience: number): void {
        this.experience = experience;
        this.nextExperience = nextExperience;
        this.prevExperience = prevExperience || 0;

        this.experienceCallback?.();
    }

    setPointsData([hitPoints, maxHitPoints]: number[], [mana, maxMana]: number[]): void {
        this.setMaxHitPoints(maxHitPoints);
        this.setMaxMana(maxMana);

        this.setHitPoints(hitPoints);
        this.setMana(mana);
    }

    setEquipment(
        type: number,
        name: string,
        string: string,
        count: number,
        ability: number,
        abilityLevel: number,
        power?: number
    ): void {
        switch (type) {
            case Modules.Equipment.Armour:
                if (!this.armour)
                    this.armour = new Armour(name, string, count, ability, abilityLevel, power);
                else this.armour.update(name, string, count, ability, abilityLevel, power);

                this.updateArmourCallback?.(string, power);

                break;

            case Modules.Equipment.Weapon:
                if (!this.weapon)
                    this.weapon = new Weapon(name, string, count, ability, abilityLevel, power);
                else this.weapon.update(name, string, count, ability, abilityLevel, power);

                this.weapon.ranged = string.includes('bow');

                this.updateWeaponCallback?.(string, power);

                break;

            case Modules.Equipment.Pendant:
                if (!this.pendant)
                    this.pendant = new Pendant(name, string, count, ability, abilityLevel, power);
                else this.pendant.update(name, string, count, ability, abilityLevel, power);

                break;

            case Modules.Equipment.Ring:
                if (!this.ring)
                    this.ring = new Ring(name, string, count, ability, abilityLevel, power);
                else this.ring.update(name, string, count, ability, abilityLevel, power);

                break;

            case Modules.Equipment.Boots:
                if (!this.boots)
                    this.boots = new Boots(name, string, count, ability, abilityLevel, power);
                else this.boots.update(name, string, count, ability, abilityLevel, power);

                break;
        }

        this.updateEquipmentCallback?.(type, power);
    }

    unequip(type: string): void {
        switch (type) {
            case 'armour':
                this.armour?.update('Cloth Armour', 'clotharmor', 1, -1, -1);
                break;

            case 'weapon':
                this.weapon?.update('', '', -1, -1, -1);
                break;

            case 'pendant':
                this.pendant?.update('', '', -1, -1, -1);
                break;

            case 'ring':
                this.ring?.update('', '', -1, -1, -1);
                break;

            case 'boots':
                this.boots?.update('', '', -1, -1, -1);
                break;
        }
    }

    tempBlink(): void {
        this.blink(90);

        if (!this.tempBlinkTimeout)
            this.tempBlinkTimeout = window.setTimeout(() => this.stopBlinking(), 500);
    }

    onUpdateArmour(callback: (armourName: string, power: number) => void): void {
        this.updateArmourCallback = callback;
    }

    onUpdateWeapon(callback: (string: string, power: number) => void): void {
        this.updateWeaponCallback = callback;
    }

    onUpdateEquipment(callback: (type: number, power: number) => void): void {
        this.updateEquipmentCallback = callback;
    }

    onExperience(callback: () => void): void {
        this.experienceCallback = callback;
    }
}
