import _ from 'lodash';

import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Incoming from '../../../../controllers/incoming';
import Quests from '../../../../controllers/quests';
import Messages, { Packet } from '../../../../network/messages';
import Constants from '../../../../util/constants';
import Formulas from '../../../../util/formulas';
import Items from '../../../../util/items';
import Character, { CharacterState } from '../character';
import Hit from '../combat/hit';
import Abilities from './abilities/abilities';
import Bank from './containers/bank/bank';
import Inventory from './containers/inventory/inventory';
import Doors from './doors';
import Enchant from './enchant';
import Armour from './equipment/armour';
import Boots from './equipment/boots';
import Pendant from './equipment/pendant';
import Ring from './equipment/ring';
import Weapon from './equipment/weapon';
import Friends from './friends';
import Handler from './handler';
import HitPoints from './points/hitpoints';
import Mana from './points/mana';
import Professions from './professions/professions';
import Trade from './trade';
import Warp from './warp';

import type { EquipmentData } from '@kaetram/common/types/info';
import type { ExperienceCombatData } from '@kaetram/common/types/messages';
import type MongoDB from '../../../../database/mongodb/mongodb';
import type Area from '../../../../map/areas/area';
import type { MinigameState } from '../../../../minigames/minigame';
import type Connection from '../../../../network/connection';
import type World from '../../../world';
import type NPC from '../../npc/npc';
import type { FullPlayerData } from './../../../../database/mongodb/creator';
import type Lumberjacking from './professions/impl/lumberjacking';
import type Introduction from './quests/impl/introduction';

type TeleportCallback = (x: number, y: number, isDoor: boolean) => void;
type KillCallback = (character: Character) => void;
type InterfaceCallback = (state: boolean) => void;
type NPCTalkCallback = (npc: NPC) => void;
type DoorCallback = (x: number, y: number) => void;

type Equipment = [id: number, count: number, ability: number, level: number];

export interface PlayerEquipment {
    username: string;
    armour: Equipment;
    weapon: Equipment;
    pendant: Equipment;
    ring: Equipment;
    boots: Equipment;
}
export interface PlayerRegions {
    regions: string;
    gameVersion: string;
}

interface PlayerState extends CharacterState {
    rights: number;
    level: number;
    pvp: boolean;
    pvpKills: number;
    pvpDeaths: number;
    attackRange: number;
    orientation: number;
    hitPoints: number[];
    mana: number[];
    armour: EquipmentData;
    weapon: EquipmentData;
    pendant: EquipmentData;
    ring: EquipmentData;
    boots: EquipmentData;
}

export interface ObjectData {
    [index: number]: {
        isObject: boolean;
        cursor: string | undefined;
    };
}

interface SurroundingTrees {
    indexes: number[];
    data: number[][];
    collisions: boolean[];
    objectData: ObjectData;
}

export default class Player extends Character {
    public map;
    private regions;
    private entities;
    private globalObjects;

    public incoming;

    public ready = false;

    private regionPosition: number[] | null = null;

    private newRegion = false;

    public team?: string; // TODO
    public userAgent!: string;
    public minigame?: MinigameState; // TODO

    private disconnectTimeout: NodeJS.Timeout | null = null;
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes
    public lastRegionChange = Date.now();

    private handler;

    public inventory;
    public professions;
    public abilities;
    public friends;
    public enchant;
    public bank;
    public quests;
    public trade;
    public doors;
    public warp;

    private introduced = false;
    private currentSong: string | null = null;
    private acceptedTrade = false;
    private noDamage = false;
    public isGuest = false;

    public canTalk = true;
    public webSocketClient;

    private visible = true;

    public talkIndex = 0;
    public cheatScore = 0;
    public defaultMovementSpeed = 250; // For fallback.

    public regionsLoaded: string[] = [];
    public lightsLoaded: number[] = [];

    public npcTalk: number | string | null = null;

    // public username: string;
    public password!: string;
    public email!: string;

    public rights!: number;
    public experience!: number;
    public ban!: number;
    public mute!: number;
    public lastLogin!: number;
    public pvpKills!: number;
    public pvpDeaths!: number;
    public orientation!: number;
    public mapVersion!: number;

    private nextExperience: number | undefined;
    private prevExperience!: number;
    public playerHitPoints!: HitPoints;
    public mana!: Mana;

    public armour!: Armour;
    public weapon!: Weapon;
    // public pendant: Pendant;
    // public ring: Ring;
    // public boots: Boots;

    public cameraArea: Area | undefined;
    private overlayArea: Area | undefined;

    private permanentPVP = false;
    public movementStart!: number;

    public pingTime!: number;

    public regionWidth!: number;
    public regionHeight!: number;

    public questsLoaded = false;
    public achievementsLoaded = false;

    public new = false;
    private lastNotify!: number;
    private profileDialogOpen = false;
    private inventoryOpen = false;
    private warpOpen = false;

    public selectedShopItem!: { id: number; index: number } | null;

    private teleportCallback?: TeleportCallback;
    private cheatScoreCallback?(): void;
    private profileToggleCallback?: InterfaceCallback;
    private inventoryToggleCallback?: InterfaceCallback;
    private warpToggleCallback?: InterfaceCallback;
    private orientationCallback?(): void;
    private regionCallback?(): void;
    private killCallback?: KillCallback;
    public npcTalkCallback?: NPCTalkCallback;
    public doorCallback?: DoorCallback;
    public readyCallback?(): void;

    public constructor(
        public world: World,
        public database: MongoDB,
        public connection: Connection,
        public clientId: string
    ) {
        super(-1, 'player', connection.id, -1, -1);

        this.map = world.map;
        this.regions = world.map.regions;
        this.entities = world.entities;
        this.globalObjects = world.globalObjects;

        this.incoming = new Incoming(this);

        this.handler = new Handler(this);

        this.inventory = new Inventory(this, 20);
        this.professions = new Professions(this);
        this.abilities = new Abilities(this);
        this.friends = new Friends(this);
        this.enchant = new Enchant(this);
        this.bank = new Bank(this, 56);
        this.quests = new Quests(this);
        this.trade = new Trade(this);
        this.doors = new Doors(this);
        this.warp = new Warp(this);

        this.webSocketClient = connection.type === 'WebSocket';
    }

    public load(data: FullPlayerData): void {
        this.rights = data.rights;
        this.experience = data.experience;
        this.ban = data.ban;
        this.mute = data.mute;
        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;

        this.warp.setLastWarp(data.lastWarp);

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);
        this.playerHitPoints = new HitPoints(data.hitPoints, Formulas.getMaxHitPoints(this.level));
        this.mana = new Mana(data.mana, Formulas.getMaxMana(this.level));

        if (data.invisibleIds)
            this.invisiblesIds = data.invisibleIds.split(' ').map((id) => parseInt(id));

        this.userAgent = data.userAgent;

        let { x, y, armour, weapon, pendant, ring, boots } = data;

        this.setPosition(x, y);
        this.setArmour(...armour);
        this.setWeapon(...weapon);
        this.setPendant(...pendant);
        this.setRing(...ring);
        this.setBoots(...boots);
    }

    public destroy(): void {
        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = null;

        this.handler.destroy();

        this.handler = null!;
        this.inventory = null!;
        this.abilities = null!;
        this.enchant = null!;
        this.bank = null!;
        this.quests = null!;
        this.trade = null!;
        this.doors = null!;
        this.warp = null!;

        this.connection = null!;
    }

    public loadRegions(regions: PlayerRegions): void {
        if (!regions) return;

        if (this.mapVersion !== this.map.version) {
            this.mapVersion = this.map.version;

            this.save();

            log.debug(`Updated map version for ${this.username}`);

            return;
        }

        if (regions.gameVersion === config.gver) this.regionsLoaded = regions.regions.split(',');
    }

    public loadProfessions(): void {
        if (config.offlineMode) return;

        this.database.loader.getProfessions(this, (info) => {
            if (!info)
                // If this somehow happens.
                return;

            this.professions.update(info);

            this.sendProfessions();
        });
    }

    public loadFriends(): void {
        if (config.offlineMode) return;

        this.database.loader.getFriends(this, (info) => {
            if (!info) return;

            this.friends.update(info);
        });
    }

    public loadInventory(): void {
        if (config.offlineMode) {
            this.inventory.loadEmpty();
            return;
        }

        this.database.loader.getInventory(this, (ids, counts, skills, skillLevels) => {
            if (ids === null || counts === null) {
                this.inventory.loadEmpty();
                return;
            }

            if (ids.length !== this.inventory.size) this.save();

            this.inventory.load(ids, counts, skills!, skillLevels!);
            this.inventory.check();
        });
    }

    public loadBank(): void {
        if (config.offlineMode) {
            this.bank.loadEmpty();
            return;
        }

        this.database.loader.getBank(this, (ids, counts, skills, skillLevels) => {
            if (ids === null || counts === null) {
                this.bank.loadEmpty();
                return;
            }

            if (ids.length !== this.bank.size) this.save();

            this.bank.load(ids, counts, skills, skillLevels);
            this.bank.check();
        });
    }

    public loadQuests(): void {
        if (config.offlineMode) return;

        this.database.loader.getAchievements(this, (ids, progress) => {
            ids.pop();
            progress.pop();

            if (this.quests.getAchievementSize() !== ids.length) {
                log.info('Mismatch in achievements data.');

                this.save();
            }

            this.quests.updateAchievements(ids, progress);
        });

        this.database.loader.getQuests(this, (ids, stages) => {
            if (!ids || !stages) {
                this.quests.updateQuests(ids, stages);
                return;
            }

            /* Removes the empty space created by the loader */

            ids.pop();
            stages.pop();

            if (this.quests.getQuestSize() !== ids.length) {
                log.info('Mismatch in quest data.');

                this.save();
            }

            this.quests.updateQuests(ids, stages);
        });

        this.quests.onAchievementsReady(() => {
            this.send(
                new Messages.Quest(Opcodes.Quest.AchievementBatch, this.quests.getAchievementData())
            );

            /* Update region here because we receive quest info */
            if (this.questsLoaded) this.updateRegion();

            this.achievementsLoaded = true;
        });

        this.quests.onQuestsReady(() => {
            this.send(new Messages.Quest(Opcodes.Quest.QuestBatch, this.quests.getQuestData()));

            /* Update region here because we receive quest info */
            if (this.achievementsLoaded) this.updateRegion();

            this.questsLoaded = true;
        });
    }

    public intro(): void {
        if (this.ban > Date.now()) {
            this.connection.sendUTF8('ban');
            this.connection.close(`Player: ${this.username} is banned.`);
        }

        if (this.x <= 0 || this.y <= 0) this.sendToSpawn();

        if (this.playerHitPoints.getHitPoints() < 0)
            this.playerHitPoints.setHitPoints(this.getMaxHitPoints());

        if (this.mana.getMana() < 0) this.mana.setMana(this.mana.getMaxMana());

        this.verifyRights();

        let info = {
            instance: this.instance,
            username: Utils.formatUsername(this.username),
            x: this.x,
            y: this.y,
            // kind: this.kind,
            rights: this.rights,
            hitPoints: this.playerHitPoints.getData(),
            mana: this.mana.getData(),
            experience: this.experience,
            nextExperience: this.nextExperience,
            prevExperience: this.prevExperience,
            level: this.level,
            lastLogin: this.lastLogin,
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            orientation: this.orientation,
            movementSpeed: this.getMovementSpeed()
        };

        this.regionPosition = [this.x, this.y];

        /**
         * Send player data to client here
         */

        this.entities.addPlayer(this);

        this.send(new Messages.Welcome(info));
    }

    private verifyRights(): void {
        if (config.moderators.includes(this.username.toLowerCase())) this.rights = 1;

        if (config.administrators.includes(this.username.toLowerCase()) || config.offlineMode)
            this.rights = 2;
    }

    public addExperience(exp: number): void {
        this.experience += exp;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level) {
            this.playerHitPoints.setMaxHitPoints(Formulas.getMaxHitPoints(this.level));
            this.healHitPoints(this.playerHitPoints.maxPoints);

            this.updateRegion();

            this.popup('Level Up!', `Congratulations, you are now level ${this.level}!`, '#ff6600');
        }

        let data = {
            id: this.instance,
            level: this.level
        } as ExperienceCombatData;

        /**
         * Sending two sets of data as other users do not need to
         * know the experience of another player.. (yet).
         */

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Experience(Opcodes.Experience.Combat, data),
            this.instance
        );

        data.amount = exp;
        data.experience = this.experience;
        data.nextExperience = this.nextExperience;
        data.prevExperience = this.prevExperience;

        this.send(new Messages.Experience(Opcodes.Experience.Combat, data));

        this.sync();
    }

    /**
     * Passed from the superclass...
     */
    public override heal(amount: number): void {
        if (!this.playerHitPoints || !this.mana) return;

        this.playerHitPoints.heal(amount);
        this.mana.heal(amount);

        this.sync();
    }

    public healHitPoints(amount: number): void {
        let type = 'health' as const;

        this.playerHitPoints.heal(amount);

        this.sync();

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Heal({
                id: this.instance,
                type,
                amount
            })
        );
    }

    public healManaPoints(amount: number): void {
        let type = 'mana' as const;

        this.mana.heal(amount);

        this.sync();

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Heal({
                id: this.instance,
                type,
                amount
            })
        );
    }

    public eat(id: number): void {
        let Item = Items.getPlugin(id);

        if (!Item) return;

        new Item(id).onUse(this);
    }

    public equip(string: string, count: number, ability: number, abilityLevel: number): void {
        let data = Items.getData(string),
            type!: Modules.Equipment,
            id,
            power;

        if (!data || data === 'null') return;

        log.debug(`Equipping item - ${[string, count, ability, abilityLevel]}`);

        if (Items.isArmour(string)) type = Modules.Equipment.Armour;
        else if (Items.isWeapon(string)) type = Modules.Equipment.Weapon;
        else if (Items.isPendant(string)) type = Modules.Equipment.Pendant;
        else if (Items.isRing(string)) type = Modules.Equipment.Ring;
        else if (Items.isBoots(string)) type = Modules.Equipment.Boots;

        id = Items.stringToId(string)!;
        power = Items.getLevelRequirement(string);

        switch (type) {
            case Modules.Equipment.Armour:
                if (this.hasArmour() && this.armour.id !== 114)
                    this.inventory.add(this.armour.getItem());

                this.setArmour(id, count, ability, abilityLevel);
                break;

            case Modules.Equipment.Weapon:
                if (this.hasWeapon()) this.inventory.add(this.weapon.getItem());

                this.setWeapon(id, count, ability, abilityLevel);
                break;

            case Modules.Equipment.Pendant:
                if (this.hasPendant()) this.inventory.add(this.pendant.getItem());

                this.setPendant(id, count, ability, abilityLevel);
                break;

            case Modules.Equipment.Ring:
                if (this.hasRing()) this.inventory.add(this.ring.getItem());

                this.setRing(id, count, ability, abilityLevel);
                break;

            case Modules.Equipment.Boots:
                if (this.hasBoots()) this.inventory.add(this.boots.getItem());

                this.setBoots(id, count, ability, abilityLevel);
                break;
        }

        this.send(
            new Messages.Equipment(Opcodes.Equipment.Equip, {
                type,
                name: Items.idToName(id),
                string,
                count,
                ability,
                abilityLevel,
                power
            })
        );
    }

    public updateRegion(force = false): void {
        this.world.region.sendRegion(this, this.region, force);
    }

    public isInvisible(instance: string): boolean {
        let entity = this.entities.get(instance);

        if (!entity) return false;

        return super.hasInvisibleId(entity.id) || super.hasInvisible(entity);
    }

    public formatInvisibles(): string {
        return this.invisiblesIds.join(' ');
    }

    public canEquip(string: string): boolean {
        let requirement = Items.getLevelRequirement(string);

        if (requirement > Constants.MAX_LEVEL) requirement = Constants.MAX_LEVEL;

        if (requirement > this.level) {
            this.notify(`You must be at least level ${requirement} to equip this.`);
            return false;
        }

        return true;
    }

    public die(): void {
        this.dead = true;

        this.deathCallback?.();

        this.send(new Messages.Death(this.instance));
    }

    public teleport(x: number, y: number, isDoor = false, animate = false): void {
        this.teleportCallback?.(x, y, isDoor);

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Teleport({
                id: this.instance,
                x,
                y,
                withAnimation: animate
            })
        );

        this.setPosition(x, y);
        this.world.cleanCombat(this);
    }

    /**
     * We route all object clicks through the player instance
     * in order to organize data more neatly.
     */
    public handleObject(id: string): void {
        let info = this.globalObjects.getInfo(id);

        if (!info) return;

        switch (info.type) {
            case 'sign': {
                let data = this.globalObjects.getSignData(id);

                if (!data) return;

                let message = this.globalObjects.talk(data.object, this);

                this.world.push(Opcodes.Push.Player, {
                    player: this,
                    message: new Messages.Bubble({
                        id,
                        text: message,
                        duration: 5000,
                        isObject: true,
                        info: data.info
                    })
                });

                break;
            }

            case 'lumberjacking': {
                let lumberjacking = this.professions.getProfession<Lumberjacking>(
                    Modules.Professions.Lumberjacking
                );

                lumberjacking?.handle(id, info.tree!);

                break;
            }
        }
    }

    public incrementCheatScore(amount: number): void {
        if (this.combat.started) return;

        this.cheatScore += amount;

        this.cheatScoreCallback?.();
    }

    public updatePVP(pvp: boolean, permanent = false): void {
        /**
         * No need to update if the state is the same
         */

        if (!this.region) return;

        if (this.pvp === pvp || this.permanentPVP) return;

        if (this.pvp && !pvp) this.notify('You are no longer in a PvP zone!');
        else this.notify('You have entered a PvP zone!');

        this.pvp = pvp;
        this.permanentPVP = permanent;

        this.sendToAdjacentRegions(this.region, new Messages.PVP(this.instance, this.pvp));
    }

    public updateOverlay(overlay: Area | undefined): void {
        if (this.overlayArea === overlay) return;

        this.overlayArea = overlay;

        if (overlay && overlay.id) {
            this.lightsLoaded = [];

            this.send(
                new Messages.Overlay(Opcodes.Overlay.Set, {
                    image: overlay.fog || 'empty',
                    colour: `rgba(0,0,0,${overlay.darkness})`
                })
            );
        } else this.send(new Messages.Overlay(Opcodes.Overlay.Remove));
    }

    public updateCamera(camera: Area | undefined): void {
        if (this.cameraArea === camera) return;

        this.cameraArea = camera;

        if (camera)
            switch (camera.type) {
                case 'lockX':
                    this.send(new Messages.Camera(Opcodes.Camera.LockX));
                    break;

                case 'lockY':
                    this.send(new Messages.Camera(Opcodes.Camera.LockY));
                    break;

                case 'player':
                    this.send(new Messages.Camera(Opcodes.Camera.Player));
                    break;
            }
        else this.send(new Messages.Camera(Opcodes.Camera.FreeFlow));
    }

    public updateMusic(info?: Area): void {
        if (!info || info.song === this.currentSong) return;

        this.currentSong = info.song;

        this.send(new Messages.Audio(info.song));
    }

    public revertPoints(): void {
        this.playerHitPoints.setHitPoints(this.playerHitPoints.getMaxHitPoints());
        this.mana.setMana(this.mana.getMaxMana());

        this.sync();
    }

    public override applyDamage(damage: number): void {
        this.playerHitPoints.decrement(damage);
    }

    public toggleProfile(state: boolean): void {
        this.profileDialogOpen = state;

        this.profileToggleCallback?.(state);
    }

    public toggleInventory(state: boolean): void {
        this.inventoryOpen = state;

        this.inventoryToggleCallback?.(state);
    }

    public toggleWarp(state: boolean): void {
        this.warpOpen = state;

        this.warpToggleCallback?.(state);
    }

    public getMana(): number {
        return this.mana.getMana();
    }

    public getMaxMana(): number {
        return this.mana.getMaxMana();
    }

    public override getHitPoints(): number {
        return this.playerHitPoints.getHitPoints();
    }

    public override getMaxHitPoints(): number {
        return this.playerHitPoints.getMaxHitPoints();
    }

    public getTutorial(): Introduction {
        return this.quests.getQuest<Introduction>(Modules.Quests.Introduction)!;
    }

    public override getWeaponLevel(): number {
        return this.weapon.getLevel();
    }

    public override getArmourLevel(): number {
        return this.armour.getDefense();
    }

    public getLumberjackingLevel(): number {
        return this.professions.getProfession(Modules.Professions.Lumberjacking)!.getLevel();
    }

    public getWeaponLumberjackingLevel(): number {
        if (!this.hasLumberjackingWeapon()) return -1;

        return this.weapon.lumberjacking;
    }

    public getWeaponMiningLevel(): number {
        if (!this.hasMiningWeapon()) return -1;

        return this.weapon.mining;
    }

    // We get dynamic trees surrounding the player
    public getSurroundingTrees(): SurroundingTrees {
        let tiles: SurroundingTrees = {
            indexes: [],
            data: [],
            collisions: [],
            objectData: {}
        };

        _.each(this.map.treeIndexes, (index: number) => {
            let position = this.map.indexToGridPosition(index + 1),
                treeRegion = this.regions.regionIdFromPosition(position.x, position.y);

            if (!this.regions.isSurrounding(this.region, treeRegion)) return;

            let objectId = this.map.getPositionObject(position.x, position.y),
                cursor = this.map.getCursor(index, objectId);

            tiles.indexes.push(index);
            tiles.data.push(this.map.data[index] as number[]);
            tiles.collisions.push(this.map.collisions.includes(index));

            if (objectId)
                tiles.objectData[index] = {
                    isObject: !!objectId,
                    cursor
                };
        });

        return tiles;
    }

    private getMovementSpeed(): number {
        let itemMovementSpeed = Items.getMovementSpeed(this.armour.name),
            movementSpeed = itemMovementSpeed || this.defaultMovementSpeed;

        /*
         * Here we can handle equipment/potions/abilities that alter
         * the player's movement speed. We then just broadcast it.
         */

        this.movementSpeed = movementSpeed;

        return this.movementSpeed;
    }

    public breakWeapon(): void {
        this.notify('Your weapon has been broken.');

        this.setWeapon(-1, 0, 0, 0);

        this.sendEquipment();
    }

    /**
     * Setters
     */

    public setArmour(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.armour = new Armour(Items.idToString(id), id, count, ability, abilityLevel);
    }

    public setWeapon(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.weapon = new Weapon(Items.idToString(id), id, count, ability, abilityLevel);

        if (this.weapon.ranged) this.attackRange = 7;
    }

    public setPendant(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.pendant = new Pendant(Items.idToString(id), id, count, ability, abilityLevel);
    }

    public setRing(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.ring = new Ring(Items.idToString(id), id, count, ability, abilityLevel);
    }

    public setBoots(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.boots = new Boots(Items.idToString(id), id, count, ability, abilityLevel);
    }

    public override setPosition(x: number, y: number): void {
        if (this.dead) return;

        if (this.map.isOutOfBounds(x, y)) {
            x = 50;
            y = 89;
        }

        super.setPosition(x, y);

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Movement(Opcodes.Movement.Move, {
                id: this.instance,
                x,
                y,
                forced: false,
                teleport: false
            }),
            this.instance
        );
    }

    public setOrientation(orientation: number): void {
        this.orientation = orientation;

        if (this.orientationCallback)
            // Will be necessary in the future.
            this.orientationCallback;
    }

    /**
     * Getters
     */

    public hasArmour(): boolean {
        return this.armour && this.armour.name !== 'null' && this.armour.id !== -1;
    }

    public hasWeapon(): boolean {
        return this.weapon && this.weapon.name !== 'null' && this.weapon.id !== -1;
    }

    public hasLumberjackingWeapon(): boolean {
        return this.weapon && this.weapon.lumberjacking > 0;
    }

    public hasMiningWeapon(): boolean {
        return this.weapon && this.weapon.mining > 0;
    }

    public hasBreakableWeapon(): boolean {
        return this.weapon && this.weapon.breakable;
    }

    public hasPendant(): boolean {
        return this.pendant && this.pendant.name !== 'null' && this.pendant.id !== -1;
    }

    public hasRing(): boolean {
        return this.ring && this.ring.name !== 'null' && this.ring.id !== -1;
    }

    public hasBoots(): boolean {
        return this.boots && this.boots.name !== 'null' && this.boots.id !== -1;
    }

    public override hasMaxHitPoints(): boolean {
        return this.getHitPoints() >= this.playerHitPoints.getMaxHitPoints();
    }

    public hasMaxMana(): boolean {
        return this.mana.getMana() >= this.mana.getMaxMana();
    }

    public override hasSpecialAttack(): boolean {
        return (
            this.weapon &&
            (this.weapon.hasCritical() || this.weapon.hasExplosive() || this.weapon.hasStun())
        );
    }

    public canBeStunned(): boolean {
        return true;
    }

    public override getState(): PlayerState {
        return {
            type: this.type,
            id: this.instance,
            name: Utils.formatUsername(this.username),
            x: this.x,
            y: this.y,
            rights: this.rights,
            level: this.level,
            pvp: this.pvp,
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            attackRange: this.attackRange,
            orientation: this.orientation,
            hitPoints: this.playerHitPoints.getData(),
            movementSpeed: this.getMovementSpeed(),
            mana: this.mana.getData(),
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };
    }

    public getRemoteAddress(): string {
        return this.connection.socket.conn.remoteAddress;
    }

    /**
     * Here we will implement functions from quests and
     * other special events and determine a spawn point.
     */
    public getSpawn(): Pos {
        if (!this.finishedTutorial()) return this.getTutorial().getSpawn();

        return { x: 325, y: 87 };
    }

    public getHit(target: Character): Hit | undefined {
        let defaultDamage = Formulas.getDamage(this, target),
            isSpecial = Utils.randomInt(0, 100) < 30 + this.weapon.abilityLevel * 3;

        if (!isSpecial || !this.hasSpecialAttack())
            return new Hit(Modules.Hits.Damage, defaultDamage);

        let multiplier: number, damage: number;

        switch (this.weapon.ability) {
            case Modules.Enchantment.Critical:
                /**
                 * Still experimental, not sure how likely it is that you're
                 * gonna do a critical strike. I just do not want it getting
                 * out of hand, it's easier to buff than to nerf..
                 */

                multiplier = 1 + this.weapon.abilityLevel;
                damage = defaultDamage * multiplier;

                return new Hit(Modules.Hits.Critical, damage);

            case Modules.Enchantment.Stun:
                return new Hit(Modules.Hits.Stun, defaultDamage);

            case Modules.Enchantment.Explosive:
                return new Hit(Modules.Hits.Explosive, defaultDamage);
        }
    }

    public loadRegion(regionId: string): void {
        this.regionsLoaded.push(regionId);
    }

    public hasLoadedRegion(region: string): boolean {
        return this.regionsLoaded.includes(region);
    }

    public hasLoadedLight(light: number): boolean {
        return this.lightsLoaded.includes(light);
    }

    public timeout(): void {
        if (!this.connection) return;

        this.connection.sendUTF8('timeout');
        this.connection.close('Player timed out.');
    }

    public refreshTimeout(): void {
        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = setTimeout(() => {
            this.timeout();
        }, this.timeoutDuration);
    }

    public isMuted(): boolean {
        let time = Date.now();

        return this.mute - time > 0;
    }

    public override isRanged(): boolean {
        return this.weapon && this.weapon.isRanged();
    }

    public override isDead(): boolean {
        return this.getHitPoints() < 1 || this.dead;
    }

    /**
     * Miscellaneous
     */

    public send(message: Packet): void {
        this.world.push(Opcodes.Push.Player, {
            player: this,
            message
        });
    }

    public sendToRegion(message: Packet): void {
        this.world.push(Opcodes.Push.Region, {
            regionId: this.region,
            message
        });
    }

    public sendToAdjacentRegions(
        regionId: string | null,
        message: Packet,
        ignoreId?: string
    ): void {
        this.world.push(Opcodes.Push.Regions, {
            regionId,
            message,
            ignoreId
        });
    }

    public sendEquipment(): void {
        let info = {
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };

        this.send(new Messages.Equipment(Opcodes.Equipment.Batch, info));
    }

    public sendProfessions(): void {
        if (!this.professions) return;

        this.send(
            new Messages.Profession(Opcodes.Profession.Batch, {
                data: this.professions.getInfo()
            })
        );
    }

    public sendToSpawn(): void {
        let position = this.getSpawn();

        this.x = position.x;
        this.y = position.y;
    }

    public sendMessage(playerName: string, message: string): void {
        if (config.hubEnabled) {
            this.world.api.sendPrivateMessage(this, playerName, message);
            return;
        }

        if (!this.world.isOnline(playerName)) {
            this.notify(`@aquamarine@${playerName}@crimson@ is not online.`, 'crimson');
            return;
        }

        let otherPlayer = this.world.getPlayerByName(playerName),
            oFormattedName = Utils.formatUsername(playerName), // Formated username of the other player.
            formattedName = Utils.formatUsername(this.username); // Formatted username of current instance.

        otherPlayer.notify(`[From ${oFormattedName}]: ${message}`, 'aquamarine');
        this.notify(`[To ${formattedName}]: ${message}`, 'aquamarine');
    }

    /**
     * Function to be used for syncing up health,
     * mana, exp, and other variables
     */
    public sync(): void {
        if (!this.playerHitPoints || !this.mana) return;

        let info = {
            id: this.instance,
            attackRange: this.attackRange,
            hitPoints: this.getHitPoints(),
            maxHitPoints: this.getMaxHitPoints(),
            mana: this.mana.getMana(),
            maxMana: this.mana.getMaxMana(),
            experience: this.experience,
            level: this.level,
            armour: this.armour.getString(),
            weapon: this.weapon.getData(),
            poison: !!this.poison,
            movementSpeed: this.getMovementSpeed()
        };

        this.sendToAdjacentRegions(this.region, new Messages.Sync(info));

        this.save();
    }

    public popup(title: string, message: string, colour: string): void {
        if (!title) return;

        title = Utils.parseMessage(title);
        message = Utils.parseMessage(message);

        this.send(
            new Messages.Notification(Opcodes.Notification.Popup, {
                title,
                message,
                colour
            })
        );
    }

    public notify(message: string, colour?: string): void {
        if (!message) return;

        // Prevent notify spams
        if (Date.now() - this.lastNotify < 250) return;

        message = Utils.parseMessage(message);

        this.send(
            new Messages.Notification(Opcodes.Notification.Text, {
                message,
                colour
            })
        );

        this.lastNotify = Date.now();
    }

    /**
     * Sends a chat packet that can be used to
     * show special messages to the player.
     */

    public chat(
        source: string,
        text: string,
        colour?: string,
        isGlobal = false,
        withBubble = false
    ): void {
        if (!source || !text) return;

        this.send(
            new Messages.Chat({
                name: source,
                text,
                colour,
                isGlobal,
                withBubble
            })
        );
    }

    /**
     * Forcefully stopping the player will simply halt
     * them in between tiles. Should only be used if they are
     * being transported elsewhere.
     */
    public stopMovement(force = false): void {
        this.send(
            new Messages.Movement(Opcodes.Movement.Stop, {
                instance: this.instance,
                force
            })
        );
    }

    public finishedTutorial(): boolean {
        if (!this.quests || !config.tutorialEnabled) return true;

        return this.quests.getQuest(0)!.isFinished();
    }

    public finishedAchievement(id: number): boolean {
        if (!this.quests) return false;

        let achievement = this.quests.getAchievement(id);

        if (!achievement) return true;

        return achievement.isFinished();
    }

    public finishAchievement(id: number): void {
        if (!this.quests) return;

        let achievement = this.quests.getAchievement(id);

        if (!achievement || achievement.isFinished()) return;

        achievement.finish();
    }

    public checkRegions(): void {
        if (!this.regionPosition) return;

        let diffX = Math.abs(this.regionPosition[0] - this.x),
            diffY = Math.abs(this.regionPosition[1] - this.y);

        if (diffX >= 10 || diffY >= 10) {
            this.regionPosition = [this.x, this.y];

            this.regionCallback?.();
        }
    }

    /**
     * Server-sided callbacks towards movement should
     * not be able to be overwritten. In the case that
     * this is used (for Quests most likely) the server must
     * check that no hacker removed the constraint in the client-side.
     * If they are not within the bounds, apply the according punishment.
     */
    private movePlayer(): void {
        this.send(new Messages.Movement(Opcodes.Movement.Started));
    }

    private walkRandomly(): void {
        setInterval(() => {
            this.setPosition(this.x + Utils.randomInt(-5, 5), this.y + Utils.randomInt(-5, 5));
        }, 2000);
    }

    public killCharacter(character: Character): void {
        this.killCallback?.(character);
    }

    public save(): void {
        if (config.offlineMode || this.isGuest) return;

        if ((!this.questsLoaded || !this.achievementsLoaded) && !this.new) return;

        this.database.creator.save(this);
    }

    public inTutorial(): boolean {
        return this.world.map.inTutorialArea(this);
    }

    public hasAggressionTimer(): boolean {
        return Date.now() - this.lastRegionChange < 60_000 * 20; // 20 Minutes
    }

    public onOrientation(callback: () => void): void {
        this.orientationCallback = callback;
    }

    public onRegion(callback: () => void): void {
        this.regionCallback = callback;
    }

    public onKill(callback: KillCallback): void {
        this.killCallback = callback;
    }

    public override onDeath(callback: () => void): void {
        this.deathCallback = callback;
    }

    public onTalkToNPC(callback: NPCTalkCallback): void {
        this.npcTalkCallback = callback;
    }

    public onDoor(callback: DoorCallback): void {
        this.doorCallback = callback;
    }

    public onTeleport(callback: TeleportCallback): void {
        this.teleportCallback = callback;
    }

    public onProfile(callback: InterfaceCallback): void {
        this.profileToggleCallback = callback;
    }

    public onInventory(callback: InterfaceCallback): void {
        this.inventoryToggleCallback = callback;
    }

    public onWarp(callback: InterfaceCallback): void {
        this.warpToggleCallback = callback;
    }

    public onCheatScore(callback: () => void): void {
        this.cheatScoreCallback = callback;
    }

    public onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}
