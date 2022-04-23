import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Incoming from '../../../../controllers/incoming';
import Formulas from '../../../../info/formulas';
import Character from '../character';
import Hit from '../combat/hit';
import Abilities from './abilities/abilities';
import Bank from './containers/impl/bank';
import Inventory from './containers/impl/inventory';
import Friends from './friends';
import Handler from './handler';
import Mana from '../points/mana';
import Trade from './trade';
import Warp from './warp';

import type { ExperienceCombatData } from '@kaetram/common/types/messages';
import type MongoDB from '../../../../database/mongodb/mongodb';
import type Area from '../../../map/areas/area';
import type Connection from '../../../../network/connection';
import type World from '../../../world';
import type NPC from '../../npc/npc';
import type { PlayerInfo } from './../../../../database/mongodb/creator';
import Map from '../../../map/map';
import { PacketType } from '@kaetram/common/network/modules';
import {
    Audio,
    Bubble,
    Camera,
    Chat,
    Death,
    Experience,
    Heal,
    Movement,
    Notification,
    Overlay,
    Sync,
    Teleport,
    Welcome,
    Pointer
} from '@kaetram/server/src/network/packets';
import Packet from '@kaetram/server/src/network/packet';
import Equipments from './equipments';
import Quests from './quests';
import Regions from '../../../map/regions';
import Entities from '@kaetram/server/src/controllers/entities';
import { EntityData } from '../../entity';
import { EquipmentData } from '@kaetram/common/types/equipment';
import Container from './containers/container';
import Item from '../../objects/item';
import { SlotData, SlotType } from '@kaetram/common/types/slot';
import { PointerData } from '@kaetram/common/types/pointer';
import { ProcessedDoor } from '@kaetram/common/types/map';

type TeleportCallback = (x: number, y: number, isDoor: boolean) => void;
type KillCallback = (character: Character) => void;
type InterfaceCallback = (state: boolean) => void;
type NPCTalkCallback = (npc: NPC) => void;
type DoorCallback = (door: ProcessedDoor) => void;

export interface PlayerRegions {
    regions: string;
    gameVersion: string;
}

export interface ObjectData {
    [index: number]: {
        isObject: boolean;
        cursor: string | undefined;
    };
}

interface PlayerData extends EntityData {
    rights: number;
    pvp: boolean;
    orientation: number;

    equipments: EquipmentData[];
}

export default class Player extends Character {
    public map: Map;
    private regions: Regions;
    private entities: Entities;

    public incoming: Incoming;

    private handler: Handler;

    public quests: Quests;
    public equipment: Equipments;
    public mana: Mana = new Mana(Modules.Defaults.MANA);
    public bank: Bank = new Bank(Modules.Constants.BANK_SIZE);
    public inventory: Inventory = new Inventory(Modules.Constants.INVENTORY_SIZE);

    public ready = false; // indicates if login processed finished
    public isGuest = false;
    public canTalk = true;
    public questsLoaded = false;
    public achievementsLoaded = false;

    private permanentPVP = false;

    public password = '';
    public email = '';

    public rights = 0;
    public experience = 0;
    public ban = 0; // epoch timestamp
    public mute = 0;
    public lastLogin = 0;
    public pvpKills = 0;
    public pvpDeaths = 0;
    public orientation = Modules.Orientation.Down;
    public mapVersion = -1;

    public talkIndex = 0;
    public cheatScore = 0;
    public defaultMovementSpeed = 250; // For fallback.

    // TODO - REFACTOR THESE ------------

    public webSocketClient;

    public abilities;
    public friends;
    public trade;
    public warp;

    public team?: string; // TODO
    public userAgent!: string;

    private disconnectTimeout: NodeJS.Timeout | null = null;
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes
    public lastRegionChange = Date.now();

    private currentSong: string | null = null;

    public regionsLoaded: number[] = [];
    public lightsLoaded: number[] = [];

    public npcTalk = '';
    // Currently open store of the player.
    public storeOpen = '';

    public movementStart!: number;
    public pingTime!: number;

    private lastNotify!: number;

    private nextExperience: number | undefined;
    private prevExperience!: number;

    public profileDialogOpen?: boolean;
    public inventoryOpen?: boolean;
    public warpOpen?: boolean;

    public cameraArea: Area | undefined;
    private overlayArea: Area | undefined;

    public selectedShopItem!: { id: number; index: number } | null;

    //--------------------------------------

    public killCallback?: KillCallback;
    public npcTalkCallback?: NPCTalkCallback;
    public doorCallback?: DoorCallback;
    public readyCallback?(): void;

    private teleportCallback?: TeleportCallback;
    private cheatScoreCallback?(): void;
    private profileToggleCallback?: InterfaceCallback;
    private inventoryToggleCallback?: InterfaceCallback;
    private warpToggleCallback?: InterfaceCallback;
    private orientationCallback?(): void;

    public constructor(world: World, public database: MongoDB, public connection: Connection) {
        super(connection.id, world, '', -1, -1);

        this.map = world.map;
        this.regions = world.map.regions;
        this.entities = world.entities;

        this.incoming = new Incoming(this);
        this.equipment = new Equipments(this);
        this.quests = new Quests(this);
        this.handler = new Handler(this);
        this.warp = new Warp(this);

        // TODO - Refactor
        this.abilities = new Abilities(this);
        this.friends = new Friends(this);
        this.trade = new Trade(this);

        this.webSocketClient = connection.type === 'WebSocket';
    }

    /**
     * Inserts the `data` into the player object.
     * @param data PlayerInfo object containing all data.
     */

    public load(data: PlayerInfo): void {
        this.name = data.username;
        this.rights = data.rights;
        this.experience = data.experience;
        this.ban = data.ban;
        this.mute = data.mute;
        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;

        this.setPosition(data.x, data.y);

        this.warp.setLastWarp(data.lastWarp);

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        this.userAgent = data.userAgent;

        // TODO - Do not calculate max points on every login, just store it instead.
        this.hitPoints.updateHitPoints([data.hitPoints, Formulas.getMaxHitPoints(this.level)]);
        this.mana.updateMana([data.mana, Formulas.getMaxMana(this.level)]);

        this.intro();
    }

    /**
     * Loads the equipment data from the database.
     */

    public loadEquipment(): void {
        this.database.loader?.loadEquipment(this, this.equipment.load.bind(this.equipment));
    }

    /**
     * Loads the inventory data from the database.
     */

    public loadInventory(): void {
        this.database.loader?.loadInventory(this, this.inventory.load.bind(this.inventory));
    }

    /**
     * Loads the bank data from the database.
     */

    public loadBank(): void {
        this.database.loader?.loadBank(this, this.bank.load.bind(this.bank));
    }

    /**
     * Loads the quest data from the bank.
     */

    public loadQuests(): void {
        this.database.loader?.loadQuests(this, this.quests.load.bind(this.quests));
    }

    /**
     * Handle the actual player login. Check if the user is banned,
     * update hitPoints and mana, and send the player information
     * to the client.
     */

    public intro(): void {
        if (this.ban > Date.now()) {
            this.connection.sendUTF8('ban');
            this.connection.close(`Player: ${this.username} is banned.`);
        }

        if (this.hitPoints.getHitPoints() < 0)
            this.hitPoints.setHitPoints(this.hitPoints.getMaxHitPoints());

        if (this.mana.getMana() < 0) this.mana.setMana(this.mana.getMaxMana());

        this.verifyRights();

        let info = {
            instance: this.instance,
            username: Utils.formatName(this.username),
            x: this.x,
            y: this.y,
            rights: this.rights,
            hitPoints: this.hitPoints.serialize(),
            mana: this.mana.serialize(),
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

        /**
         * Send player data to client here
         */

        this.entities.addPlayer(this);

        this.send(new Welcome(info));
    }

    public destroy(): void {
        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = null;

        this.handler = null!;
        this.inventory = null!;
        this.abilities = null!;
        this.bank = null!;
        this.trade = null!;
        this.warp = null!;

        this.connection = null!;
    }

    private verifyRights(): void {
        if (config.moderators.includes(this.username.toLowerCase())) this.rights = 1;

        if (config.administrators.includes(this.username.toLowerCase()) || config.skipDatabase)
            this.rights = 2;
    }

    public addExperience(exp: number): void {
        this.experience += exp;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level) {
            this.hitPoints.setMaxHitPoints(Formulas.getMaxHitPoints(this.level));
            this.healHitPoints(this.hitPoints.maxPoints);

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

        this.sendToRegions(new Experience(Opcodes.Experience.Combat, data), true);

        data.amount = exp;
        data.experience = this.experience;
        data.nextExperience = this.nextExperience;
        data.prevExperience = this.prevExperience;

        this.send(new Experience(Opcodes.Experience.Combat, data));

        this.sync();
    }

    /**
     * Passed from the superclass...
     */
    public override heal(amount: number): void {
        super.heal(amount);

        this.mana.increment(amount);

        this.sync();
    }

    public healHitPoints(amount: number): void {
        let type = 'health' as const;

        this.hitPoints.increment(amount);

        this.sync();

        this.sendToRegions(
            new Heal({
                id: this.instance,
                type,
                amount
            })
        );
    }

    public healManaPoints(amount: number): void {
        let type = 'mana' as const;

        this.mana.increment(amount);

        this.sync();

        this.sendToRegions(
            new Heal({
                id: this.instance,
                type,
                amount
            })
        );
    }

    public eat(id: number): void {
        log.warning('player.eat() reimplement.');
    }

    public updateRegion(force = false): void {
        this.regions.sendRegion(this);
    }

    public teleport(x: number, y: number, isDoor = false, withAnimation = false): void {
        this.teleportCallback?.(x, y, isDoor);

        this.sendToRegions(
            new Teleport({
                id: this.instance,
                x,
                y,
                withAnimation
            })
        );

        this.setPosition(x, y);
        this.world.cleanCombat(this);
    }

    public incrementCheatScore(amount: number): void {
        if (this.combat.started) return;

        this.cheatScore += amount;

        this.cheatScoreCallback?.();
    }

    /**
     * We route all object clicks through the player instance
     * in order to organize data more neatly.
     */
    public handleObject(id: string): void {
        //
    }

    public handleBankOpen(): void {
        //
    }

    /**
     * Handles the select event when clicking a container.
     * @param container The container we are handling.
     * @param index The index in the container we selected.
     */

    public handleContainerSelect(container: Container, index: number, slotType?: SlotType): void {
        let slot: SlotData | undefined, item: Item;

        log.debug(`Received container select: ${container.type} - ${index} - ${slotType}`);

        // TODO - Cleanup and document, this is a preliminary prototype.
        switch (container.type) {
            case Modules.ContainerType.Inventory:
                log.debug(`Selected item index: ${index}`);

                slot = container.remove(index);

                if (!slot) return;

                item = container.getItem(slot);

                if (item.isEquippable()) this.equipment.equip(item);

                break;

            case Modules.ContainerType.Bank:
                if (!slotType) return;

                // Move item from the bank to the inventory.
                if (slotType === 'inventory') container.move(this.inventory, index);
                // Move item from the inventory to the bank.
                else if (slotType === 'bank') this.inventory.move(container, index);

                break;
        }
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

        // TODO - Redo the packet
        //this.sendToAdjacentRegions(this.region, new PVP(this.instance, this.pvp));
    }

    public updateOverlay(overlay: Area | undefined): void {
        if (this.overlayArea === overlay) return;

        this.overlayArea = overlay;

        if (overlay && overlay.id) {
            this.lightsLoaded = [];

            this.send(
                new Overlay(Opcodes.Overlay.Set, {
                    image: overlay.fog || 'empty',
                    colour: `rgba(0,0,0,${overlay.darkness})`
                })
            );
        } else this.send(new Overlay(Opcodes.Overlay.Remove));
    }

    public updateCamera(camera: Area | undefined): void {
        if (this.cameraArea === camera) return;

        this.cameraArea = camera;

        if (camera)
            switch (camera.type) {
                case 'lockX':
                    this.send(new Camera(Opcodes.Camera.LockX));
                    break;

                case 'lockY':
                    this.send(new Camera(Opcodes.Camera.LockY));
                    break;

                case 'player':
                    this.send(new Camera(Opcodes.Camera.Player));
                    break;
            }
        else this.send(new Camera(Opcodes.Camera.FreeFlow));
    }

    public updateMusic(info?: Area): void {
        if (!info || info.song === this.currentSong) return;

        this.currentSong = info.song;

        this.send(new Audio(info.song));
    }

    public revertPoints(): void {
        this.hitPoints.setHitPoints(this.hitPoints.getMaxHitPoints());
        this.mana.setMana(this.mana.getMaxMana());

        this.sync();
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

    private getMovementSpeed(): number {
        // let itemMovementSpeed = Items.getMovementSpeed(this.armour.name),
        //     movementSpeed = itemMovementSpeed || this.defaultMovementSpeed;

        // /*
        //  * Here we can handle equipment/potions/abilities that alter
        //  * the player's movement speed. We then just broadcast it.
        //  */

        // this.movementSpeed = movementSpeed;

        return this.defaultMovementSpeed;
    }

    /**
     * Setters
     */

    public override setPosition(x: number, y: number): void {
        if (this.dead) return;

        if (this.map.isOutOfBounds(x, y)) this.sendToSpawn();
        else super.setPosition(x, y);

        this.sendToRegions(
            new Movement(Opcodes.Movement.Move, {
                instance: this.instance,
                x,
                y,
                forced: false,
                teleport: false
            }),
            true
        );
    }

    public setOrientation(orientation: number): void {
        this.orientation = orientation;

        if (this.orientationCallback)
            // Will be necessary in the future.
            this.orientationCallback;
    }

    /**
     * Override the `setRegion` in Entity by adding a callback.
     * @param region The new region we are setting.
     */

    public override setRegion(region: number): void {
        super.setRegion(region);
        if (region !== -1) this.regionCallback?.(region);
    }

    /**
     * Getters
     */

    public hasMaxMana(): boolean {
        return this.mana.getMana() >= this.mana.getMaxMana();
    }

    public override hasSpecialAttack(): boolean {
        return false;
    }

    public canBeStunned(): boolean {
        return true;
    }

    /**
     * Grabs the spawn point on the player depending on whether or not he
     * has finished the tutorial quest.
     * @returns The spawn point Position object containing x and y grid positions.
     */

    public getSpawn(): Position {
        if (config.tutorialEnabled && !this.quests.isTutorialFinished())
            return Utils.getPositionFromString(Modules.Constants.TUTORIAL_SPAWN_POINT);

        return Utils.getPositionFromString(Modules.Constants.SPAWN_POINT);
    }

    public getHit(target: Character): Hit | undefined {
        let weapon = this.equipment.getWeapon(),
            defaultDamage = Formulas.getDamage(this, target),
            isSpecial = Utils.randomInt(0, 100) < 30 + weapon.abilityLevel * 3;

        if (!isSpecial || !this.hasSpecialAttack())
            return new Hit(Modules.Hits.Damage, defaultDamage);

        let multiplier: number, damage: number;

        switch (weapon.ability) {
            case Modules.Enchantment.Critical:
                /**
                 * Still experimental, not sure how likely it is that you're
                 * gonna do a critical strike. I just do not want it getting
                 * out of hand, it's easier to buff than to nerf..
                 */

                multiplier = 1 + weapon.abilityLevel;
                damage = defaultDamage * multiplier;

                return new Hit(Modules.Hits.Critical, damage);

            case Modules.Enchantment.Stun:
                return new Hit(Modules.Hits.Stun, defaultDamage);

            case Modules.Enchantment.Explosive:
                return new Hit(Modules.Hits.Explosive, defaultDamage);
        }
    }

    public loadRegion(region: number): void {
        this.regionsLoaded.push(region);
    }

    public hasLoadedRegion(region: number): boolean {
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

    /**
     * Checks if the weapon the player is currently wielding is a ranged weapon.
     * @returns If the weapon slot is a ranged weapon.
     */

    public override isRanged(): boolean {
        return this.equipment.getWeapon().rangedWeapon;
    }

    /**
     * Miscellaneous
     */

    /**
     * We create this function to make it easier to send
     * packets to players instead of always importing `world`
     * in other classes.
     * @param packet Packet we are sending to the player.
     */

    public send(packet: Packet): void {
        this.world.push(PacketType.Player, {
            packet,
            player: this
        });
    }

    public sendToSpawn(): void {
        let spawnPoint = this.getSpawn();

        this.setPosition(spawnPoint.x, spawnPoint.y);
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
            oFormattedName = Utils.formatName(playerName), // Formated username of the other player.
            formattedName = Utils.formatName(this.username); // Formatted username of current instance.

        otherPlayer.notify(`[From ${oFormattedName}]: ${message}`, 'aquamarine');
        this.notify(`[To ${formattedName}]: ${message}`, 'aquamarine');
    }

    /**
     * Function to be used for syncing up health,
     * mana, exp, and other variables
     */

    public sync(): void {
        // Update attack range each-time we sync.
        this.attackRange = this.isRanged() ? 7 : 1;

        // Sync the player information to the surrounding regions.
        this.sendToRegions(new Sync(this.serialize(true)));
    }

    /**
     * Sends a popup message to the player (generally used
     * for quests or achievements);
     * @param title The header text for the popup.
     * @param message The text contents of the popup.
     * @param colour The colour of the popup's text.
     */

    public popup(title: string, message: string, colour: string): void {
        if (!title) return;

        title = Utils.parseMessage(title);
        message = Utils.parseMessage(message);

        this.send(
            new Notification(Opcodes.Notification.Popup, {
                title,
                message,
                colour
            })
        );
    }

    /**
     * Sends a chatbox message to the player.
     * @param message String text we want to display to the player.
     * @param colour Optional parameter indicating text colour.
     */

    public notify(message: string, colour?: string): void {
        if (!message) return;

        // Prevent notify spams
        if (Date.now() - this.lastNotify < 250) return;

        message = Utils.parseMessage(message);

        this.send(
            new Notification(Opcodes.Notification.Text, {
                message,
                colour
            })
        );

        this.lastNotify = Date.now();
    }

    public pointer(type: Opcodes.Pointer, info: PointerData): void {
        // Remove all existing pointers first.
        this.send(new Pointer(Opcodes.Pointer.Remove));

        // Invalid pointer data received.
        if (!(type in Opcodes.Pointer)) return;

        info.instance = this.instance;

        this.send(new Pointer(type, info));
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
            new Chat({
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
            new Movement(Opcodes.Movement.Stop, {
                instance: this.instance,
                force
            })
        );
    }

    public save(): void {
        if (config.skipDatabase || this.isGuest || !this.ready) return;

        this.database.creator?.save(this);
    }

    public hasAggressionTimer(): boolean {
        return Date.now() - this.lastRegionChange < 60_000 * 20; // 20 Minutes
    }

    public finishedQuest(id: number): boolean {
        return false;
        // let quest = this.quests?.getQuest(id);

        // return quest?.isFinished() || false;
    }

    public finishedAchievement(id: number): boolean {
        return false;
        // if (!this.quests) return false;

        // let achievement = this.quests.getAchievement(id);

        // if (!achievement) return true;

        // return achievement.isFinished();
    }

    public finishAchievement(id: number): void {
        // if (!this.quests) return;
        // let achievement = this.quests.getAchievement(id);
        // if (!achievement || achievement.isFinished()) return;
        // achievement.finish();
    }

    /**
     * Serializes the player character to be sent to
     * nearby regions. This contains all the data
     * about the player that other players should
     * be able to see.
     * @returns PlayerData containing all of the player info.
     */

    public override serialize(withEquipment?: boolean): PlayerData {
        let data = super.serialize() as PlayerData;

        data.rights = this.rights;
        data.level = this.level;
        data.hitPoints = this.hitPoints.getHitPoints();
        data.maxHitPoints = this.hitPoints.getMaxHitPoints();
        data.attackRange = this.attackRange;
        data.orientation = this.orientation;
        data.movementSpeed = this.getMovementSpeed();

        // Include equipment only when necessary.
        if (withEquipment) data.equipments = this.equipment.serialize().equipments;

        return data;
    }

    public onOrientation(callback: () => void): void {
        this.orientationCallback = callback;
    }

    public onKill(callback: KillCallback): void {
        this.killCallback = callback;
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
