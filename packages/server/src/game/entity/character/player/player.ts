import Skills from './skills';
import Quests from './quests';
import Handler from './handler';
import NPC from '../../npc/npc';
import Skill from './skill/skill';
import Mana from '../points/mana';
import Map from '../../../map/map';
import Abilities from './abilities';
import Character from '../character';
import Equipments from './equipments';
import Item from '../../objects/item';
import Statistics from './statistics';
import Bank from './containers/impl/bank';
import Achievements from './achievements';
import Regions from '../../../map/regions';
import Formulas from '../../../../info/formulas';
import Minigame from '../../../minigames/minigame';
import Inventory from './containers/impl/inventory';
import Resource from '../../../globals/impl/resource';
import Packet from '@kaetram/server/src/network/packet';
import Incoming from '../../../../controllers/incoming';
import Entities from '@kaetram/server/src/controllers/entities';

import type World from '../../../world';
import type MongoDB from '../../../../database/mongodb/mongodb';
import type Connection from '../../../../network/connection';
import type Area from '../../../map/areas/area';
import type { PlayerInfo } from './../../../../database/mongodb/creator';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import { Bonuses, Stats } from '@kaetram/common/types/item';
import { Modules, Opcodes } from '@kaetram/common/network';
import { PacketType } from '@kaetram/common/network/modules';
import { PlayerData } from '@kaetram/common/types/player';
import { PointerData } from '@kaetram/common/types/pointer';
import { ProcessedDoor } from '@kaetram/common/types/map';
import { EntityDisplayInfo } from '@kaetram/common/types/entity';
import { Team } from '@kaetram/common/types/minigame.d';
import {
    Music,
    Camera,
    Chat,
    Heal,
    Movement,
    Notification,
    Overlay,
    Sync,
    Teleport,
    Welcome,
    Pointer,
    PVP,
    Spawn,
    Respawn,
    Effect
} from '@kaetram/server/src/network/packets';

type KillCallback = (character: Character) => void;
type NPCTalkCallback = (npc: NPC) => void;
type DoorCallback = (door: ProcessedDoor) => void;
type RegionCallback = (region: number) => void;
type RecentRegionsCallback = (regions: number[]) => void;
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
    public map: Map = this.world.map;
    private regions: Regions = this.world.map.regions;
    private entities: Entities = this.world.entities;

    public incoming: Incoming = new Incoming(this);

    public bank: Bank = new Bank(Modules.Constants.BANK_SIZE);
    public inventory: Inventory = new Inventory(Modules.Constants.INVENTORY_SIZE);

    public abilities: Abilities = new Abilities(this);
    public quests: Quests = new Quests(this);
    public achievements: Achievements = new Achievements(this);
    public skills: Skills = new Skills(this);
    public equipment: Equipments = new Equipments(this);
    public mana: Mana = new Mana(Formulas.getMaxMana(this.level));
    public statistics: Statistics = new Statistics();

    public handler: Handler = new Handler(this);

    public ready = false; // indicates if login processed finished
    public isGuest = false;
    public canTalk = true;
    public noclip = false;
    public questsLoaded = false;
    public achievementsLoaded = false;
    public invalidMovement = false;

    // Special status
    public running = false;
    public dualistsMark = false;
    public thickSkin = false;

    // Player info
    public password = '';
    public email = '';
    public userAgent = '';

    public rights = 0;

    // Warps
    public lastWarp = 0;

    // Ban and mute values
    public ban = 0; // epoch timestamp
    public mute = 0;

    // Player miscellaneous data
    public mapVersion = -1;
    public cheatScore = 0;
    public movementStart = 0;
    public pingTime = 0;

    private lastNotify = 0;

    private disconnectTimeout: NodeJS.Timeout | null = null;
    private timeoutDuration = 1000 * 60 * 10; // 10 minutes

    private currentSong: string | undefined;

    public minigameArea: Area | undefined = undefined;

    // Region data
    public regionsLoaded: number[] = [];
    public resourcesLoaded: { [instance: string]: Modules.ResourceState } = {};
    public lightsLoaded: number[] = [];

    // NPC talking
    public npcTalk = '';
    public talkIndex = 0;

    // Minigame status of the player.
    public minigame = -1; // Opcodes.Minigame
    public team: Team = -1;

    // Currently open store of the player.
    public storeOpen = '';

    private cameraArea: Area | undefined;
    private overlayArea: Area | undefined;

    public killCallback?: KillCallback;
    public npcTalkCallback?: NPCTalkCallback;
    public doorCallback?: DoorCallback;
    public regionCallback?: RegionCallback;
    public recentRegionsCallback?: RecentRegionsCallback;

    private cheatScoreCallback?: () => void;

    public constructor(world: World, public database: MongoDB, public connection: Connection) {
        super(connection.id, world, '', -1, -1);
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
        this.ban = data.ban;
        this.mute = data.mute;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;
        this.userAgent = data.userAgent;
        this.regionsLoaded = data.regionsLoaded || [];

        this.setPoison(data.poison.type, data.poison.start);
        this.setLastWarp(data.lastWarp);

        this.hitPoints.updateHitPoints(data.hitPoints);
        this.mana.updateMana(data.mana);

        // Being the loading process.
        this.loadSkills();
        this.loadEquipment();
        this.loadInventory();
        this.loadBank();
        this.loadQuests();
        this.loadAchievements();
        this.loadStatistics();
        this.loadAbilities();
        this.intro();

        // equipment -> inventory/bank -> quests -> achievements -> skills -> statistics -> abilities -> intro
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
     * Loads the statistics data from the database.
     */

    public loadStatistics(): void {
        this.database.loader?.loadStatistics(this, this.statistics.load.bind(this.statistics));
    }

    /**
     * Loads the abilities data from the database.
     */

    public loadAbilities(): void {
        this.database.loader?.loadAbilities(this, this.abilities.load.bind(this.abilities));
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

        // Timeout the player if the ready packet is not received within 10 seconds.
        setTimeout(() => {
            if (!this.ready) this.connection.reject('error');
        }, 10_000);

        /**
         * Send player data to client here
         */

        this.setPosition(this.x, this.y); // Set coords we loaded in `load`

        this.entities.addPlayer(this);

        this.send(new Welcome(this.serialize(false, true, true)));
    }

    /**
     * Handles the player respawning in the world.
     */

    public respawn(): void {
        // Cannot respawn if the player is not marked as dead.
        if (!this.dead) return log.warning(`Invalid respawn request.`);

        let spawn = this.getSpawn();

        this.dead = false;
        this.setPosition(spawn.x, spawn.y);

        // Signal to other players that the player is spawning.
        this.sendToRegions(new Spawn(this), true);

        this.send(new Respawn(this));

        this.hitPoints.reset();
        this.mana.reset();

        this.sync();
    }

    /**
     * Override of the heal superclass function. Heals by a specified amount, and givne the
     * type, we will heal only the hitpoints or the mana with a special effect associated. If no
     * type is specified, then it proceeds to heal both hitpoints and mana.
     * @param amount The amount we are healing by.
     * @param type The type of heal we are performing ('passive' | 'hitpoints' | 'mana');
     */

    public override heal(amount = 1, type: Modules.HealTypes = 'passive'): void {
        switch (type) {
            case 'passive':
                if (!this.mana.isFull()) this.mana.increment(amount);

                // Scale the heal rate by the maximum hitpoints.
                amount += Math.floor(this.hitPoints.getMaxHitPoints() * 0.005);

                super.heal(amount);

                break;

            case 'hitpoints':
            case 'mana':
                if (type === 'hitpoints') this.hitPoints.increment(amount);
                else if (type === 'mana') this.mana.increment(amount);

                this.sendToRegions(
                    new Heal({
                        instance: this.instance,
                        type,
                        amount
                    })
                );
                break;
        }

        this.sync();
    }

    /**
     * Updates the region that the player is currently in.
     */

    public updateRegion(): void {
        this.regions.sendRegion(this);
    }

    /**
     * Synchronizes the display info of the entities.
     */

    public updateEntities(): void {
        this.regions.sendDisplayInfo(this);
    }

    /**
     * Synchronizes the player's client entity list and server entities in a region.
     */

    public updateEntityList(): void {
        this.regions.sendEntities(this);
    }

    /**
     * Performs a teleport to a specified destination. We send a teleport packet
     * then proceed to update the player's position server-sided.
     * @param x The new x grid coordinate.
     * @param y The new y grid coordinate.
     * @param withAnimation Whether or not to display a special effect when teleporting.
     */

    public teleport(x: number, y: number, withAnimation = false, before = false): void {
        if (this.dead) return;

        if (before) this.sendTeleportPacket(x, y, withAnimation);

        this.setPosition(x, y, false);
        this.world.cleanCombat(this);

        if (before) return;

        this.sendTeleportPacket(x, y, withAnimation);
    }

    /**
     * Sends the teleport packet to the nearby regions.
     * @param x The new x grid coordinate.
     * @param y The new y grid coordinate.
     * @param withAnimation Whether or not to animate the teleportation.
     */

    private sendTeleportPacket(x: number, y: number, withAnimation = false): void {
        this.sendToRegions(
            new Teleport({
                instance: this.instance,
                x,
                y,
                withAnimation
            })
        );
    }

    /**
     * Increases the amount of times the cheat detection system
     * noticed something fishy.
     * @param amount The amount we are increasing the cheat score by.
     */

    public incrementCheatScore(reason = '', amount = 1): void {
        if (this.combat.started) return;
        if (reason) log.debug(`[${this.username}] ${reason}`);

        this.cheatScore += amount;

        this.cheatScoreCallback?.();
    }

    /**
     * Verifies that the movement is valid and not no-clipping through collisions.
     * @param x The grid x coordinate we are checking.
     * @param y The grid y coordinate we are checking.
     * @returns Whether or not the location is colliding.
     */

    private verifyCollision(x: number, y: number): boolean {
        let isColliding = this.map.isColliding(x, y, this) && !this.noclip;

        if (isColliding) {
            /**
             * If the old coordinate values are invalid or they may cause a loop
             * in the `teleport` function, we instead send the player to the spawn point.
             */
            if (
                (this.oldX === -1 && this.oldY === -1) ||
                (this.oldX === this.x && this.oldY === this.y)
            ) {
                this.sendToSpawn();
                return true;
            }

            // Send player to the last valid position.
            this.notify(`Noclip detected at ${x}, ${y}. Please submit a bug report.`);
            this.teleport(this.oldX, this.oldY);
        }

        return isColliding;
    }

    /**
     * Used to verify an anomaly within the player's step movement. We check a variety
     * of factors to avoid false-positives.
     * @param x The grid x coordinate we are checking.
     * @param y The grid y coordinate we are checking.
     */

    private verifyMovement(x: number, y: number): boolean {
        let now = Date.now(),
            stepDiff = now - this.lastStep,
            regionDiff = now - this.lastRegionChange;

        // Firstly ensure that the last step was behaving normally.
        if (stepDiff > this.getMovementSpeed()) return false;

        // A region change may trigger a movement anomaly, so we ignore movement within 1 second of a region change.
        if (regionDiff < 1000) return false;

        // Check if the player is currently going into a door.
        if (this.map.isDoor(x, y)) return false;

        return true;
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

                if (item.edible && item.plugin?.onUse(this)) this.inventory.remove(index, 1);

                if (item.isEquippable() && item.canEquip(this)) {
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

    /**
     * Handles the interaction with a global object. This can be a tree,
     * a sign, etc.
     * @param instance The string identifier of the object. Generally
     * represents a coordinate that we use to find the object.
     */

    public handleObjectInteraction(instance: string): void {
        this.cheatScore = 0;

        // Attempt to first find a sign with the given instance.
        let sign = this.world.globals.getSigns().get(instance);

        if (sign) return sign.talk(this);

        // If no sign was found, we attempt to find a tree.
        let coords = instance.split('-'),
            index = this.map.coordToIndex(parseInt(coords[0]), parseInt(coords[1])),
            tree = this.world.globals.getTrees().findResource(index);

        // No tree found, we stop here.
        if (!tree) return log.debug(`No tree found at ${instance}.`);

        // Start the cutting process.
        this.skills.getLumberjacking().cut(this, tree);
    }

    /**
     * Compares the user agent and regions loaded against values from the database. We also
     * ensure that the map version of the player when he last logged in is the same as the
     * most recent one. If these conditions aren't met we signal to the server that the player
     * has no map data saved.
     * @param userAgent The user agent string.
     * @param regionsLoaded Number of regions that the client has loaded.
     */

    public handleUserAgent(userAgent: string, regionsLoaded = 0): void {
        // Client's number of regions loaded, user agent, and map version must match.
        if (
            this.regionsLoaded.length === regionsLoaded &&
            this.userAgent === userAgent &&
            this.mapVersion === this.map.version
        )
            return;
        // Update user agent and map version, and reset loaded regions information.
        this.userAgent = userAgent;
        this.mapVersion = this.map.version;
        this.regionsLoaded = [];

        log.debug(`Reset user agent and regions loaded for ${this.username}.`);
    }

    /**
     * Handles experience received from killing a mob. Here we check the type of
     * damage the player was dealing, whether or not he was using magic, ranged, or
     * melee, and what kind of melee weapon he was using. We then add the experience
     * to the appropriate skill.
     * @param experience The amount of experience we are adding.
     */

    public handleExperience(experience: number): void {
        let weapon = this.equipment.getWeapon();

        /**
         * Health experience is a third of the total experience the mob rewards. This is
         * because the player is being rewarded experience for the other skills. Health
         * experience is always granted regardless of the damage type.
         */

        this.skills.get(Modules.Skills.Health).addExperience(Math.floor(experience / 3));

        // Once a third of the exp is added to health, we distribute remaining experience to the other skills.
        experience = Math.ceil(experience - experience / 3);

        // Ranged/archery based damage, we add remaining experience to the archery skill.
        if (weapon.ranged) return this.skills.get(Modules.Skills.Archery).addExperience(experience);

        /**
         * If the weapon is both a strength and accuracy weapon, then we evenly distribute
         * the remaining experience to both the strength and accuracy skills. Otherwise
         * we add the remaining experience to the skill that the weapon is based on. Default
         * is accuracy if the weapon is not based on any skill.
         */

        if (weapon.isStrength() && weapon.isAccuracy()) {
            this.skills.get(Modules.Skills.Strength).addExperience(Math.floor(experience / 2));
            this.skills.get(Modules.Skills.Accuracy).addExperience(Math.floor(experience / 2));
        } else if (weapon.isStrength())
            this.skills.get(Modules.Skills.Strength).addExperience(experience);
        else this.skills.get(Modules.Skills.Accuracy).addExperience(experience);
    }

    /**
     * Handles the request for a movement to a new position. This is the preliminary check for
     * anti-cheating.
     * @param x The player's x coordinate as reported by the client.
     * @param y The player's y coordinate as reported by the client.
     * @param target If the player is requesting movement towards an entity.
     * @param following Whether or not the player is actively following an entity.
     */

    public handleMovementRequest(x: number, y: number, target: string, following: boolean): void {
        if (this.map.isDoor(x, y) || (target && following)) return;
        if (this.inCombat()) return;

        if (x !== this.x || y !== this.y) {
            this.notify(
                `No-clipping has been detected in your client. Your movement will not be registered.`
            );
            this.invalidMovement = true;
        }
    }

    /**
     * Handles the beginning of the player's movement. We mark down when the player has started moving
     * and check against the movement speed with the server value. We stop skills and combat when
     * movement has commenced.
     * @param x The player's x coordinate as reported by the client.
     * @param y The player's y coordinate as reported by the client.
     * @param speed The movement speed of the player.
     * @param target A character target instance if the player is moving towards a character.
     */

    public handleMovementStarted(x: number, y: number, speed: number, target: string): void {
        this.movementStart = Date.now();

        // Invalid movement speed reported by the client.
        if (speed !== this.movementSpeed) this.incrementCheatScore('Mismatch in movement speed.');

        // Stop combat and skills every time thre is movement.
        this.skills.stop();

        if (!target) this.combat.stop();

        // Mark the player as moving.
        this.moving = true;
    }

    /**
     * A movement step occurs every time a player traverses to the next tile.
     * @param x The current x coordinate of the player as reported by the client.
     * @param y The current y coordinate of the player as reported by the client.
     */

    public handleMovementStep(x: number, y: number): void {
        if (this.stunned || this.invalidMovement) return;

        if (this.verifyMovement(x, y))
            this.incrementCheatScore(`Mismatch in movement speed: ${Date.now() - this.lastStep}`);

        this.setPosition(x, y);

        this.lastStep = Date.now();
    }

    /**
     * Handles the player coming to a stop after movement has finished.
     * @param x The player's x coordinate as reported by the client.
     * @param y The player's y coordinate as reported by the client.
     * @param target A character target instance if the player is stopping at an entity.
     * @param orientation The orientation of the player as reported by the client.
     */

    public handleMovementStop(x: number, y: number, target: string, orientation: number): void {
        let entity = this.entities.get(target);

        // No start movement received.
        if (!this.moving) this.incrementCheatScore('Did not receive movement started packet.');

        // Update orientation
        this.setOrientation(orientation);

        // Player has stopped on top of an item.
        if (entity?.isItem()) this.inventory.add(entity);

        // Update the player's position.
        if (!this.invalidMovement) this.setPosition(x, y);

        // Handle doors when the player stops on one.
        if (this.map.isDoor(x, y) && !target) {
            let door = this.map.getDoor(x, y);

            this.doorCallback?.(door);
        }

        // Movement has come to an end.
        this.moving = false;
        this.lastMovement = Date.now();
    }

    /**
     * Updates the PVP status of the player and syncs it up with the
     * other players in the region.
     * @param pvp The PVP status we are detecting.
     */

    public updatePVP(pvp: boolean): void {
        // Skip if pvp state is the same or it's permanent
        if (this.pvp === pvp) return;

        if (this.pvp && !pvp) this.notify('You are no longer in a PvP zone!');
        else this.notify('You have entered a PvP zone!');

        this.pvp = pvp;

        this.send(
            new PVP({
                state: this.pvp
            })
        );
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

        if (!overlay) this.overlayArea?.removePlayer(this);

        // Store for comparison.
        this.overlayArea = overlay;

        // No overlay object or invalid object, remove the overlay.
        if (!overlay) return this.send(new Overlay(Opcodes.Overlay.Remove));

        // New overlay is being loaded, remove lights.
        this.lightsLoaded = [];

        this.send(
            new Overlay(Opcodes.Overlay.Set, {
                image: overlay.fog || 'blank',
                colour: `rgba(0, 0, 0, ${overlay.darkness})`
            })
        );

        if (overlay.type === 'damage') overlay.addPlayer(this);
    }

    /**
     * Detects a camera region and sends a packet to the client.
     * @param camera Camera area containing camera data or an undefined object.
     */

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

    /**
     * Receives information about the current music area the player is in.
     * @param info The music area information, could be undefined.
     */

    public updateMusic(info?: Area): void {
        let song = info?.song;

        if (song === this.currentSong) return;

        this.currentSong = song;

        this.send(new Music(song));
    }

    /**
     * Updates the current minigame area the player is in. It also creates a callback
     * to the area itself when the player enters (or exits).
     * @param info The area the player is entering, or undefined if they are exiting.
     */

    public updateMinigame(info?: Area): void {
        if (info === this.minigameArea) return;

        let entering = info !== undefined && this.minigameArea === undefined;

        if (entering) {
            info?.enterCallback?.(this);
            this.notify('Welcome to the TeamWar lobby!');
        } else this.minigameArea?.exitCallback?.(this);

        this.minigameArea = info;
    }

    /**
     * Dynamically set movement speed depending on player's equipment, level,
     * abilities, and some other factors that will be added in the future.
     * @returns The movement speed of the player.
     */

    public getMovementSpeed(): number {
        let speed = Modules.Defaults.MOVEMENT_SPEED, // Start with default.
            armour = this.equipment.getArmour();

        // Update the movement speed with that of the armour currently wielded.
        if (armour.hasMovementModifier()) speed = armour.movementSpeed;

        // Apply a 10% speed boost if the player running effect is present.
        if (this.running) speed = Math.floor(speed * 0.9);

        // Update the movement speed if there is a change from default.
        if (this.movementSpeed !== speed) this.setMovementSpeed(speed);

        return speed;
    }

    /**
     * Setters
     */

    public setMovementSpeed(movementSpeed: number): void {
        this.movementSpeed = movementSpeed;

        // Sync to other players in the region.
        this.sendToRegions(
            new Effect(Opcodes.Effect.Speed, {
                instance: this.instance,
                movementSpeed
            })
        );
    }

    /**
     * Updates the running status of the player and sends an update of the movement
     * speed to the client. We use the the `getMovementSpeed()` function to calculate
     * the speed of the player. We do this since there may be other effects present,
     * so we want the speed to stack with other effects rather than be overwritten.
     * @param running Whether or not the player is running.
     */

    public setRunning(running: boolean): void {
        log.debug(`${this.username} is running: ${running}`);

        this.running = running;

        this.sendToRegions(
            new Effect(Opcodes.Effect.Speed, {
                instance: this.instance,
                movementSpeed: this.getMovementSpeed()
            })
        );
    }

    /**
     * Sets the status of the dualists mark effect and updates
     * the combat loop to represent the new attack rate.
     * @param dualistsMark Effect status of the dualists mark.
     */

    public setDualistsMark(dualistsMark: boolean): void {
        this.dualistsMark = dualistsMark;

        this.combat.updateLoop();
    }

    /**
     * Override for the superclass `setPosition` function. Since the player must always be
     * synced up to nearby players, this function sends a packet to the nearby region about
     * every movement. It also checks gainst no-clipping and player positionining. In the event
     * no clip is detected, we teleport the player to their old valid position. If the player
     * is out of bounds (generally happens when a new character is created and x/y values are
     * -1) we teleport them to their respective spawn point.
     * @param x The new grid x coordinate we are moving to.
     * @param y The new grd y coordinate we are moving to.
     * @param forced Forced parameters ignores current actions and forces the player to move.
     * @param skip Whether or not to skip sending a packet to nearby regions.
     */

    public override setPosition(x: number, y: number, forced = false, skip = false): void {
        if (this.dead || this.verifyCollision(x, y)) return;

        // Sets the player's new position.
        super.setPosition(x, y);

        if (skip) return;

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

    /**
     * Override the `setRegion` in Entity by adding a callback.
     * @param region The new region we are setting.
     */

    public override setRegion(region: number): void {
        super.setRegion(region);

        if (region !== -1) this.regionCallback?.(region);
    }

    /**
     * Override for the recent region function with an added callback.
     * @param regions The regions the player just left from.
     */

    public override setRecentRegions(regions: number[]): void {
        super.setRecentRegions(regions);

        if (regions.length > 0) this.recentRegionsCallback?.(regions);
    }

    /**
     * Updates the lastWarp time variable. Primarily used to reload
     * the last warped time after logging out and back in.
     * @param lastWarp The date in milliseconds of the last warp. Defaults to now.
     */

    public setLastWarp(lastWarp: number = Date.now()): void {
        this.lastWarp = isNaN(lastWarp) ? 0 : lastWarp;
    }

    /**
     * Override for the superclass display info. Uses the player's team
     * to determine what colour to draw the username.
     * @returns Display info containing the name colour.
     */

    public override getDisplayInfo(): EntityDisplayInfo {
        return {
            instance: this.instance,
            colour: this.team === Team.Red ? 'red' : 'blue'
        };
    }

    /**
     * Override for the superclass `hasDisplayInfo()`. Relies on whether
     * or not the player is in a minigame currently.
     * @returns Whether or not the player is in a minigame.
     */

    public override hasDisplayInfo(): boolean {
        return this.inMinigame();
    }

    /**
     * Getters
     */

    /**
     * Grabs the spawn point on the player depending on whether or not he
     * has finished the tutorial quest.
     * @returns The spawn point Position object containing x and y grid positions.
     */

    public getSpawn(): Position {
        if (!this.quests.isTutorialFinished())
            return Utils.getPositionFromString(Modules.Constants.TUTORIAL_SPAWN_POINT);

        if (this.inMinigame()) return this.getMinigame()?.getRespawnPoint(this.team);

        return Utils.getPositionFromString(Modules.Constants.SPAWN_POINT);
    }

    /**
     * Calculates the total experience by adding up all the skills experience.
     * @returns Integer representing the total experience.
     */

    public getTotalExperience(): number {
        let total = 0;

        this.skills.forEachSkill((skill: Skill) => (total += skill.experience));

        return total;
    }

    /**
     * @returns Finds and returns a minigame based on the player's minigame.
     */

    public getMinigame(): Minigame {
        return this.world.minigames.get(this.minigame);
    }

    /**
     * Adds a region id to the list of loaded regions.
     * @param region The region id we are adding.
     */

    public loadRegion(region: number): void {
        this.regionsLoaded.push(region);
    }

    /**
     * Adds a resource to our loaded resource instances.
     * @param resource The resource we are adding.
     */

    public loadResource(resource: Resource): void {
        this.resourcesLoaded[resource.instance] = resource.state;
    }

    public hasLoadedRegion(region: number): boolean {
        return this.regionsLoaded.includes(region);
    }

    /**
     * Checks if the resource is within our loaded resources and that the state matches.
     * @param resource The resource we are chceking.
     * @returns If the resource is loaded and the state matches.
     */

    public hasLoadedResource(resource: Resource): boolean {
        return (
            resource.instance in this.resourcesLoaded &&
            this.resourcesLoaded[resource.instance] === resource.state
        );
    }

    public hasLoadedLight(light: number): boolean {
        return this.lightsLoaded.includes(light);
    }

    /**
     * Disconnects the player and sends the UTF8 error message to the client.
     */

    public timeout(): void {
        if (!this.connection) return;

        this.connection.sendUTF8('timeout');
        this.connection.close('Player timed out.');
    }

    /**
     * Resets the timeout every time an action is performed. This way we keep
     * a `countdown` going constantly that resets every time an action is performed.
     */

    public refreshTimeout(): void {
        // Clear the existing timeout and start over.
        this.clearTimeout();

        // Start a new timeout and set the player's timeout variable.
        this.disconnectTimeout = setTimeout(() => this.timeout(), this.timeoutDuration);
    }

    /**
     * Clears the existing disconnect timeout.
     */

    public clearTimeout(): void {
        if (!this.disconnectTimeout) return;

        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = null;
    }

    /**
     * Removes the player from any areas that keep track of players.
     */

    public clearAreas(): void {
        if (this.overlayArea && this.overlayArea.type === 'damage')
            this.overlayArea.removePlayer(this);
    }

    /**
     * Resets the NPC instance and talking index. If a parameter is specified
     * then we set that NPC's instance as the one we are talking to.
     * @param instance Optional parameter to set the NPC instance to.
     */

    public resetTalk(instance?: string): void {
        this.talkIndex = 0;
        this.npcTalk = instance || '';
    }

    /**
     * @returns Checks if the date-time of the mute is greater than current epoch. If it is
     * the player is muted.
     */

    public isMuted(): boolean {
        return this.mute - Date.now() > 0;
    }

    /**
     * Checks if the player is currently in  a minigame.
     */

    public inMinigame(): boolean {
        return this.minigame !== -1;
    }

    /**
     * @returns If the player rights are greater than 0.
     */

    public isMod(): boolean {
        return this.rights > 0;
    }

    /**
     * @returns If the player rights are greater than 1.
     */

    public isAdmin(): boolean {
        return this.rights > 1 || config.skipDatabase;
    }

    /**
     * Checks if the weapon the player is currently wielding is a ranged weapon.
     * @returns If the weapon slot is a ranged weapon.
     */

    public override isRanged(): boolean {
        return this.equipment.getWeapon().ranged;
    }

    /**
     * Players obtain their poisoning abilities from their weapon. Certain
     * weapons may be imbued with a poison effect. This checks if that status
     * is active.
     * @returns Whether or not the weapon is poisonous.
     */

    public override isPoisonous(): boolean {
        return this.equipment.getWeapon().poisonous;
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

    public sendToRecentRegions(packet: Packet): void {
        this.world.push(PacketType.RegionList, {
            list: this.recentRegions,
            packet
        });
    }

    /**
     * Teleports the player back to their spawn point.
     */

    public sendToSpawn(): void {
        let spawnPoint = this.getSpawn();

        this.teleport(spawnPoint.x, spawnPoint.y, true);
    }

    /**
     * Sends a private message to another player. If the hub is enabled, we use the API
     * to send a message to a player.
     * @param playerName The username of the player we are sending the message to.
     * @param message The string contents of the message.
     */

    public sendMessage(playerName: string, message: string): void {
        if (config.hubEnabled) {
            this.world.api.sendPrivateMessage(this, playerName, message);
            return;
        }

        if (!this.world.isOnline(playerName))
            return this.notify(`@aquamarine@${playerName}@crimson@ is not online.`, 'crimson');

        let otherPlayer = this.world.getPlayerByName(playerName),
            oFormattedName = Utils.formatName(playerName), // Formated username of the other player.
            formattedName = Utils.formatName(this.username); // Formatted username of current instance.

        otherPlayer.notify(`[From ${oFormattedName}]: ${message}`, 'aquamarine');
        this.notify(`[To ${formattedName}]: ${message}`, 'aquamarine');
    }

    /**
     * Function to be used for syncing up health,
     * mana, exp, and other variables.
     */

    public sync(): void {
        let armour = this.equipment.getArmour();

        // Update attack range each-time we sync.
        this.attackRange = this.isRanged() ? 7 : 1;

        // Synchronize health, mana and experience with the player.
        this.skills.sync();

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

    /**
     * Saves the player data to the database.
     */

    public save(): void {
        if (config.skipDatabase || this.isGuest || !this.ready) return;

        this.database.creator?.save(this);
    }

    /**
     * Serializes the player character to be sent to
     * nearby regions. This contains all the data
     * about the player that other players should
     * be able to see.
     * @param withEquipment Whether or not to include equipment batch data.
     * @param withExperience Whether or not to incluide experience data.
     * @param withMana Whether or not to include mana data.
     * @returns PlayerData containing all of the player info.
     */

    public override serialize(
        withEquipment = false,
        withExperience = false,
        withMana = false
    ): PlayerData {
        let data = super.serialize() as PlayerData;

        // Sprite key is the armour key.
        data.key = this.equipment.getArmour().key || 'clotharmor';
        data.name = Utils.formatName(this.username);
        data.rights = this.rights;
        data.level = this.skills.getCombatLevel();
        data.hitPoints = this.hitPoints.getHitPoints();
        data.maxHitPoints = this.hitPoints.getMaxHitPoints();
        data.attackRange = this.attackRange;
        data.movementSpeed = this.getMovementSpeed();

        if (this.inMinigame()) data.displayInfo = this.getDisplayInfo();

        // Include equipment only when necessary.
        if (withEquipment) data.equipments = this.equipment.serialize().equipments;

        if (withExperience) data.experience = this.getTotalExperience();

        if (withMana) {
            data.mana = this.mana.getMana();
            data.maxMana = this.mana.getMaxMana();
        }

        return data;
    }

    /**
     * Override for the superclass attack stats function. We instead
     * use the player's total equipment stats.
     * @return The total attack stats for the player.
     */

    public override getAttackStats(): Stats {
        return this.equipment.totalAttackStats;
    }

    /**
     * Override for the superclass defence stats function. We instead
     * use the player's total equipment stats.
     * @return The total defence stats for the player.
     */

    public override getDefenseStats(): Stats {
        return this.equipment.totalDefenseStats;
    }

    /**
     * Override for the superclass bonuses function. We use the total
     * equipment bonuses instead.
     * @returns The total equipment bonuses.
     */

    public override getBonuses(): Bonuses {
        return this.equipment.totalBonuses;
    }

    /**
     * @returns The player's current accuracy level from the skills controller.
     */

    public override getAccuracyLevel(): number {
        return this.skills.get(Modules.Skills.Accuracy).level;
    }

    /**
     * @returns The player's current strength level from the skills controller.
     */

    public override getStrengthLevel(): number {
        return this.skills.get(Modules.Skills.Strength).level;
    }

    /**
     * @returns The player's archery level from the skills controller.
     */

    public override getArcheryLevel(): number {
        return this.skills.get(Modules.Skills.Archery).level;
    }

    /**
     * Override for the damage absoprption modifier. Effects such as thick
     * skin lessent the max damage an entity is able to deal.
     * @returns Modifier number value between 0 and 1, closer to 0 the higher the damage reduction.
     */

    public override getDamageReduction(): number {
        let reduction = 1;

        // Thick skin increases damage reduction by 20%.
        if (this.thickSkin) reduction -= 0.2;

        return reduction;
    }

    /**
     * An override function for the player's attack rate since it
     * is dependent on their weapon at the moment. We may be doing
     * calculations from special equipments/effects in the future.
     * @returns The attack rate in milliseconds. See Modules.Defaults
     * for the default attack speed value.
     */

    public override getAttackRate(): number {
        // Dualists mark status effect boosts attack speed by 200 milliseconds.
        if (this.dualistsMark) return this.equipment.getWeapon().attackRate - 200;

        return this.equipment.getWeapon().attackRate;
    }

    /**
     * Callback for when the current character kills another character.
     * @param callback Contains the character object that was killed.
     */

    public onKill(callback: KillCallback): void {
        this.killCallback = callback;
    }

    /**
     * Callback for when the player talks to an NPC.
     * @param callback Contains the NPC object the player is talking to.
     */

    public onTalkToNPC(callback: NPCTalkCallback): void {
        this.npcTalkCallback = callback;
    }

    /**
     * Callback for when the player has entered through a door.
     * @param callback Contains information about the door player is entering through.
     */

    public onDoor(callback: DoorCallback): void {
        this.doorCallback = callback;
    }

    /**
     * Callback for when the cheat score has increased.
     */

    public onCheatScore(callback: () => void): void {
        this.cheatScoreCallback = callback;
    }

    /**
     * Callback whenever the entity's region changes.
     * @param callback Contains the new region the entity is in.
     */

    public onRegion(callback: RegionCallback): void {
        this.regionCallback = callback;
    }

    /**
     * Callback for when the regions the player just left from
     * are updated.
     * @param callback Contains the regions the player just left from.
     */

    public onRecentRegions(callback: RecentRegionsCallback): void {
        this.recentRegionsCallback = callback;
    }
}
