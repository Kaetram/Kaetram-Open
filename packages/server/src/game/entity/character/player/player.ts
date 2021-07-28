import _ from 'lodash';

import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import config from '../../../../../config';
import Incoming from '../../../../controllers/incoming';
import Quests from '../../../../controllers/quests';
import Messages, { Packet } from '../../../../network/messages';
import Constants from '../../../../util/constants';
import Formulas from '../../../../util/formulas';
import Items from '../../../../util/items';
import log from '../../../../util/log';
import Utils from '../../../../util/utils';
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
import Handler from './handler';
import HitPoints from './points/hitpoints';
import Mana from './points/mana';
import Professions from './professions/professions';
import Trade from './trade';
import Warp from './warp';

import type Entities from '../../../../controllers/entities';
import type GlobalObjects from '../../../../controllers/globalobjects';
import type { FullPlayerData } from '../../../../database/mongodb/creator';
import type MongoDB from '../../../../database/mongodb/mongodb';
import type Area from '../../../../map/areas/area';
import type Map from '../../../../map/map';
import type Regions from '../../../../map/regions';
import type { MinigameState } from '../../../../minigames/minigame';
import type Connection from '../../../../network/connection';
import type World from '../../../world';
import type NPC from '../../npc/npc';
import type { EquipmentData } from './equipment/equipment';
import type Friends from './friends';
import type Introduction from './quests/impl/introduction';
import Lumberjacking from './professions/impl/lumberjacking';

type VoidCallback = () => void;
type TeleportCallback = (x: number, y: number, isDoor?: boolean) => void;
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

export interface PlayerExperience {
    id: string;
    level: number;
    amount: number;
    experience: number;
    nextExperience?: number;
    prevExperience: number;
}

interface PlayerState extends CharacterState {
    rights: number;
    level: number;
    pvp: boolean;
    pvpKills: number;
    pvpDeaths: number;
    attackRange: number;
    orientation: number;
    playerHitPoints: number[];
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
        cursor?: string;
    };
}

interface SurroundingTrees {
    indexes: number[];
    data: number[][];
    collisions: boolean[];
    objectData: ObjectData;
}

export default class Player extends Character {
    public world: World;
    public database: MongoDB;
    public connection: Connection;

    public clientId: string;

    public map: Map;
    public regions: Regions;
    public entities: Entities;
    public globalObjects: GlobalObjects;

    public incoming: Incoming;

    public ready: boolean;

    // public moving: boolean;
    public regionPosition: number[] | null;

    public newRegion: boolean;

    public team?: string; // TODO
    public userAgent?: string;
    public minigame?: MinigameState; // TODO

    public disconnectTimeout: NodeJS.Timeout | null;
    public timeoutDuration: number;
    public lastRegionChange: number;

    public handler: Handler;

    public inventory: Inventory;
    public professions: Professions;
    public abilities: Abilities;
    public friends!: Friends; //
    public enchant: Enchant;
    public bank: Bank;
    public quests: Quests;
    public trade: Trade;
    public doors: Doors;
    public warp: Warp;

    public introduced: boolean;
    public currentSong: string | null;
    public acceptedTrade: boolean;
    // public invincible: boolean;
    public noDamage: boolean;
    public isGuest: boolean;

    public canTalk: boolean;
    public webSocketClient: boolean;

    // public instanced: boolean;
    public visible: boolean;

    public talkIndex: number;
    public cheatScore: number;
    public defaultMovementSpeed: number;

    public regionsLoaded: string[];
    public lightsLoaded: number[];

    public npcTalk: number | string | null;

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

    public nextExperience?: number;
    public prevExperience!: number;
    public playerHitPoints!: HitPoints;
    public mana!: Mana;

    public armour!: Armour;
    public weapon!: Weapon;
    // public pendant: Pendant;
    // public ring: Ring;
    // public boots: Boots;

    public cameraArea?: Area | null;
    public overlayArea?: Area;

    public permanentPVP?: boolean;
    public movementStart!: number;

    public pingTime!: number;

    public regionWidth!: number;
    public regionHeight!: number;

    questsLoaded!: boolean;
    achievementsLoaded!: boolean;

    public new!: boolean;
    public lastNotify!: number;
    public profileDialogOpen!: boolean;
    public inventoryOpen!: boolean;
    public warpOpen!: boolean;

    public selectedShopItem!: { id: number; index: number } | null;

    public teleportCallback!: TeleportCallback;
    public cheatScoreCallback!: VoidCallback;
    public profileToggleCallback!: InterfaceCallback;
    public inventoryToggleCallback!: InterfaceCallback;
    public warpToggleCallback!: InterfaceCallback;
    public orientationCallback!: VoidCallback;
    public regionCallback!: VoidCallback;
    public killCallback!: KillCallback;
    public npcTalkCallback!: NPCTalkCallback;
    public doorCallback!: DoorCallback;
    public readyCallback!: VoidCallback;

    constructor(world: World, database: MongoDB, connection: Connection, clientId: string) {
        super(-1, 'player', connection.id, -1, -1);

        this.world = world;
        this.database = database;
        this.connection = connection;

        this.clientId = clientId;

        this.map = world.map;
        this.regions = world.map.regions;
        this.entities = world.entities;
        this.globalObjects = world.globalObjects;

        this.incoming = new Incoming(this);

        this.ready = false;

        this.moving = false;
        this.regionPosition = null;

        this.newRegion = false;

        this.disconnectTimeout = null;
        this.timeoutDuration = 1000 * 60 * 10; // 10 minutes
        this.lastRegionChange = Date.now();

        this.handler = new Handler(this);

        this.inventory = new Inventory(this, 20);
        this.professions = new Professions(this);
        this.abilities = new Abilities(this);
        // this.friends = new Friends(this);
        this.enchant = new Enchant(this);
        this.bank = new Bank(this, 56);
        this.quests = new Quests(this);
        this.trade = new Trade(this);
        this.doors = new Doors(this);
        this.warp = new Warp(this);

        this.introduced = false;
        this.currentSong = null;
        this.acceptedTrade = false;
        this.invincible = false;
        this.noDamage = false;
        this.isGuest = false;

        this.pvp = false;

        this.canTalk = true;
        this.webSocketClient = connection.type === 'WebSocket';

        this.instanced = false;
        this.visible = true;

        this.talkIndex = 0;
        this.cheatScore = 0;
        this.defaultMovementSpeed = 250; // For fallback.

        this.regionsLoaded = [];
        this.lightsLoaded = [];

        this.npcTalk = null;
    }

    load(data: FullPlayerData): void {
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

        const { x, y, armour, weapon, pendant, ring, boots } = data;

        this.setPosition(x, y);
        this.setArmour(...armour);
        this.setWeapon(...weapon);
        this.setPendant(...pendant);
        this.setRing(...ring);
        this.setBoots(...boots);
    }

    destroy(): void {
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

    loadRegions(regions: PlayerRegions): void {
        if (!regions) return;

        if (this.mapVersion !== this.map.version) {
            this.mapVersion = this.map.version;

            this.save();

            if (config.debug) log.info(`Updated map version for ${this.username}`);

            return;
        }

        if (regions.gameVersion === config.gver) this.regionsLoaded = regions.regions.split(',');
    }

    loadProfessions(): void {
        if (config.offlineMode) return;

        this.database.loader.getProfessions(this, (info) => {
            if (!info)
                // If this somehow happens.
                return;

            this.professions.update(info);

            this.sendProfessions();
        });
    }

    loadFriends(): void {
        if (config.offlineMode) return;

        this.database.loader.getFriends(this, (info) => {
            if (!info) return;

            this.friends.update(info);
        });
    }

    loadInventory(): void {
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

    loadBank(): void {
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

    loadQuests(): void {
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
                new Messages.Quest(
                    Packets.QuestOpcode.AchievementBatch,
                    this.quests.getAchievementData()
                )
            );

            /* Update region here because we receive quest info */
            if (this.questsLoaded) this.updateRegion();

            this.achievementsLoaded = true;
        });

        this.quests.onQuestsReady(() => {
            this.send(
                new Messages.Quest(Packets.QuestOpcode.QuestBatch, this.quests.getQuestData())
            );

            /* Update region here because we receive quest info */
            if (this.achievementsLoaded) this.updateRegion();

            this.questsLoaded = true;
        });
    }

    intro(): void {
        if (this.ban > Date.now()) {
            this.connection.sendUTF8('ban');
            this.connection.close('Player: ' + this.username + ' is banned.');
        }

        if (this.x <= 0 || this.y <= 0) this.sendToSpawn();

        if (this.playerHitPoints.getHitPoints() < 0)
            this.playerHitPoints.setHitPoints(this.getMaxHitPoints());

        if (this.mana.getMana() < 0) this.mana.setMana(this.mana.getMaxMana());

        this.verifyRights();

        const info = {
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

    verifyRights(): void {
        if (config.moderators.includes(this.username.toLowerCase())) this.rights = 1;

        if (config.administrators.includes(this.username.toLowerCase()) || config.offlineMode)
            this.rights = 2;
    }

    addExperience(exp: number): void {
        this.experience += exp;

        const oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level) {
            this.playerHitPoints.setMaxHitPoints(Formulas.getMaxHitPoints(this.level));
            this.healHitPoints(this.playerHitPoints.maxPoints);

            this.updateRegion();

            this.popup('Level Up!', `Congratulations, you are now level ${this.level}!`, '#ff6600');
        }

        const data = {
            id: this.instance,
            level: this.level
        } as PlayerExperience;

        /**
         * Sending two sets of data as other users do not need to
         * know the experience of another player.. (yet).
         */

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Experience(Packets.ExperienceOpcode.Combat, data),
            this.instance
        );

        data.amount = exp;
        data.experience = this.experience;
        data.nextExperience = this.nextExperience;
        data.prevExperience = this.prevExperience;

        this.send(new Messages.Experience(Packets.ExperienceOpcode.Combat, data));

        this.sync();
    }

    override heal(amount: number): void {
        /**
         * Passed from the superclass...
         */

        if (!this.playerHitPoints || !this.mana) return;

        this.playerHitPoints.heal(amount);
        this.mana.heal(amount);

        this.sync();
    }

    healHitPoints(amount: number): void {
        const type = 'health';

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

    healManaPoints(amount: number): void {
        const type = 'mana';

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

    eat(id: number): void {
        const Item = Items.getPlugin(id);

        if (!Item) return;

        new Item(id).onUse(this);
    }

    equip(string: string, count: number, ability: number, abilityLevel: number): void {
        const data = Items.getData(string);
        let type!: Modules.Equipment, id, power;

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
            new Messages.Equipment(Packets.EquipmentOpcode.Equip, {
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

    updateRegion(force?: boolean): void {
        this.world.region.sendRegion(this, this.region, force);
    }

    isInvisible(instance: string): boolean {
        const entity = this.entities.get(instance);

        if (!entity) return false;

        return super.hasInvisibleId(entity.id) || super.hasInvisible(entity);
    }

    formatInvisibles(): string {
        return this.invisiblesIds.join(' ');
    }

    canEquip(string: string): boolean {
        let requirement = Items.getLevelRequirement(string);

        if (requirement > Constants.MAX_LEVEL) requirement = Constants.MAX_LEVEL;

        if (requirement > this.level) {
            this.notify('You must be at least level ' + requirement + ' to equip this.');
            return false;
        }

        return true;
    }

    die(): void {
        this.dead = true;

        if (this.deathCallback) this.deathCallback();

        this.send(new Messages.Death(this.instance));
    }

    teleport(x: number, y: number, isDoor?: boolean, animate?: boolean): void {
        if (this.teleportCallback) this.teleportCallback(x, y, isDoor);

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

    handleObject(id: string): void {
        const info = this.globalObjects.getInfo(id);

        if (!info) return;

        switch (info.type) {
            case 'sign': {
                const data = this.globalObjects.getSignData(id);

                if (!data) return;

                const message = this.globalObjects.talk(data.object, this);

                this.world.push(Packets.PushOpcode.Player, {
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
                const lumberjacking = this.professions.getProfession<Lumberjacking>(
                    Modules.Professions.Lumberjacking
                );

                lumberjacking?.handle(id, info.tree!);

                break;
            }
        }
    }

    incrementCheatScore(amount: number): void {
        if (this.combat.started) return;

        this.cheatScore += amount;

        if (this.cheatScoreCallback) this.cheatScoreCallback();
    }

    updatePVP(pvp: boolean, permanent?: boolean): void {
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

    updateOverlay(overlay: Area | undefined): void {
        if (this.overlayArea === overlay) return;

        this.overlayArea = overlay;

        if (overlay && overlay.id) {
            this.lightsLoaded = [];

            this.send(
                new Messages.Overlay(Packets.OverlayOpcode.Set, {
                    image: overlay.fog || 'empty',
                    colour: 'rgba(0,0,0,' + overlay.darkness + ')'
                })
            );
        } else this.send(new Messages.Overlay(Packets.OverlayOpcode.Remove));
    }

    updateCamera(camera: Area | undefined): void {
        if (this.cameraArea === camera) return;

        this.cameraArea = camera;

        if (camera)
            switch (camera.type) {
                case 'lockX':
                    this.send(new Messages.Camera(Packets.CameraOpcode.LockX));
                    break;

                case 'lockY':
                    this.send(new Messages.Camera(Packets.CameraOpcode.LockY));
                    break;

                case 'player':
                    this.send(new Messages.Camera(Packets.CameraOpcode.Player));
                    break;
            }
        else this.send(new Messages.Camera(Packets.CameraOpcode.FreeFlow));
    }

    updateMusic(info?: Area): void {
        if (!info || info.song === this.currentSong) return;

        this.currentSong = info.song;

        this.send(new Messages.Audio(info.song));
    }

    revertPoints(): void {
        this.playerHitPoints.setHitPoints(this.playerHitPoints.getMaxHitPoints());
        this.mana.setMana(this.mana.getMaxMana());

        this.sync();
    }

    override applyDamage(damage: number): void {
        this.playerHitPoints.decrement(damage);
    }

    toggleProfile(state: boolean): void {
        this.profileDialogOpen = state;

        if (this.profileToggleCallback) this.profileToggleCallback(state);
    }

    toggleInventory(state: boolean): void {
        this.inventoryOpen = state;

        if (this.inventoryToggleCallback) this.inventoryToggleCallback(state);
    }

    toggleWarp(state: boolean): void {
        this.warpOpen = state;

        if (this.warpToggleCallback) this.warpToggleCallback(state);
    }

    getMana(): number {
        return this.mana.getMana();
    }

    getMaxMana(): number {
        return this.mana.getMaxMana();
    }

    override getHitPoints(): number {
        return this.playerHitPoints.getHitPoints();
    }

    override getMaxHitPoints(): number {
        return this.playerHitPoints.getMaxHitPoints();
    }

    getTutorial(): Introduction {
        return this.quests.getQuest<Introduction>(Modules.Quests.Introduction)!;
    }

    override getWeaponLevel(): number {
        return this.weapon.getLevel();
    }

    override getArmourLevel(): number {
        return this.armour.getDefense();
    }

    getLumberjackingLevel(): number {
        return this.professions.getProfession(Modules.Professions.Lumberjacking)!.getLevel();
    }

    getWeaponLumberjackingLevel(): number {
        if (!this.hasLumberjackingWeapon()) return -1;

        return this.weapon.lumberjacking;
    }

    getWeaponMiningLevel(): number {
        if (!this.hasMiningWeapon()) return -1;

        return this.weapon.mining;
    }

    // We get dynamic trees surrounding the player
    getSurroundingTrees(): SurroundingTrees {
        const tiles: SurroundingTrees = {
            indexes: [],
            data: [],
            collisions: [],
            objectData: {}
        };

        _.each(this.map.treeIndexes, (index: number) => {
            const position = this.map.indexToGridPosition(index + 1),
                treeRegion = this.regions.regionIdFromPosition(position.x, position.y);

            if (!this.regions.isSurrounding(this.region, treeRegion)) return;

            const objectId = this.map.getPositionObject(position.x, position.y),
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

    getMovementSpeed(): number {
        const itemMovementSpeed = Items.getMovementSpeed(this.armour.name),
            movementSpeed = itemMovementSpeed || this.defaultMovementSpeed;

        /*
         * Here we can handle equipment/potions/abilities that alter
         * the player's movement speed. We then just broadcast it.
         */

        this.movementSpeed = movementSpeed;

        return this.movementSpeed;
    }

    breakWeapon(): void {
        this.notify('Your weapon has been broken.');

        this.setWeapon(-1, 0, 0, 0);

        this.sendEquipment();
    }

    /**
     * Setters
     */

    setArmour(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.armour = new Armour(Items.idToString(id), id, count, ability, abilityLevel);
    }

    setWeapon(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.weapon = new Weapon(Items.idToString(id), id, count, ability, abilityLevel);

        if (this.weapon.ranged) this.attackRange = 7;
    }

    setPendant(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.pendant = new Pendant(Items.idToString(id), id, count, ability, abilityLevel);
    }

    setRing(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.ring = new Ring(Items.idToString(id), id, count, ability, abilityLevel);
    }

    setBoots(id: number, count: number, ability: number, abilityLevel: number): void {
        if (!id) return;

        this.boots = new Boots(Items.idToString(id), id, count, ability, abilityLevel);
    }

    override setPosition(x: number, y: number): void {
        if (this.dead) return;

        if (this.map.isOutOfBounds(x, y)) {
            x = 50;
            y = 89;
        }

        super.setPosition(x, y);

        this.sendToAdjacentRegions(
            this.region,
            new Messages.Movement(Packets.MovementOpcode.Move, {
                id: this.instance,
                x,
                y,
                forced: false,
                teleport: false
            }),
            this.instance
        );
    }

    setOrientation(orientation: number): void {
        this.orientation = orientation;

        if (this.orientationCallback)
            // Will be necessary in the future.
            this.orientationCallback;
    }

    /**
     * Getters
     */

    hasArmour(): boolean {
        return this.armour && this.armour.name !== 'null' && this.armour.id !== -1;
    }

    hasWeapon(): boolean {
        return this.weapon && this.weapon.name !== 'null' && this.weapon.id !== -1;
    }

    hasLumberjackingWeapon(): boolean {
        return this.weapon && this.weapon.lumberjacking > 0;
    }

    hasMiningWeapon(): boolean {
        return this.weapon && this.weapon.mining > 0;
    }

    hasBreakableWeapon(): boolean {
        return this.weapon && this.weapon.breakable;
    }

    hasPendant(): boolean {
        return this.pendant && this.pendant.name !== 'null' && this.pendant.id !== -1;
    }

    hasRing(): boolean {
        return this.ring && this.ring.name !== 'null' && this.ring.id !== -1;
    }

    hasBoots(): boolean {
        return this.boots && this.boots.name !== 'null' && this.boots.id !== -1;
    }

    override hasMaxHitPoints(): boolean {
        return this.getHitPoints() >= this.playerHitPoints.getMaxHitPoints();
    }

    hasMaxMana(): boolean {
        return this.mana.getMana() >= this.mana.getMaxMana();
    }

    override hasSpecialAttack(): boolean {
        return (
            this.weapon &&
            (this.weapon.hasCritical() || this.weapon.hasExplosive() || this.weapon.hasStun())
        );
    }

    canBeStunned(): boolean {
        return true;
    }

    override getState(): PlayerState {
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
            playerHitPoints: this.playerHitPoints.getData(),
            movementSpeed: this.getMovementSpeed(),
            mana: this.mana.getData(),
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };
    }

    getRemoteAddress(): string {
        return this.connection.socket.conn.remoteAddress;
    }

    getSpawn(): { x: number; y: number } {
        /**
         * Here we will implement functions from quests and
         * other special events and determine a spawn point.
         */

        if (!this.finishedTutorial()) return this.getTutorial().getSpawn();

        return { x: 325, y: 87 };
    }

    getHit(target: Character): Hit | undefined {
        const defaultDamage = Formulas.getDamage(this, target),
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

    loadRegion(regionId: string): void {
        this.regionsLoaded.push(regionId);
    }

    hasLoadedRegion(region: string): boolean {
        return this.regionsLoaded.includes(region);
    }

    hasLoadedLight(light: number): boolean {
        return this.lightsLoaded.includes(light);
    }

    timeout(): void {
        if (!this.connection) return;

        this.connection.sendUTF8('timeout');
        this.connection.close('Player timed out.');
    }

    refreshTimeout(): void {
        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = setTimeout(() => {
            this.timeout();
        }, this.timeoutDuration);
    }

    isMuted(): boolean {
        const time = Date.now();

        return this.mute - time > 0;
    }

    override isRanged(): boolean {
        return this.weapon && this.weapon.isRanged();
    }

    override isDead(): boolean {
        return this.getHitPoints() < 1 || this.dead;
    }

    /**
     * Miscellaneous
     */

    send(message: Packet): void {
        this.world.push(Packets.PushOpcode.Player, {
            player: this,
            message
        });
    }

    sendToRegion(message: Packet): void {
        this.world.push(Packets.PushOpcode.Region, {
            regionId: this.region,
            message
        });
    }

    sendToAdjacentRegions(regionId: string | null, message: Packet, ignoreId?: string): void {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId,
            message,
            ignoreId
        });
    }

    sendEquipment(): void {
        const info = {
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };

        this.send(new Messages.Equipment(Packets.EquipmentOpcode.Batch, info));
    }

    sendProfessions(): void {
        if (!this.professions) return;

        this.send(
            new Messages.Profession(Packets.ProfessionOpcode.Batch, {
                data: this.professions.getInfo()
            })
        );
    }

    sendToSpawn(): void {
        const position = this.getSpawn();

        this.x = position.x;
        this.y = position.y;
    }

    sendMessage(playerName: string, message: string): void {
        if (config.hubEnabled) {
            this.world.api.sendPrivateMessage(this, playerName, message);
            return;
        }

        if (!this.world.isOnline(playerName)) {
            this.notify(`@aquamarine@${playerName}@crimson@ is not online.`, 'crimson');
            return;
        }

        const otherPlayer = this.world.getPlayerByName(playerName),
            oFormattedName = Utils.formatUsername(playerName), // Formated username of the other player.
            formattedName = Utils.formatUsername(this.username); // Formatted username of current instance.

        otherPlayer.notify(`[From ${oFormattedName}]: ${message}`, 'aquamarine');
        this.notify(`[To ${formattedName}]: ${message}`, 'aquamarine');
    }

    sync(): void {
        /**
         * Function to be used for syncing up health,
         * mana, exp, and other variables
         */

        if (!this.playerHitPoints || !this.mana) return;

        const info = {
            id: this.instance,
            attackRange: this.attackRange,
            playerHitPoints: this.getHitPoints(),
            maxHitPoints: this.getMaxHitPoints(),
            mana: this.mana.getMana(),
            maxMana: this.mana.getMaxMana(),
            level: this.level,
            armour: this.armour.getString(),
            weapon: this.weapon.getData(),
            poison: !!this.poison,
            movementSpeed: this.getMovementSpeed()
        };

        this.sendToAdjacentRegions(this.region, new Messages.Sync(info));

        this.save();
    }

    popup(title: string, message: string, colour: string): void {
        if (!title) return;

        title = Utils.parseMessage(title);
        message = Utils.parseMessage(message);

        this.send(
            new Messages.Notification(Packets.NotificationOpcode.Popup, {
                title,
                message,
                colour
            })
        );
    }

    notify(message: string, colour?: string): void {
        if (!message) return;

        // Prevent notify spams
        if (Date.now() - this.lastNotify < 250) return;

        message = Utils.parseMessage(message);

        this.send(
            new Messages.Notification(Packets.NotificationOpcode.Text, {
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

    chat(
        source: string,
        text: string,
        colour?: string,
        isGlobal?: boolean,
        withBubble?: boolean
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

    stopMovement(force?: boolean): void {
        /**
         * Forcefully stopping the player will simply halt
         * them in between tiles. Should only be used if they are
         * being transported elsewhere.
         */

        this.send(
            new Messages.Movement(Packets.MovementOpcode.Stop, {
                instance: this.instance,
                force
            })
        );
    }

    finishedTutorial(): boolean {
        if (!this.quests || !config.tutorialEnabled) return true;

        return this.quests.getQuest(0)!.isFinished();
    }

    finishedAchievement(id: number): boolean {
        if (!this.quests) return false;

        const achievement = this.quests.getAchievement(id);

        if (!achievement) return true;

        return achievement.isFinished();
    }

    finishAchievement(id: number): void {
        if (!this.quests) return;

        const achievement = this.quests.getAchievement(id);

        if (!achievement || achievement.isFinished()) return;

        achievement.finish();
    }

    checkRegions(): void {
        if (!this.regionPosition) return;

        const diffX = Math.abs(this.regionPosition[0] - this.x),
            diffY = Math.abs(this.regionPosition[1] - this.y);

        if (diffX >= 10 || diffY >= 10) {
            this.regionPosition = [this.x, this.y];

            if (this.regionCallback) this.regionCallback();
        }
    }

    movePlayer(): void {
        /**
         * Server-sided callbacks towards movement should
         * not be able to be overwritten. In the case that
         * this is used (for Quests most likely) the server must
         * check that no hacker removed the constraint in the client-side.
         * If they are not within the bounds, apply the according punishment.
         */

        this.send(new Messages.Movement(Packets.MovementOpcode.Started));
    }

    walkRandomly(): void {
        setInterval(() => {
            this.setPosition(this.x + Utils.randomInt(-5, 5), this.y + Utils.randomInt(-5, 5));
        }, 2000);
    }

    killCharacter(character: Character): void {
        if (this.killCallback) this.killCallback(character);
    }

    save(): void {
        if (config.offlineMode || this.isGuest) return;

        if ((!this.questsLoaded || !this.achievementsLoaded) && !this.new) return;

        this.database.creator.save(this);
    }

    inTutorial(): boolean {
        return this.world.map.inTutorialArea(this);
    }

    hasAggressionTimer(): boolean {
        return Date.now() - this.lastRegionChange < 1200000; // 20 Minutes
    }

    onOrientation(callback: VoidCallback): void {
        this.orientationCallback = callback;
    }

    onRegion(callback: VoidCallback): void {
        this.regionCallback = callback;
    }

    onKill(callback: KillCallback): void {
        this.killCallback = callback;
    }

    override onDeath(callback: VoidCallback): void {
        this.deathCallback = callback;
    }

    onTalkToNPC(callback: NPCTalkCallback): void {
        this.npcTalkCallback = callback;
    }

    onDoor(callback: DoorCallback): void {
        this.doorCallback = callback;
    }

    onTeleport(callback: TeleportCallback): void {
        this.teleportCallback = callback;
    }

    onProfile(callback: InterfaceCallback): void {
        this.profileToggleCallback = callback;
    }

    onInventory(callback: InterfaceCallback): void {
        this.inventoryToggleCallback = callback;
    }

    onWarp(callback: InterfaceCallback): void {
        this.warpToggleCallback = callback;
    }

    onCheatScore(callback: VoidCallback): void {
        this.cheatScoreCallback = callback;
    }

    onReady(callback: VoidCallback): void {
        this.readyCallback = callback;
    }
}
