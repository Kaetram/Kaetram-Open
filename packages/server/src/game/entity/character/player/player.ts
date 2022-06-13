import Warp from './warp';
import Skills from './skills';
import Quests from './quests';
import Hit from '../combat/hit';
import Handler from './handler';
import Mana from '../points/mana';
import Map from '../../../map/map';
import Character from '../character';
import Equipments from './equipments';
import Item from '../../objects/item';
import Bank from './containers/impl/bank';
import Achievements from './achievements';
import Regions from '../../../map/regions';
import Tree from '../../../globals/impl/tree';
import Abilities from './abilities/abilities';
import Formulas from '../../../../info/formulas';
import Inventory from './containers/impl/inventory';
import Packet from '@kaetram/server/src/network/packet';
import Incoming from '../../../../controllers/incoming';
import Entities from '@kaetram/server/src/controllers/entities';

import type World from '../../../world';
import type MongoDB from '../../../../database/mongodb/mongodb';
import type Connection from '../../../../network/connection';
import type NPC from '../../npc/npc';
import type Area from '../../../map/areas/area';
import type { PlayerInfo } from './../../../../database/mongodb/creator';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import { Modules, Opcodes } from '@kaetram/common/network';
import { PacketType } from '@kaetram/common/network/modules';
import { PlayerData } from '@kaetram/common/types/player';
import { PointerData } from '@kaetram/common/types/pointer';
import { ProcessedDoor } from '@kaetram/common/types/map';
import {
    Audio,
    Camera,
    Chat,
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
import { ExperiencePacket, OverlayPacket } from '@kaetram/common/types/messages/outgoing';

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

export default class Player extends Character {
    public map: Map;
    private regions: Regions;
    private entities: Entities;

    public incoming: Incoming;

    private handler: Handler;

    public warp: Warp = new Warp(this);
    public quests: Quests = new Quests(this);
    public achievements: Achievements = new Achievements(this);
    public skills: Skills = new Skills(this);
    public equipment: Equipments = new Equipments(this);
    public mana: Mana = new Mana(Formulas.getMaxMana(this.level));
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

    // TODO - REFACTOR THESE ------------

    public webSocketClient;

    public abilities;

    public team?: string; // TODO
    public userAgent!: string;

    private disconnectTimeout: NodeJS.Timeout | null = null;
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes
    public lastRegionChange = Date.now();

    private currentSong: string | null = null;

    public regionsLoaded: number[] = [];
    public treesLoaded: { [instance: string]: Modules.TreeState } = {};
    public lightsLoaded: number[] = [];

    public npcTalk = '';
    // Currently open store of the player.
    public storeOpen = '';

    public movementStart!: number;
    public pingTime!: number;

    private lastNotify!: number;

    private nextExperience = -1;
    private prevExperience = -1;

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

    private cheatScoreCallback?: () => void;
    private profileToggleCallback?: InterfaceCallback;
    private inventoryToggleCallback?: InterfaceCallback;
    private warpToggleCallback?: InterfaceCallback;
    private orientationCallback?: () => void;

    public constructor(world: World, public database: MongoDB, public connection: Connection) {
        super(connection.id, world, '', -1, -1);

        this.map = world.map;
        this.regions = world.map.regions;
        this.entities = world.entities;

        this.incoming = new Incoming(this);
        this.handler = new Handler(this);

        // TODO - Refactor
        this.abilities = new Abilities(this);

        this.webSocketClient = connection.type === 'WebSocket';
    }

    /**
     * Begins the loading process by first inserting the database
     * information into the player object. The loading process works
     * as follows, a request to load the equipment data is made,
     * once that is completed, the callback in the player handler
     * begins loading the inventory, then the bank and quests, then
     * achievements, then skills, and finally the `intro` packet
     * is sent to the client. This is because we want to load the aforementioned
     * objects prior to entering the region since it may affect dynamic data,
     * entity information, and other stuff. The region system must have the player
     * fully loaded from the database prior to calculating region data.
     * @param data PlayerInfo object containing all data.
     */

    public load(data: PlayerInfo): void {
        // Store coords for when we're done loading.
        this.x = data.x;
        this.y = data.y;
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

        this.warp.setLastWarp(data.lastWarp);

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        this.userAgent = data.userAgent;

        // TODO - Do not calculate max points on every login, just store it instead.
        this.hitPoints.updateHitPoints([data.hitPoints, Formulas.getMaxHitPoints(this.level)]);
        this.mana.updateMana([data.mana, Formulas.getMaxMana(this.level)]);

        // Being the loading process.
        this.loadEquipment();

        // equipment -> inventory/bank -> quests -> achievements -> skills -> intro
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
     * Loads the quest data from the database.
     */

    public loadQuests(): void {
        this.database.loader?.loadQuests(this, this.quests.load.bind(this.quests));
    }

    /**
     * Loads the achievement data from the database.
     */

    public loadAchievements(): void {
        this.database.loader?.loadAchievements(
            this,
            this.achievements.load.bind(this.achievements)
        );
    }

    /**
     * Loads the skill data from the database.
     */

    public loadSkills(): void {
        this.database.loader?.loadSkills(this, this.skills.load.bind(this.skills));
    }

    /**
     * Handle the actual player login. Check if the user is banned,
     * update hitPoints and mana, and send the player information
     * to the client.
     */

    public intro(): void {
        if (this.ban > Date.now()) return this.connection.reject('ban');

        if (this.hitPoints.getHitPoints() < 0)
            this.hitPoints.setHitPoints(this.hitPoints.getMaxHitPoints());

        if (this.mana.getMana() < 0) this.mana.setMana(this.mana.getMaxMana());

        /**
         * Send player data to client here
         */

        this.setPosition(this.x, this.y); // Set coords we loaded in `load`

        this.entities.addPlayer(this);

        this.send(new Welcome(this.serialize(false, true)));
    }

    public destroy(): void {
        this.combat.stop();
        this.skills.stop();

        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = null;

        this.handler = null!;
        this.inventory = null!;
        this.abilities = null!;
        this.skills = null!;
        this.quests = null!;
        this.bank = null!;
        this.warp = null!;

        this.connection = null!;
    }

    public addExperience(exp: number): void {
        this.experience += exp;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        let data = {
            instance: this.instance,
            level: this.level
        } as ExperiencePacket;

        if (oldLevel !== this.level) {
            this.hitPoints.setMaxHitPoints(Formulas.getMaxHitPoints(this.level));
            this.healHitPoints(this.hitPoints.maxPoints);

            this.updateRegion();

            this.popup('Level Up!', `Congratulations, you are now level ${this.level}!`, '#ff6600');
        }

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
                instance: this.instance,
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
                instance: this.instance,
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

    public teleport(x: number, y: number, withAnimation = false): void {
        this.sendToRegions(
            new Teleport({
                instance: this.instance,
                x,
                y,
                withAnimation
            })
        );

        this.setPosition(x, y, false);
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
     * Handler for when a container slot is selected at a specified index. Depending
     * on the type, we act accordingly. If we click an inventory, we check if the item
     * is equippable or consumable and remove it from the inventory. If we click a bank
     * element, we must move it from the inventory to the bank or vice versa.
     * @param type The type of container we are working with.
     * @param index Index at which we are selecting the item.
     */

    public handleContainerSelect(
        type: Modules.ContainerType,
        index: number,
        subType?: Modules.ContainerType
    ): void {
        let item: Item;

        switch (type) {
            case Modules.ContainerType.Inventory:
                item = this.inventory.getItem(this.inventory.get(index));

                if (!item) return;

                if (item.edible) {
                    item.plugin?.onUse(this);
                    this.inventory.remove(index, 1);
                }

                if (item.isEquippable()) {
                    this.inventory.remove(index);
                    this.equipment.equip(item);
                }

                break;

            case Modules.ContainerType.Bank:
                if (subType === Modules.ContainerType.Bank) this.inventory.move(this.bank, index);
                else if (subType === Modules.ContainerType.Inventory)
                    this.bank.move(this.inventory, index);

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

    /**
     * Detects a change in the overlay area. If the player steps in an overlay
     * area, we send the information to the client. If the player exits the area,
     * we remove the overlay.
     * @param overlay An area containing overlay data or an undefined object.
     */

    public updateOverlay(overlay: Area | undefined): void {
        // Don't needlessly update if the overlay is the same
        if (this.overlayArea === overlay) return;

        // Store for comparison.
        this.overlayArea = overlay;

        // No overlay object or invalid object, remove the overlay.
        if (!overlay || !overlay.id) return this.send(new Overlay(Opcodes.Overlay.Remove));

        // New overlay is being loaded, remove lights.
        this.lightsLoaded = [];

        this.send(
            new Overlay(Opcodes.Overlay.Set, {
                image: overlay.fog || 'blank',
                colour: `rgba(0, 0, 0, ${overlay.darkness})`
            })
        );
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

        return this.movementSpeed;
    }

    /**
     * Setters
     */

    /**
     * Override for the superclass `setPosition` function. Since the player must always be
     * synced up to nearby players, this function sends a packet to the nearby region about
     * every movement. It also checks gainst no-clipping and player positionining. In the event
     * no clip is detected, we teleport the player to their old valid position. If the player
     * is out of boudns (generally happens when a new character is created and x/y values are
     * -1) we teleport them to their respective spawn point.
     * @param x The new grid x coordinate we are moving to.
     * @param y The new grd y coordinate we are moving to.
     * @param forced Forced parameters ignores current actions and forces the player to move.
     */

    public override setPosition(x: number, y: number, forced = false): void {
        if (this.dead) return;

        // Teleport the player to the spawn point if the position is invalid.
        if (this.map.isOutOfBounds(x, y)) this.sendToSpawn();
        else super.setPosition(x, y);

        // Check against noclipping by verifying the collision w/ dnyamic tiles.
        if (this.map.isColliding(x, y, this) && this.oldX !== -1 && this.oldY !== -1) {
            this.notify(`Noclip detected in your movement, please submit a bug report.`);
            this.teleport(this.oldX, this.oldY);
            return;
        }

        // Relay a packet to the nearby regions without including the player.
        this.sendToRegions(
            new Movement(Opcodes.Movement.Move, {
                instance: this.instance,
                x,
                y,
                forced
            }),
            true
        );
    }

    public setOrientation(orientation: number): void {
        this.orientation = orientation;

        if (this.orientationCallback) this.orientationCallback();
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
        if (!this.quests.isTutorialFinished())
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

    /**
     * Adds a tree to our loaded tree instances.
     * @param tree The tree we are adding.
     */

    public loadTree(tree: Tree): void {
        this.treesLoaded[tree.instance] = tree.state;
    }

    public hasLoadedRegion(region: number): boolean {
        return this.regionsLoaded.includes(region);
    }

    /**
     * Checks if the tree is within our loaded trees and that the state matches.
     * @param tree The tree we are chceking.
     * @returns If the tree is loaded and the state matches.
     */

    public hasLoadedTree(tree: Tree): boolean {
        return tree.instance in this.treesLoaded && this.treesLoaded[tree.instance] === tree.state;
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
        return this.equipment.getWeapon().ranged;
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

    /**
     * A player's old region is the one they just left from. We grab the first
     * region in the array and send a surrounding region request based on that.
     * @param packet Packet we are sending to the player.
     */

    public sendToOldRegions(packet: Packet): void {
        let [oldRegion] = this.oldRegions;

        if (!oldRegion) return;

        this.world.push(PacketType.Regions, {
            region: oldRegion,
            packet
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
        this.sendToRegions(new Sync(this.serialize(true)), true);
    }

    /**
     * Sends a chat message with the specified text string. The message
     * can be global or only sent to nearby regions.
     * @param message The string data we are sending to the client.
     * @param global Whether or not the message is relayed to all players in the world or just region.
     * @param withBubble Whether or not to display a visual bubble with message in it.
     * @param colour The colour of the message. Defaults client-sided if not specified.
     */

    public chat(message: string, global = false, withBubble = true, colour = ''): void {
        if (this.isMuted()) return this.notify('You are currently muted.', 'crimson');
        if (!this.canTalk) return this.notify('You cannot talk at this time.', 'crimson');

        log.debug(`[${this.username}] ${message}`);

        let name = Utils.formatName(this.username),
            source = `${global ? '[Global]' : ''} ${name}`;

        // Relay the message to the discord channel.
        if (config.discordEnabled) this.world.discord.sendMessage(source, message, undefined, true);

        // API relays the message to the discord server from multiple worlds.
        if (config.hubEnabled) this.world.api.sendChat(source, message);

        if (global) return this.world.globalMessage(name, message, colour);

        let packet = new Chat({
            instance: this.instance,
            message,
            withBubble,
            colour
        });

        this.sendToRegions(packet);
    }

    /**
     * Sends a popup message to the player (generally used
     * for quests or achievements);
     * @param title The header text for the popup.
     * @param message The text contents of the popup.
     * @param colour The colour of the popup's text.
     */

    public popup(title: string, message: string, colour = '#00000'): void {
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

    public notify(message: string, colour = ''): void {
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

    /**
     * Sends a pointer data packet to the player. Removes all
     * existing pointers first to prevent multiple pointers.
     * @param opcode The pointer opcode we are sending.
     * @param info Information for the pointer such as position.
     */

    public pointer(opcode: Opcodes.Pointer, info: PointerData): void {
        // Remove all existing pointers first.
        this.send(new Pointer(Opcodes.Pointer.Remove));

        // Invalid pointer data received.
        if (!(opcode in Opcodes.Pointer)) return;

        info.instance = this.instance;

        this.send(new Pointer(opcode, info));
    }

    /**
     * Forcefully stopping the player will simply halt
     * them in between tiles. Should only be used if they are
     * being transported elsewhere.
     */

    public stopMovement(forced = false): void {
        this.send(
            new Movement(Opcodes.Movement.Stop, {
                instance: this.instance,
                forced
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

    /**
     * Serializes the player character to be sent to
     * nearby regions. This contains all the data
     * about the player that other players should
     * be able to see.
     * @param withEquipment Whether or not to include equipment batch data.
     * @param withExperience Whether or not to incluide experience data.
     * @returns PlayerData containing all of the player info.
     */

    public override serialize(withEquipment = false, withExperience = false): PlayerData {
        let data = super.serialize() as PlayerData;

        // Sprite key is the armour key.
        data.key = this.equipment.getArmour().key || 'clotharmor';
        data.name = Utils.formatName(this.username);
        data.rights = this.rights;
        data.level = this.level;
        data.hitPoints = this.hitPoints.getHitPoints();
        data.maxHitPoints = this.hitPoints.getMaxHitPoints();
        data.attackRange = this.attackRange;
        data.orientation = this.orientation;
        data.movementSpeed = this.getMovementSpeed();

        // Include equipment only when necessary.
        if (withEquipment) data.equipments = this.equipment.serialize().equipments;

        if (withExperience) {
            data.experience = this.experience;
            data.prevExperience = this.prevExperience;
            data.nextExperience = this.nextExperience;
        }

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
}
