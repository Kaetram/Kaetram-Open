import $ from 'jquery';

import { Modules } from '@kaetram/common/network';

import Character from '../character';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';

import type Game from '../../../game';

import { EquipmentData } from '@kaetram/common/types/equipment';
import { PlayerData } from '@kaetram/common/types/player';

type ExperienceCallback = (
    experience: number,
    prevExperience: number,
    nextExperience: number
) => void;

export default class Player extends Character {
    public rights = 0;
    public wanted = false;

    public pvpKills = -1;
    public pvpDeaths = -1;

    public moveLeft = false;
    public moveRight = false;
    public moveUp = false;
    public moveDown = false;

    public poison = false;
    public disableAction = false;

    public moving = false;

    public override experience = -1;
    public override level = -1;

    public override hitPoints = -1;
    public override maxHitPoints = -1;

    public override mana = -1;
    public override maxMana = -1;

    public override pvp = false;

    // Mapping of all equipments to their type.
    public equipments = {
        [Modules.Equipment.Armour]: new Armour(),
        [Modules.Equipment.Boots]: new Boots(),
        [Modules.Equipment.Pendant]: new Pendant(),
        [Modules.Equipment.Ring]: new Ring(),
        [Modules.Equipment.Weapon]: new Weapon()
    };

    private syncCallback?: () => void;
    private experienceCallback?: ExperienceCallback;

    public constructor(instance: string) {
        super(instance, Modules.EntityType.Player);
    }

    /**
     * Loads the player based on the serialzied player
     * data sent from the server.
     * @param data Player data containing essentials.
     */

    public load(data: PlayerData): void {
        this.instance = data.instance;
        this.name = data.name;
        this.level = data.level!;
        this.orientation = data.orientation;
        this.movementSpeed = data.movementSpeed!;

        this.setGridPosition(data.x, data.y);

        this.setHitPoints(data.hitPoints!, data.maxHitPoints!);

        this.setMana(data.mana!);
        this.setMaxMana(data.maxMana!);

        this.setExperience(data.experience!, data.nextExperience!, data.prevExperience!);
    }

    /**
     * Loads the player handler and sets the game instance to
     * the current player object.
     * @param game The game instance object controlling the game.
     */

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
    }

    public unequip(type: Modules.Equipment): void {
        this.equipments[type].update();
    }

    /**
     * Signals to the callbacks that the player's data (experience, level, equipment)
     * has undergone a change. This updates the UI essentially.
     */

    public sync(): void {
        this.syncCallback?.();
    }

    public isRanged(): boolean {
        return this.equipments[Modules.Equipment.Weapon].ranged;
    }

    public override hasWeapon(): boolean {
        return this.equipments[Modules.Equipment.Weapon].exists();
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
        if (!experience) return;

        this.experience = experience;

        this.sync();

        if (!prevExperience || !nextExperience) return;

        this.experienceCallback?.(experience, prevExperience, nextExperience);
    }

    public onExperience(callback: ExperienceCallback): void {
        this.experienceCallback = callback;
    }

    /**
     * Callback for whenever we want to synchronize
     * the player's data to the UI.
     */

    public onSync(callback: () => void): void {
        this.syncCallback = callback;
    }
}
