import $ from 'jquery';

import Game from '../../../game';
import Modules from '../../../utils/modules';
import Character from '../character';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';

export type PartialPlayerData = Partial<Player> & {
    hitPoints: number[];
    mana: number[];
};

export default class Player extends Character {
    rights: number;
    level: number;
    pvp: boolean;
    pvpKills: number;
    pvpDeaths: number;
    attackRange: number;
    orientation: number;
    movementSpeed: number;
    username: string;
    password: string;
    email: string;
    avatar: unknown;
    wanted: boolean;
    experience: number;
    nextExperience: number;
    prevExperience: number;
    prevX: number;
    prevY: number;
    direction: number;
    moveLeft: boolean;
    moveRight: boolean;
    moveUp: boolean;
    moveDown: boolean;
    disableAction: boolean;
    lastLogin: number;
    armour: Armour;
    pendant: Pendant;
    ring: Ring;
    boots: Boots;
    poison: boolean;
    experienceCallback: () => void;
    updateArmourCallback: (string: string, power: number) => void;
    updateWeaponCallback: (string: string, power: number) => void;
    updateEquipmentCallback: (type: number, power: number) => void;
    tempBlinkTimeout: NodeJS.Timeout;
    moving: boolean;

    constructor() {
        super('-1', Modules.Types.Player);

        this.username = '';
        this.password = '';
        this.email = '';

        this.avatar = null;

        this.rights = 0;
        this.wanted = false;
        this.experience = -1;
        this.nextExperience = -1;
        this.prevExperience = -1;
        this.level = -1;
        this.pvpKills = -1;
        this.pvpDeaths = -1;

        this.hitPoints = -1;
        this.maxHitPoints = -1;
        this.mana = -1;
        this.maxMana = -1;

        this.prevX = 0;
        this.prevY = 0;

        this.direction = null;
        this.pvp = false;

        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.disableAction = false;

        this.loadEquipment();
    }

    load(data: PartialPlayerData): void {
        this.setId(data.instance);
        this.setName(data.username);
        this.setGridPosition(data.x, data.y);
        this.setPointsData(data.hitPoints, data.mana);
        this.setExperience(data.experience, data.nextExperience, data.prevExperience);

        this.level = data.level;

        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;

        this.orientation = data.orientation;

        this.movementSpeed = data.movementSpeed;

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
        this.armour = null;
        this.weapon = null;
        this.pendant = null;
        this.ring = null;
        this.boots = null;
    }

    isRanged(): boolean {
        return this.weapon && this.weapon.ranged;
    }

    hasWeapon(): boolean {
        return this.weapon ? this.weapon.exists() : false;
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

    setPointsData(hitPointsData: number[], manaData: number[]): void {
        const hitPoints = hitPointsData.shift(),
            maxHitPoints = hitPointsData.shift(),
            mana = manaData.shift(),
            maxMana = manaData.shift();

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
                this.armour.update('Cloth Armour', 'clotharmor', 1, -1, -1);
                break;

            case 'weapon':
                this.weapon.update(null, null, -1, -1, -1);
                break;

            case 'pendant':
                this.pendant.update(null, null, -1, -1, -1);
                break;

            case 'ring':
                this.ring.update(null, null, -1, -1, -1);
                break;

            case 'boots':
                this.boots.update(null, null, -1, -1, -1);
                break;
        }
    }

    tempBlink(): void {
        this.blink(90);

        if (!this.tempBlinkTimeout)
            this.tempBlinkTimeout = setTimeout(() => {
                this.stopBlinking();
            }, 500);
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
