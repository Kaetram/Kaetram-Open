import Warp from './warp';
import Skills from './skills';
import Quests from './quests';
import Hit from '../combat/hit';
import Handler from './handler';
import NPC from '../../npc/npc';
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
import Minigame from '../../../minigames/minigame';
import Inventory from './containers/impl/inventory';
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

import { Modules, Opcodes } from '@kaetram/common/network';
import { PacketType } from '@kaetram/common/network/modules';
import { PlayerData } from '@kaetram/common/types/player';
import { PointerData } from '@kaetram/common/types/pointer';
import { ProcessedDoor } from '@kaetram/common/types/map';
import { ExperiencePacket } from '@kaetram/common/types/messages/outgoing';
import { EntityDisplayInfo } from '@kaetram/common/types/entity';
import { Team } from '@kaetram/common/types/minigame.d';
import {
    Music,
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
    Pointer,
    PVP,
    Spawn,
    Respawn
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

    public warp: Warp = new Warp(this);
    public quests: Quests = new Quests(this);
    public achievements: Achievements = new Achievements(this);
    public skills: Skills = new Skills(this);
    public equipment: Equipments = new Equipments(this);
    public mana: Mana = new Mana(Formulas.getMaxMana(this.level));
    public abilities: Abilities = new Abilities(this);

    public handler: Handler = new Handler(this);

    public ready = false; // indicates if login processed finished
    public isGuest = false;
    public canTalk = true;
    public noclip = false;
    public questsLoaded = false;
    public achievementsLoaded = false;

    // Player info
    public password = '';
    public email = '';
    public userAgent = '';

    public rights = 0;

    // Experience
    public experience = 0;
    private nextExperience = -1;
    private prevExperience = -1;

    // Ban and mute values
    public ban = 0; // epoch timestamp
    public mute = 0;

    // Player statistics
    public lastLogin = 0;
    public pvpKills = 0;
    public pvpDeaths = 0;

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
    public treesLoaded: { [instance: string]: Modules.TreeState } = {};
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
        this.experience = data.experience;
        this.ban = data.ban;
        this.mute = data.mute;
        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;
        this.userAgent = data.userAgent;

        this.setPoison(data.poison.type, data.poison.start);
        this.warp.setLastWarp(data.lastWarp);

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        this.hitPoints.updateHitPoints([data.hitPoints, Formulas.getMaxHitPoints(this.level)]);
        this.mana.updateMana([data.mana, Formulas.getMaxMana(this.level)]);

        // Being the loading process.
        this.loadEquipment();
        this.loadInventory();
        this.loadBank();
        this.loadQuests();
        this.loadAchievements();
        this.loadSkills();
        this.intro();

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

    /**
     * Destroys all the isntances in the player to aid the garbage collector.
     */

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
     * Adds experience to the player and handles level ups/popups/packets/etc.
     * @param exp The amount of experience we are adding to the player.
     */

    public addExperience(exp: number): void {
        this.experience += exp;

        // Prevent a null or excessive negative value from breaking the experience system.
        if (this.experience < 0) this.experience = 0;
        if (!this.experience) this.experience = 0;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);
        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        let data = {
            instance: this.instance,
            level: this.level
        } as ExperiencePacket;

        // Update hit points and send a popup to the player when a level up occurs.
        if (oldLevel !== this.level) {
            this.hitPoints.setMaxHitPoints(Formulas.getMaxHitPoints(this.level));
            this.heal(this.hitPoints.maxPoints, 'hitpoints');

            this.updateRegion();

            // Let the player know if they've unlocked a new warp.
            if (this.warp.unlockedWarp(this.level))
                this.popup(
                    'Level Up!',
                    `You have unlocked a new warp! You are now level ${this.level}!`,
                    '#ff6600'
                );
            else
                this.popup(
                    'Level Up!',
                    `Congratulations, you are now level ${this.level}!`,
                    '#ff6600'
                );
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
     * Override of the heal superclass function. Heals by a specified amount, and givne the
     * type, we will heal only the hitpoints or the mana with a special effect associated. If no
     * type is specified, then it proceeds to heal both hitpoints and mana.
     * @param amount The amount we are healing by.
     * @param type The type of heal we are performing ('passive' | 'hitpoints' | 'mana');
     */

    public override heal(amount: number, type: Modules.HealTypes = 'passive'): void {
        switch (type) {
            case 'passive':
                super.heal(amount);
                this.mana.increment(amount);
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

    public incrementCheatScore(amount = 1): void {
        if (this.combat.started) return;

        this.cheatScore += amount;

        this.cheatScoreCallback?.();
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
            tree = this.world.globals.getTrees().findTree(index);

        // No tree found, we stop here.
        if (!tree) return log.debug(`No tree found at ${instance}.`);

        // Start the cutting process.
        this.skills.getLumberjacking().cut(this, tree);
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
     * is out of bounds (generally happens when a new character is created and x/y values are
     * -1) we teleport them to their respective spawn point.
     * @param x The new grid x coordinate we are moving to.
     * @param y The new grd y coordinate we are moving to.
     * @param forced Forced parameters ignores current actions and forces the player to move.
     * @param skip Whether or not to skip sending a packet to nearby regions.
     */

    public override setPosition(x: number, y: number, forced = false, skip = false): void {
        if (this.dead) return;

        // Check against noclipping by verifying the collision w/ dynamic tiles.
        if (this.map.isColliding(x, y, this) && !this.noclip) {
            /**
             * If the old coordinate values are invalid or they may cause a loop
             * in the `teleport` function, we instead send the player to the spawn point.
             */
            if (
                (this.oldX === -1 && this.oldY === -1) ||
                (this.oldX === this.x && this.oldY === this.y)
            )
                return this.sendToSpawn();

            this.notify(`Noclip detected in your movement, please submit a bug report.`);
            this.teleport(this.oldX, this.oldY);
            return;
        }

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

    /**
     * @returns Finds and returns a minigame based on the player's minigame.
     */

    public getMinigame(): Minigame {
        return this.world.minigames.get(this.minigame);
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
        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);

        this.disconnectTimeout = setTimeout(() => this.timeout(), this.timeoutDuration);
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
        data.movementSpeed = this.getMovementSpeed();

        if (this.inMinigame()) data.displayInfo = this.getDisplayInfo();

        // Include equipment only when necessary.
        if (withEquipment) data.equipments = this.equipment.serialize().equipments;

        if (withExperience) {
            data.experience = this.experience;
            data.prevExperience = this.prevExperience;
            data.nextExperience = this.nextExperience;
        }

        return data;
    }

    /**
     * Override for obtaining the weapon power level.
     * @returns The player's currently equipped weapon's power level.
     */

    public override getWeaponLevel(): number {
        return this.equipment.getWeapon().power;
    }

    /**
     * Override for obtaining the armour power level.
     * @returns The player's currently equipped armour's power level.
     */

    public override getArmourLevel(): number {
        return this.equipment.getArmour().power;
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
