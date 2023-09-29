import Task from './task';
import Skill from './skill';
import Ability from './ability';
import Friend from './friend';
import Equipment from './equipment';

import Character from '../character';

import { Modules } from '@kaetram/common/network';

import type Game from '../../../game';
import type { Light } from '@kaetram/common/types/item';
import type { GuildPacketData } from '@kaetram/common/types/messages/outgoing';
import type { AchievementData } from '@kaetram/common/network/impl/achievement';
import type { PlayerData } from '@kaetram/common/network/impl/player';
import type { SkillData } from '@kaetram/common/network/impl/skill';
import type { QuestData } from '@kaetram/common/network/impl/quest';
import type { AbilityData } from '@kaetram/common/network/impl/ability';
import type { Friend as FriendType } from '@kaetram/common/network/impl/friends';
import type { GuildData, Member } from '@kaetram/common/network/impl/guild';
import type { EquipmentData } from '@kaetram/common/network/impl/equipment';

type AbilityCallback = (key: string, level: number, quickSlot: number) => void;
type PoisonCallback = (status: boolean) => void;
type ManaCallback = (mana: number, maxMana: number) => void;

export default class Player extends Character {
    public serverId = -1;

    public pvpKills = -1;
    public pvpDeaths = -1;

    public moveLeft = false;
    public moveRight = false;
    public moveUp = false;
    public moveDown = false;

    public poison = false;
    public disableAction = false;
    public joystickMovement = false;
    public hasPet = false;

    public rank: Modules.Ranks = Modules.Ranks.None;
    public crown: Modules.Crowns = Modules.Crowns.None;

    public guild!: Partial<GuildData> | undefined;

    private equipmentOrder = Modules.EquipmentRenderOrder;

    public override hitPoints = 0;
    public override maxHitPoints = 0;

    public override mana = 0;
    public override maxMana = 0;

    protected override attackAnimationSpeed = 120;
    protected override walkAnimationSpeed = 160;

    // Mapping of all equipments to their type.
    public equipments: { [key: number]: Equipment } = {};

    public skills: { [key: number]: Skill } = {};
    public abilities: { [key: string]: Ability } = {};
    public quests: { [key: string]: Task } = {};
    public achievements: { [key: string]: Task } = {};
    public friends: { [key: string]: Friend } = {};

    private syncCallback?: () => void;
    private poisonCallback?: PoisonCallback;
    private abilityCallback?: AbilityCallback;
    private manaCallback?: ManaCallback;

    public constructor(instance: string, game: Game) {
        super(instance, Modules.EntityType.Player, game);

        this.createEquipments();
    }

    /**
     * Iterates through the available equipment types and creates an empty
     * equipment object for each type. Since we're dealing with an enum, we
     * check that what we're iterating over is the number/integer value.
     */

    public createEquipments(): void {
        for (let key in Modules.Equipment) {
            let type = parseInt(key);

            if (isNaN(type)) continue;

            this.equipments[type] = new Equipment();
        }

        this.equipments[Modules.Equipment.Weapon].drawable = true;
        this.equipments[Modules.Equipment.Shield].drawable = true;
        this.equipments[Modules.Equipment.Cape].drawable = true;
    }

    /**
     * Loads the player based on the serialzied player
     * data sent from the server.
     * @param data Player data containing essentials.
     * @param sync Whether to sync the player.
     */

    public load(data: PlayerData, sync = false): void {
        this.instance = data.instance;
        this.name = data.name;
        this.level = data.level!;
        this.movementSpeed = data.movementSpeed!;
        this.orientation = data.orientation!;
        this.attackRange = data.attackRange!;

        if (data.displayInfo) this.nameColour = data.displayInfo.colour!;

        this.setRank(data.rank);
        this.setOrientation(data.orientation);

        if (!sync) this.setGridPosition(data.x, data.y);

        this.setHitPoints(data.hitPoints!, data.maxHitPoints);

        this.setMana(data.mana!, data.maxMana);

        if (data.equipments) for (let equipment of data.equipments) this.equip(equipment);
    }

    /**
     * Loads a batch of skills into the player's skill list.
     * @param skills Contains skill type, experience, and level
     * for each skill we are loading.
     */

    public loadSkills(skills: SkillData[]): void {
        for (let skill of skills) this.setSkill(skill);
    }

    /**
     * Loads batch of quest data from the server and inserts
     * it into the list of quests stored for the player.
     * @param quests An array of elements each containing quest info.
     */

    public loadQuests(quests: QuestData[]): void {
        for (let [i, quest] of quests.entries())
            this.quests[quest.key] = new Task(
                i,
                quest.name!,
                quest.description!,
                quest.stage,
                quest.stageCount!,
                quest.subStage,
                quest.rewards,
                quest.skillRequirements,
                quest.questRequirements
            );
    }

    /**
     * Parses through the array data containing achievement information
     * and creates an object for each key as well as inserting preliminary data.
     * @param achievements Array containing information about each achievement.
     */

    public loadAchievements(achievements: AchievementData[]): void {
        for (let i in achievements) {
            let achievement = achievements[i],
                task = new Task(
                    parseInt(i),
                    achievement.name!,
                    achievement.description!,
                    achievement.stage,
                    achievement.stageCount!
                );

            // Secret tasks are displayed slightly different.
            if (achievement.secret) task.secret = true;

            // Achievements may have a region specified.
            if (achievement.region) task.region = achievement.region;

            this.achievements[achievement.key] = task;
        }
    }

    /**
     * Parses through the serialized ability data and creates a new ability object.
     * @param abilities List of abilities received from the server.
     */

    public loadAbilities(abilities: AbilityData[]): void {
        for (let ability of abilities)
            this.setAbility(ability.key, ability.level, ability.type, ability.quickSlot);
    }

    /**
     * Loads the friend list from the server into the client.
     * @param friends Contains information about friend usernames and their online status.
     */

    public loadFriends(friends: FriendType): void {
        let i = 0;

        for (let username in friends) {
            let info = friends[username];

            this.friends[username] = new Friend(i, username, info.online, info.serverId);

            i++;
        }
    }

    /**
     * Equips the item based on the equipment type.
     * @param equipment Contains data about the equipment such as
     * type, name, count, ability, etc.
     */

    public equip(equipment: EquipmentData): void {
        let {
            type,
            name,
            key,
            count,
            enchantments,
            attackRange,
            attackStats,
            defenseStats,
            bonuses,
            attackStyle,
            attackStyles,
            bow,
            light
        } = equipment;

        if (!key) return this.unequip(type);

        // Weapon skin uses the weapon folder instead of a separate one.
        let prefix = type === Modules.Equipment.WeaponSkin ? 'weapon' : this.getType(type);

        this.equipments[type].update(
            prefix ? `player/${prefix}/${key}` : `items/${key}`,
            name,
            count,
            enchantments,
            attackStats,
            defenseStats,
            bonuses
        );

        // Updates the weapon attack range and attack style.
        if (type === Modules.Equipment.Weapon) {
            this.attackRange = attackRange || 1;
            this.setAttackStyle(attackStyle!, attackStyles!);

            this.equipments[type].bow = !!bow;
        }

        // If a light is present on the equipment just apply it.
        if (light) this.equipments[type].light = light;

        this.updateEquipmentAppearance();
    }

    /**
     * Adds a new friend to the list.
     * @param username The username of the friend.
     * @param status Whether the friend is online or not.
     */

    public addFriend(username: string, status: boolean, serverId: number): void {
        this.friends[username] = new Friend(
            Object.keys(this.friends).length,
            username,
            status,
            serverId
        );
    }

    /**
     * Handles adding a guild member to the guild list.
     * @param username The username of the guild member.
     * @param serverId The server id of the guild member.
     */

    public addGuildMember(username: string, serverId: number): void {
        if (!this.hasMember(username)) return;

        // Add the member to the guild list.
        this.guild!.members!.push({
            username,
            serverId
        });
    }

    /**
     * Calls an empty update() function onto the equipment slot
     * and resets it.
     * @param type Which equipment slot we are resetting.
     * @param count Optional parameter to remove a certain amount of items.
     */

    public unequip(type: Modules.Equipment, count = -1): void {
        // Decrement count if provided, otherwise reset the equipment slot.
        if (count > 0) this.equipments[type].count = count;
        else this.equipments[type].update();

        this.updateEquipmentAppearance();
    }

    /**
     * Removes a guild member given their username.
     * @param username The username of the guild member we are removing.
     */

    public removeGuildMember(username: string): void {
        if (!this.hasMember(username)) return;

        let index = this.guild!.members!.findIndex((member) => member.username === username);

        this.guild!.members!.splice(index, 1);
    }

    /**
     * Signals to the callbacks that the player's data (experience, level, equipment)
     * has undergone a change. This updates the UI essentially.
     */

    public sync(): void {
        this.syncCallback?.();
    }

    /**
     * Synchronizes the player's appearance with its weapon/armour skin and depending on
     * in-game properties like a PVP flag. This is called when the player equips or unequips
     * an equipment or when the player's PVP flag is toggled.
     */

    public updateEquipmentAppearance(): void {
        // Skins are not drawable in PVP.
        this.getArmourSkin().drawable = !this.game.pvp;
        this.getWeaponSkin().drawable = !this.game.pvp;

        let weaponHidden = !!this.getWeaponSkin().key && this.getWeaponSkin().drawable,
            armourHidden = !!this.getArmourSkin().key && this.getArmourSkin().drawable;

        // Check if we have a weapon skin equipped and update the weapon appearance.
        this.getWeapon().drawable = !weaponHidden;

        // Check if we have an armour skin equipped and update the armour appearance.
        this.toggleDrawableEquipments(!armourHidden);
    }

    /**
     * Override for the idling function which also adds checking for keyboard
     * movement and prevents setting idle during keyboard movement.
     * @param o Optional parameter if we want to update the orientation.
     * @param force Whether or not we force the idle animation.
     */

    public override idle(o?: Modules.Orientation, force = false): void {
        // Check for moving instead of path if keyboard movement is enabled.
        if ((this.hasKeyboardMovement() || this.hasAttackers() || this.hasTarget()) && this.moving)
            return;

        // ?? this shouldn't affect anything but it does so just leave it for now.
        if (this.hasPath()) return;

        super.idle(o, force);
    }

    /**
     * @returns The key of the currently equipped armour.
     */

    public getSpriteName(): string {
        let armourSkin = this.getArmourSkin();

        // Use the armour skin if it exists.
        if (armourSkin.key && armourSkin.drawable) return armourSkin.key;

        return 'player/base';
    }

    //// Shortcut functions for getting equipment objects. ////

    /**
     * @returns The helmet object of the player.
     */

    public getHelmet(): Equipment {
        return this.equipments[Modules.Equipment.Helmet];
    }

    /**
     * @returns The pendant object of the player.
     */

    public getPendant(): Equipment {
        return this.equipments[Modules.Equipment.Pendant];
    }

    /**
     * @returns The arrows object of the player.
     */

    public getArrows(): Equipment {
        return this.equipments[Modules.Equipment.Arrows];
    }

    /**
     * @returns The chestplate object of the player.
     */

    public getChestplate(): Equipment {
        return this.equipments[Modules.Equipment.Chestplate];
    }

    /**
     * @returns The weapon object of the player.
     */

    public getWeapon(): Equipment {
        return this.equipments[Modules.Equipment.Weapon];
    }

    /**
     * @returns The shield object of the player.
     */

    public getShield(): Equipment {
        return this.equipments[Modules.Equipment.Shield];
    }

    /**
     * @returns The ring object of the player.
     */

    public getRing(): Equipment {
        return this.equipments[Modules.Equipment.Ring];
    }

    /**
     * @returns The weapon skin object of the player.
     */

    public getWeaponSkin(): Equipment {
        return this.equipments[Modules.Equipment.WeaponSkin];
    }

    /**
     * @returns The armour skin object of the player.
     */

    public getArmourSkin(): Equipment {
        return this.equipments[Modules.Equipment.ArmourSkin];
    }

    /**
     * @returns The legplate equipment object.
     */

    public getLegplate(): Equipment {
        return this.equipments[Modules.Equipment.Legplates];
    }

    /**
     * @returns The cape equipment object.
     */

    public getCape(): Equipment {
        return this.equipments[Modules.Equipment.Cape];
    }

    /**
     * @returns The boots object of the player.
     */

    public getBoots(): Equipment {
        return this.equipments[Modules.Equipment.Boots];
    }

    /**
     * @returns Whether the player has the administrator rank.
     */

    public override isAdmin(): boolean {
        return this.rank === Modules.Ranks.Admin || this.rank === Modules.Ranks.HollowAdmin;
    }

    /**
     * @returns Whether the player has the moderator rank.
     */

    public override isModerator(): boolean {
        return this.rank === Modules.Ranks.Moderator;
    }

    /**
     * Adds up the experience from every skill and returns the total.
     * @returns Integer value of the total experience.
     */

    public getTotalExperience(): number {
        let total = 0;

        for (let skill of Object.values(this.skills)) total += skill.experience;

        return total;
    }

    /**
     * @returns The key of the crown based on the player's crown type.
     */

    public getCrownKey(): string {
        switch (this.crown) {
            case Modules.Crowns.Silver: {
                return 'silvermedal';
            }

            case Modules.Crowns.Gold: {
                return 'goldmedal';
            }

            case Modules.Crowns.Artist: {
                return 'crown-artist';
            }

            case Modules.Crowns.Tier1: {
                return 'crown-tier1';
            }

            case Modules.Crowns.Tier2: {
                return 'crown-tier2';
            }

            case Modules.Crowns.Tier3: {
                return 'crown-tier3';
            }

            case Modules.Crowns.Tier4: {
                return 'crown-tier4';
            }

            case Modules.Crowns.Tier5: {
                return 'crown-tier5';
            }

            case Modules.Crowns.Tier6: {
                return 'crown-tier6';
            }

            case Modules.Crowns.Tier7: {
                return 'crown-tier7';
            }

            default: {
                return '';
            }
        }
    }

    /**
     * Returns a crown based on the player's rank.
     * @returns The crown type for the player's rank.
     */

    private getRankCrown(): Modules.Crowns {
        switch (this.rank) {
            case Modules.Ranks.Artist: {
                return Modules.Crowns.Artist;
            }

            case Modules.Ranks.TierOne: {
                return Modules.Crowns.Tier1;
            }

            case Modules.Ranks.TierTwo: {
                return Modules.Crowns.Tier2;
            }

            case Modules.Ranks.TierThree: {
                return Modules.Crowns.Tier3;
            }

            case Modules.Ranks.TierFour: {
                return Modules.Crowns.Tier4;
            }

            case Modules.Ranks.TierFive: {
                return Modules.Crowns.Tier5;
            }

            case Modules.Ranks.TierSix: {
                return Modules.Crowns.Tier6;
            }

            case Modules.Ranks.TierSeven: {
                return Modules.Crowns.Tier7;
            }

            default: {
                return Modules.Crowns.None;
            }
        }
    }

    /**
     * Used for obtaining the path for the type of equipment.
     * @param type The type of equipment we are trying to get the path for.
     */

    private getType(type: Modules.Equipment): string {
        switch (type) {
            case Modules.Equipment.Helmet: {
                return 'helmet';
            }

            case Modules.Equipment.Chestplate: {
                return 'chestplate';
            }

            case Modules.Equipment.Legplates: {
                return 'legplates';
            }

            case Modules.Equipment.Weapon: {
                return 'weapon';
            }

            case Modules.Equipment.WeaponSkin: {
                return 'weaponskin';
            }

            case Modules.Equipment.ArmourSkin: {
                return 'skin';
            }

            case Modules.Equipment.Shield: {
                return 'shield';
            }

            case Modules.Equipment.Cape: {
                return 'cape';
            }

            default: {
                return '';
            }
        }
    }

    /**
     * Grabs the light object from the weapon.
     * @returns The light object of the weapon.
     */

    public getLight(): Light {
        return this.getShield().light;
    }

    /**
     * Attempts to find a guild member based on their username.
     * @param username The username of the guild member we are looking for.
     * @returns The guild member object if found, otherwise undefined.
     */

    public getGuildMember(username: string): Member | undefined {
        if (!this.guild) return;

        return this.guild.members?.find((member) => member.username === username);
    }

    /**
     * Updates the mana of the player.
     * @param mana The current amount of mana.
     * @param maxMana Optional parameter for the max mana.
     */

    public setMana(mana: number, maxMana?: number): void {
        this.mana = mana;

        if (maxMana) this.maxMana = maxMana;

        this.manaCallback?.(this.mana, maxMana || this.maxMana);
    }

    /**
     * Updates the experience of the skill or create a new one first if it doesn't exist.
     * @param arg0 Contains skill data such as type, experience, level, etc.
     */

    public setSkill({ type, experience, level, percentage, nextExperience }: SkillData): void {
        if (!this.skills[type]) this.skills[type] = new Skill(type);

        this.skills[type as Modules.Skills].update(
            experience,
            nextExperience!,
            level!,
            percentage!
        );
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
     * @param name The name of the achievement.
     * @param description The description of the achievement.
     */

    public setAchievement(key: string, stage: number, name: string, description: string): void {
        // Secret achievements that are not loaded initially.
        if (!(key in this.achievements)) {
            let task = new Task(Object.keys(this.achievements).length - 1, name, description);

            // Only secret achievements are created this way.
            task.secret = true;

            this.achievements[key] = task;

            return;
        }

        this.achievements[key]?.update(stage, undefined, name, description);
    }

    /**
     * Updates an ability's key and level.
     * @param key The key of the ability we are updating.
     * @param level The level of the ability.
     * @param type Optional parameter passed when we are creating a new ability.
     * @param quickSlot The id of the quickslot the ability is in.
     */

    public setAbility(
        key: string,
        level: number,
        type?: Modules.AbilityType,
        quickSlot = -1
    ): void {
        // This function is used when adding abilities for the first time too.
        if (key in this.abilities) this.abilities[key]?.update(level, quickSlot);
        else this.abilities[key] = new Ability(type!, key, level, quickSlot);

        // If any active ability is detected then we create a callback to display the quick slots.
        if (type === Modules.AbilityType.Active || quickSlot !== -1)
            this.abilityCallback?.(key, level, quickSlot);
    }

    /**
     * Updates the poison status of the player.
     * @param poison Poison status to update with.
     */

    public setPoison(poison: boolean): void {
        this.poison = poison;

        this.poisonCallback?.(poison);
    }

    /**
     * Updates the online status of a friend.
     * @param username The username of the friend we are updating.
     * @param status The online status of the friend.
     * @param serverId The server id of the friend.
     */

    public setFriendStatus(username: string, status: boolean, serverId: number): void {
        this.friends[username].online = status;
        this.friends[username].serverId = serverId;
    }

    /**
     * Updates the attack styles of the weapon. This occurs when a player already has a weapon
     * equipped and they change their attack style.
     * @param style The active attack style of the weapon.
     * @param styles (Optional) The list of all attack styles of the weapon.
     */

    public setAttackStyle(style: Modules.AttackStyle, styles?: Modules.AttackStyle[]): void {
        this.getWeapon().attackStyle = style;

        // May be null when we're swapping attack styles.
        if (styles) this.getWeapon().attackStyles = styles;
    }

    /**
     * Updates the player's rank and synchronizes the Crowns.
     * @param rank The new rank of the player.
     */

    public setRank(rank: Modules.Ranks): void {
        this.rank = rank;
        this.crown = this.getRankCrown();
    }

    /**
     * Synchronizes the guild connect packet with the player's guild information.
     * @param packet Contains information about the guild we are updating.
     */

    public setGuild(packet?: GuildPacketData): void {
        if (!packet) {
            this.guild = undefined;
            return;
        }

        this.guild = {
            name: packet.name,
            members: packet.members
        };
    }

    /**
     * An override function for the superclass `setAnimation` where we adjust the animation
     * currently performed by the player depending on the weapon they are equipping. Bows use
     * a different animation than normal melee weapons.
     * @param name The name of the animation that we are setting.
     * @param speed The speed at which to animate the player.
     * @param count The amount of times to play the animation.
     * @param onEndCount The callback to execute when the animation has finished playing.
     */

    public override setAnimation(
        name: string,
        speed = 120,
        count = 0,
        onEndCount?: () => void
    ): void {
        // Update the animation name if we're using a bow.
        if (name === 'atk' && this.getWeapon().bow) name = 'bow_atk';

        super.setAnimation(name, speed, count, onEndCount);
    }

    /**
     * Attempts to update the values of a guild member based on their username.
     * @param username The username of the guild member we are updating.
     * @param rank The rank we want to update, defaults to the lowest
     */

    public setGuildMember(
        username: string,
        rank: Modules.GuildRank = Modules.GuildRank.Fledgling
    ): void {
        if (!this.guild) return;

        // Attempt to find the guild member.
        let member = this.guild.members?.find((member) => member.username === username);

        if (!member) return;

        member.rank = rank;
    }

    /**
     * Override for the `setOrientation` function to also update the positioning
     * of the cape and weapon relative to the player.
     * @param orientation The new orientation that we are setting.
     */

    public override setOrientation(orientation: Modules.Orientation): void {
        super.setOrientation(orientation);

        // Reset the equipment order to the default.
        this.equipmentOrder = Modules.EquipmentRenderOrder;

        switch (orientation) {
            case Modules.Orientation.Up: {
                this.equipmentOrder = [
                    Modules.Equipment.Legplates,
                    Modules.Equipment.Chestplate,
                    Modules.Equipment.Helmet,
                    Modules.Equipment.ArmourSkin,
                    Modules.Equipment.Shield,
                    Modules.Equipment.Weapon,
                    Modules.Equipment.WeaponSkin,
                    Modules.Equipment.Cape
                ];
                break;
            }
        }
    }

    /**
     * Updates the active status of an ability.
     * @param key The key of the ability we are updating.
     */

    public toggleAbility(key: string): void {
        this.abilities[key]?.toggle();
    }

    /**
     * Toggles the drawable state of player equipments. These are used by
     * the player's skin to hide rendering of equipments.
     * @param state The state we want to set for the drawable state.
     */

    private toggleDrawableEquipments(state = false): void {
        this.getHelmet().drawable = state;
        this.getChestplate().drawable = state;
        this.getLegplate().drawable = state;
    }

    /**
     * @returns If the weapon the player currently wields is a ranged weapon.
     */

    public isRanged(): boolean {
        return this.attackRange > 1;
    }

    /**
     * @returns Whether or not the player has a ranged-based magic weapon.
     */

    public isMagic(): boolean {
        return this.getWeapon().bonuses.magic > 0 && this.isRanged();
    }

    /**
     * @returns Whether or not the current weapon's key isn't an empty string.
     */

    public hasWeapon(): boolean {
        return this.equipments[Modules.Equipment.Weapon].exists();
    }

    /**
     * @returns Whether or not the player has a rank.
     */

    public hasRank(): boolean {
        return this.rank !== Modules.Ranks.None;
    }

    /**
     * @returns Whether or not the player has a crown.
     */

    public override hasCrown(): boolean {
        return this.crown !== Modules.Crowns.None;
    }

    /**
     * @returns Checks whether any of the keyboard directional
     * movement conditionals are true.
     */

    public hasKeyboardMovement(): boolean {
        return this.moveLeft || this.moveRight || this.moveUp || this.moveDown;
    }

    /**
     * @param username The username of the friend we are checking.
     * @returns Whether or not the player has a friend with the given username.
     */

    public hasFriend(username: string): boolean {
        return username.toLowerCase() in this.friends;
    }

    /**
     * Checks if the current player has a light source equipped.
     * @returns Whether the light contains an inner or outer light source.
     */

    public hasLight(): boolean {
        let light = this.getLight();

        return !!(light?.outer || light?.inner);
    }

    /**
     * Whether or not the guild has a member with the given username.
     * @param username The username of the guild member we are checking.
     * @returns Whether or not the guild has a member with the given username.
     */

    public hasMember(username: string): boolean {
        if (!this.guild) return false;

        let exists = false;

        for (let i in this.guild.members) {
            let member = this.guild.members[i as never] as Member;

            if (member.username === username) {
                exists = true;
                break;
            }
        }

        return exists;
    }

    /**
     * Iterates through the renderable equipments and executes the callback. This function
     * is used by the rendering system to draw the paperdoll equipments.
     * @param callback Contains the equipment currently being iterated and its type.
     * @param ignoreEmpty Whether or not we want to iterate through all equipment or just the ones that exist.
     */

    public forEachEquipment(
        callback: (equipment: Equipment, type?: number) => void,
        ignoreEmpty = false
    ): void {
        for (let type of this.equipmentOrder) {
            let equipment = this.equipments[type as never] as Equipment;

            if (!equipment.drawable) continue;
            if (ignoreEmpty && !equipment.exists()) continue;

            callback(equipment, ~~type);
        }
    }

    /**
     * Callback for when the poison status undergoes a change.
     * @param callback Contains information about the current poison status.
     */

    public onPoison(callback: PoisonCallback): void {
        this.poisonCallback = callback;
    }

    /**
     * Callback for whenever we want to synchronize
     * the player's data to the UI.
     */

    public onSync(callback: () => void): void {
        this.syncCallback = callback;
    }

    /**
     * Callback for when an active ability is added and we signal to the
     * client that we want to display the quick slots menu.
     */

    public onAbility(callback: AbilityCallback): void {
        this.abilityCallback = callback;
    }

    /**
     * Callback for when the player's mana changes.
     * @param callback Contains the current mana and max mana.
     */

    public onMana(callback: ManaCallback): void {
        this.manaCallback = callback;
    }
}
