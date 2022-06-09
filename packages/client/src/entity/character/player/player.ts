import { AchievementData } from './../../../../../common/types/achievement.d';
import $ from 'jquery';
import _ from 'lodash';

import { Modules } from '@kaetram/common/network';

import Character from '../character';
import Task from './task';
import Skill from './skill';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';

import type Game from '../../../game';

import { EquipmentData } from '@kaetram/common/types/equipment';
import { PlayerData } from '@kaetram/common/types/player';
import { SkillData } from '@kaetram/common/types/skills';
import { QuestData } from '@kaetram/common/types/quest';

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

    public skills = {
        [Modules.Skills.Lumberjacking]: new Skill(Modules.Skills.Lumberjacking),
        [Modules.Skills.Mining]: new Skill(Modules.Skills.Mining)
    };

    public quests: { [key: string]: Task } = {};
    public achievements: { [key: string]: Task } = {};

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
        this.movementSpeed = data.movementSpeed!;

        this.setOrientation(data.orientation);
        this.setGridPosition(data.x, data.y);

        this.setHitPoints(data.hitPoints!, data.maxHitPoints!);

        this.setMana(data.mana!, data.maxMana!);

        if (data.equipments) _.each(data.equipments, this.equip.bind(this));

        // Only used when loading the main player.
        if (data.experience)
            this.setExperience(data.experience, data.nextExperience!, data.prevExperience!);
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

    /**
     * Loads a batch of skills into the player's skill list.
     * @param skills Contains skill type, experience, and level
     * for each skill we are loading.
     */

    public loadSkills(skills: SkillData[]): void {
        _.each(skills, (skill: SkillData) => this.setSkill(skill));
    }

    /**
     * Loads batch of quest data from the server and inserts
     * it into the list of quests stored for the player.
     * @param quests An array of elements each containing quest info.
     */

    public loadQuests(quests: QuestData[]): void {
        _.each(quests, (quest: QuestData) => {
            this.quests[quest.key] = new Task(
                quest.name!,
                quest.description!,
                quest.stage,
                quest.stageCount!,
                quest.subStage
            );
        });
    }

    /**
     * Parses through the array data containing achievement information
     * and creates an object for each key as well as inserting preliminary data.
     * @param achievements Array containing information about each achievement.
     */

    public loadAchievements(achievements: AchievementData[]): void {
        _.each(achievements, (achievement: AchievementData) => {
            this.achievements[achievement.key] = new Task(
                achievement.name!,
                achievement.description!,
                achievement.stage,
                achievement.stageCount!
            );
        });
    }

    /**
     * Equips the item based on the equipment type.
     * @param equipment Contains data about the equipment such as
     * type, name, count, ability, etc.
     */

    public equip(equipment: EquipmentData): void {
        let { type, name, key, count, ability, abilityLevel, power, ranged } = equipment;

        if (!key) return this.unequip(type);

        this.equipments[type].update(key, name, count, ability, abilityLevel, power, ranged);
    }

    /**
     * Calls an empty update() function onto the equipment slot
     * and resets it.
     * @param type Which equipment slot we are resetting.
     */

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

    /**
     * @returns The key of the currently equipped armour.
     */

    public getSpriteName(): string {
        return this.equipments[Modules.Equipment.Armour].key;
    }

    /**
     * @returns The armour object of the player.
     */

    public getArmour(): Armour {
        return this.equipments[Modules.Equipment.Armour] as Armour;
    }

    /**
     * @returns The boots object of the player.
     */

    public getBoots(): Boots {
        return this.equipments[Modules.Equipment.Boots] as Boots;
    }

    /**
     * @returns The pendant object of the player.
     */

    public getPendant(): Pendant {
        return this.equipments[Modules.Equipment.Pendant] as Pendant;
    }

    /**
     * @returns The ring object of the player.
     */

    public getRing(): Ring {
        return this.equipments[Modules.Equipment.Ring] as Ring;
    }

    /**
     * @returns The weapon object of the player.
     */

    public getWeapon(): Weapon {
        return this.equipments[Modules.Equipment.Weapon] as Weapon;
    }

    /**
     * Updates the mana of the player.
     * @param mana The current amount of mana.
     * @param maxMana Optional parameter for the max mana.
     */

    public setMana(mana: number, maxMana?: number): void {
        this.mana = mana;

        if (maxMana) this.maxMana = maxMana;
    }

    /**
     * Updates the experience of the skill.
     * @param arg0 Contains skill data such as type, experience, level, etc.
     */

    public setSkill({ type, experience, level, percentage }: SkillData): void {
        this.skills[type as Modules.Skills].update(experience, level!, percentage!);
    }

    /**
     * Updates data of the quest based on the key provided with the new stage and
     * substage information.
     * @param key The key of the quest we are updating.
     * @param stage The new stage of the quest.
     * @param subStage The new substage of the quest.
     */

    public setQuest(key: string, stage: number, subStage: number): void {
        this.quests[key]?.update(stage, subStage);
    }

    /**
     * Updates data about an achievement using the provided key.
     * @param key The key of the achievement we are updating.
     * @param stage The new stage of the achievement.
     */

    public setAchievement(key: string, stage: number, name: string): void {
        this.achievements[key]?.update(stage, undefined, name);
    }

    /**
     * Updates the poison status of the player.
     * @param poison Poison status to update with.
     */

    public setPoison(poison: boolean): void {
        if (this.poison === poison) return;

        this.poison = poison;

        if (this.poison)
            $('#health').css('background', '-webkit-linear-gradient(right, #079231, #012b0c)');
        else $('#health').css('background', '-webkit-linear-gradient(right, #ff0000, #ef5a5a)');
    }

    /**
     * Updates the player's current experience and creates a callback if the next
     * experience and previous variables are provided.
     * @param experience The current amount of experience the player has.
     * @param nextExperience The next amount of experience required for level up.
     * @param prevExperience Experience that the current level starts at.
     */

    public setExperience(
        experience: number,
        nextExperience?: number,
        prevExperience?: number
    ): void {
        this.experience = experience;

        this.sync();

        if (!prevExperience || !nextExperience) return;

        this.experienceCallback?.(experience, prevExperience, nextExperience);
    }

    /**
     * @returns If the weapon the player currently wields is a ranged weapon.
     */

    public isRanged(): boolean {
        return this.equipments[Modules.Equipment.Weapon].ranged;
    }

    /**
     * @returns Whether or not the current weapon's key isn't an empty string.
     */

    public override hasWeapon(): boolean {
        return this.equipments[Modules.Equipment.Weapon].exists();
    }

    /**
     * @returns Checks whether any of the keyboard directional
     * movement conditionals are true.
     */

    public hasKeyboardMovement(): boolean {
        return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
    }

    /**
     * Callback for when the player's experience changes.
     * @param callback Contains the experience, previous experience, and next experience.
     */

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
