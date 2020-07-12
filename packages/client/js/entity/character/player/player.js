import _ from 'underscore';
import $ from 'jquery';

import Modules from '../../../utils/modules';
import Character from '../character';
import Armour from './equipment/armour';
import Weapon from './equipment/weapon';
import Pendant from './equipment/pendant';
import Boots from './equipment/boots';
import Ring from './equipment/ring';

export default class Player extends Character {
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
        var self = this;

        self.setId(data.instance);
        self.setName(data.username);
        self.setGridPosition(data.x, data.y);
        self.setPointsData(data.hitPoints, data.mana);
        self.setExperience(data.experience, data.nextExperience, data.prevExperience);

        self.level = data.level;

        self.lastLogin = data.lastLogin;
        self.pvpKills = data.pvpKills;
        self.pvpDeaths = data.pvpDeaths;

        self.orientation = data.orienation;

        self.movementSpeed = data.movementSpeed;

        self.type = 'player';
    }

    loadHandler(game) {
        var self = this;

        /**
         * This is for other player characters
         */

        self.handler.setGame(game);
        self.handler.load();
    }

    hasKeyboardMovement() {
        return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
    }

    setId(id) {
        this.id = id;
    }

    loadEquipment() {
        var self = this;

        self.armour = null;
        self.weapon = null;
        self.pendant = null;
        self.ring = null;
        self.boots = null;
    }

    isRanged() {
        return this.weapon && this.weapon.ranged;
    }

    hasWeapon() {
        return this.weapon ? this.weapon.exists() : false;
    }

    setName(name) {
        var self = this;

        self.username = name;
        self.name = name;
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
        var self = this;

        if (self.poison === poison) return;

        self.poison = poison;

        if (self.poison)
            $('#health').css('background', '-webkit-linear-gradient(right, #079231, #012b0c)');
        else $('#health').css('background', '-webkit-linear-gradient(right, #ff0000, #ef5a5a)');
    }

    getX() {
        return this.gridX;
    }

    getY() {
        return this.gridY;
    }

    setExperience(experience, nextExperience, prevExperience) {
        var self = this;

        self.experience = experience;
        self.nextExperience = nextExperience;
        self.prevExperience = prevExperience || 0;

        if (self.experienceCallback) self.experienceCallback();
    }

    setPointsData(hitPointsData, manaData) {
        var self = this,
            hitPoints = hitPointsData.shift(),
            maxHitPoints = hitPointsData.shift(),
            mana = manaData.shift(),
            maxMana = manaData.shift();

        self.setMaxHitPoints(maxHitPoints);
        self.setMaxMana(maxMana);

        self.setHitPoints(hitPoints);
        self.setMana(mana);
    }

    setEquipment(type, name, string, count, ability, abilityLevel, power) {
        var self = this;

        switch (type) {
            case Modules.Equipment.Armour:
                if (!self.armour)
                    self.armour = new Armour(name, string, count, ability, abilityLevel, power);
                else self.armour.update(name, string, count, ability, abilityLevel, power);

                if (self.updateArmourCallback) self.updateArmourCallback(string, power);

                break;

            case Modules.Equipment.Weapon:
                if (!self.weapon)
                    self.weapon = new Weapon(name, string, count, ability, abilityLevel, power);
                else self.weapon.update(name, string, count, ability, abilityLevel, power);

                self.weapon.ranged = string.includes('bow');

                if (self.updateWeaponCallback) self.updateWeaponCallback(string, power);

                break;

            case Modules.Equipment.Pendant:
                if (!self.pendant)
                    self.pendant = new Pendant(name, string, count, ability, abilityLevel, power);
                else self.pendant.update(name, string, count, ability, abilityLevel, power);

                break;

            case Modules.Equipment.Ring:
                if (!self.ring)
                    self.ring = new Ring(name, string, count, ability, abilityLevel, power);
                else self.ring.update(name, string, count, ability, abilityLevel, power);

                break;

            case Modules.Equipment.Boots:
                if (!self.boots)
                    self.boots = new Boots(name, string, count, ability, abilityLevel, power);
                else self.boots.update(name, string, count, ability, abilityLevel, power);

                break;
        }

        if (self.updateEquipmentCallback) self.updateEquipmentCallback(type, power);
    }

    unequip(type) {
        var self = this;

        switch (type) {
            case 'armour':
                self.armour.update('Cloth Armour', 'clotharmor', 1, -1, -1);
                break;

            case 'weapon':
                self.weapon.update(null, null, -1, -1, -1);
                break;

            case 'pendant':
                self.pendant.update(null, null, -1, -1, -1);
                break;

            case 'ring':
                self.ring.update(null, null, -1, -1, -1);
                break;

            case 'boots':
                self.boots.update(null, null, -1, -1, -1);
                break;
        }
    }

    tempBlink() {
        var self = this;

        self.blink(90);

        if (!self.tempBlinkTimeout)
            self.tempBlinkTimeout = setTimeout(function () {
                self.stopBlinking();
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
