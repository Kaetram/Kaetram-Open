/* global Modules, log, _ */

import Character from '../character';
import Armour from './equipment/armour';
import Weapon from './equipment/weapon';
import Pendant from './equipment/pendant';
import Boots from './equipment/boots';
import Ring from './equipment/ring';
import Modules from '../../../utils/modules';

export default class Player extends Character {
    username: string;
    password: string;
    email: string;
    avatar: any;
    rights: number;
    wanted: boolean;
    experience: number;
    nextExperience: number;
    prevExperience: number;
    level: number;
    pvpKills: number;
    pvpDeaths: number;
    prevX: number;
    prevY: number;
    direction: any;
    pvp: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    moveUp: boolean;
    moveDown: boolean;
    disableAction: boolean;
    lastLogin: any;
    armour: any;
    weapon: any;
    pendant: any;
    ring: any;
    boots: any;
    poison: any;
    experienceCallback: any;
    updateArmourCallback: any;
    updateWeaponCallback: any;
    updateEquipmentCallback: any;
    tempBlinkTimeout: any;
    constructor() {
        super(-1, Modules.Types.Player);

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

    load(data) {
        this.setId(data.instance);
        this.setName(data.username);
        this.setGridPosition(data.x, data.y);
        this.setPointsData(data.hitPoints, data.mana);
        this.setExperience(
            data.experience,
            data.nextExperience,
            data.prevExperience
        );

        this.level = data.level;

        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;

        this.orientation = data.orienation;

        this.movementSpeed = data.movementSpeed;

        this.type = 'player';
    }

    loadHandler(game) {
        /**
         * This is for other player characters
         */

        this.handler.setGame(game);
        this.handler.load();
    }

    hasKeyboardMovement() {
        return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
    }

    setId(id) {
        this.id = id;
    }

    loadEquipment() {
        this.armour = null;
        this.weapon = null;
        this.pendant = null;
        this.ring = null;
        this.boots = null;
    }

    isRanged() {
        return this.weapon && this.weapon.ranged;
    }

    hasWeapon() {
        return this.weapon ? this.weapon.exists() : false;
    }

    setName(name) {
        this.username = name;
        this.name = name;
    }

    getSpriteName() {
        return this.armour ? this.armour.string : 'clotharmor';
    }

    setMana(mana) {
        this.mana = mana;
    }

    setMaxMana(maxMana) {
        this.maxMana = maxMana;
    }

    setPoison(poison) {
        if (this.poison === poison) return;

        this.poison = poison;

        if (this.poison)
            $('#health').css(
                'background',
                '-webkit-linear-gradient(right, #079231, #012b0c)'
            );
        else
            $('#health').css(
                'background',
                '-webkit-linear-gradient(right, #ff0000, #ef5a5a)'
            );
    }

    getX() {
        return this.gridX;
    }

    getY() {
        return this.gridY;
    }

    setExperience(experience, nextExperience, prevExperience) {
        this.experience = experience;
        this.nextExperience = nextExperience;
        this.prevExperience = prevExperience || 0;

        if (this.experienceCallback) this.experienceCallback();
    }

    setPointsData(hitPointsData, manaData) {
        const hitPoints = hitPointsData.shift();
        const maxHitPoints = hitPointsData.shift();
        const mana = manaData.shift();
        const maxMana = manaData.shift();

        this.setMaxHitPoints(maxHitPoints);
        this.setMaxMana(maxMana);

        this.setHitPoints(hitPoints);
        this.setMana(mana);
    }

    setEquipment(type, name, string, count, ability, abilityLevel, power) {
        switch (type) {
            case Modules.Equipment.Armour:
                if (!this.armour)
                    this.armour = new Armour(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );
                else
                    this.armour.update(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );

                if (this.updateArmourCallback)
                    this.updateArmourCallback(string, power);

                break;

            case Modules.Equipment.Weapon:
                if (!this.weapon)
                    this.weapon = new Weapon(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );
                else
                    this.weapon.update(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );

                this.weapon.ranged = string.includes('bow');

                if (this.updateWeaponCallback)
                    this.updateWeaponCallback(string, power);

                break;

            case Modules.Equipment.Pendant:
                if (!this.pendant)
                    this.pendant = new Pendant(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );
                else
                    this.pendant.update(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );

                break;

            case Modules.Equipment.Ring:
                if (!this.ring)
                    this.ring = new Ring(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );
                else
                    this.ring.update(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );

                break;

            case Modules.Equipment.Boots:
                if (!this.boots)
                    this.boots = new Boots(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );
                else
                    this.boots.update(
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );

                break;
        }

        if (this.updateEquipmentCallback)
            this.updateEquipmentCallback(type, power);
    }

    unequip(type) {
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

    tempBlink() {
        this.blink(90);

        if (!this.tempBlinkTimeout)
            this.tempBlinkTimeout = setTimeout(() => {
                this.stopBlinking();
            }, 500);
    }

    onUpdateArmour(callback) {
        this.updateArmourCallback = callback;
    }

    onUpdateWeapon(callback) {
        this.updateWeaponCallback = callback;
    }

    onUpdateEquipment(callback) {
        this.updateEquipmentCallback = callback;
    }

    onExperience(callback) {
        this.experienceCallback = callback;
    }
}
