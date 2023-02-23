import Friends from './friends';
import Handler from './handler';
import Quests from './quests';
import Skills from './skills';
import Abilities from './abilities';
import Achievements from './achievements';
import Bank from './containers/impl/bank';
import Inventory from './containers/impl/inventory';
import Equipments from './equipments';
import Statistics from './statistics';
import Trade from './trade';

import Pet from '../pet/pet';
import Mana from '../points/mana';
import Character from '../character';
import Formulas from '../../../../info/formulas';
import Incoming from '../../../../controllers/incoming';

import {
    Camera,
    Chat,
    Effect,
    Heal,
    Movement,
    Music,
    Network,
    Notification,
    Overlay,
    Pointer,
    PVP,
    Rank,
    Respawn,
    Spawn,
    Sync,
    Teleport,
    Welcome
} from '@kaetram/server/src/network/packets';
import Utils from '@kaetram/common/util/utils';
import log from '@kaetram/common/util/log';
import { PacketType } from '@kaetram/common/network/modules';
import { Opcodes, Modules } from '@kaetram/common/network';
import config from '@kaetram/common/config';
import { Team } from '@kaetram/common/api/minigame';

import type NPC from '../../npc/npc';
import type Skill from './skill/skill';
import type Map from '../../../map/map';
import type World from '../../../world';
import type Item from '../../objects/item';
import type Area from '../../../map/areas/area';
import type Regions from '../../../map/regions';
import type Connection from '../../../../network/connection';
import type Resource from '../../../globals/impl/resource';
import type Minigame from '../../../minigames/minigame';
import type { EntityDisplayInfo } from '@kaetram/common/types/entity';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type { ProcessedDoor } from '@kaetram/common/types/map';
import type { PlayerData } from '@kaetram/common/types/player';
import type { PointerData } from '@kaetram/common/types/pointer';
import type Entities from '@kaetram/server/src/controllers/entities';
import type Packet from '@kaetram/server/src/network/packet';
import type { PlayerInfo } from '@kaetram/common/database/mongodb/creator';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';

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
    public friends: Friends = new Friends(this);
    public trade: Trade = new Trade(this);

    public handler: Handler = new Handler(this);

    public ready = false; // indicates if login processed finished
    public isGuest = false;
    public canTalk = true;
    public noclip = false;
    public jailed = false;
    public questsLoaded = false;
    public achievementsLoaded = false;
    public invalidMovement = 0;
    public overrideMovementSpeed = -1;

    // Special status
    public running = false;
    public hotSauce = false;
    public dualistsMark = false;
    public thickSkin = false;
    public snowPotion = false;

    // Player info
    public password = '';
    public email = '';
    public userAgent = '';

    public rank: Modules.Ranks = Modules.Ranks.None;

    // Stores the last attack style for each type of weapon.
    public lastStyles: { [type: string]: Modules.AttackStyle } = {};

    // Pet information
    public pet!: Pet;

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
    private lastEdible = 0;

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
    public overlayArea: Area | undefined;

    private snowPotionTimeout: NodeJS.Timeout | null = null;

    public killCallback?: KillCallback;
    public npcTalkCallback?: NPCTalkCallback;
    public doorCallback?: DoorCallback;
    public regionCallback?: RegionCallback;
    public recentRegionsCallback?: RecentRegionsCallback;

    private cheatScoreCallback?: () => void;

    public constructor(world: World, public database: MongoDB, public connection: Connection) {
        super(connection.instance, world, '', -1, -1);
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
        this.rank = data.rank || Modules.Ranks.None;
        this.ban = data.ban;
        this.mute = data.mute;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;
        this.userAgent = data.userAgent;
        this.regionsLoaded = data.regionsLoaded || [];

        this.setPoison(data.poison.type, Date.now() - data.poison.remaining);
        this.setLastWarp(data.lastWarp);

        this.hitPoints.updateHitPoints(data.hitPoints);
        this.mana.updateMana(data.mana);

        this.friends.load(data.friends);

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
            if (!this.ready) this.connection.reject('error', true);
        }, 10_000);

        this.setPosition(this.x, this.y);

        this.entities.addPlayer(this);

        this.send(new Welcome(this.serialize(false, true, true)));
    }

    /**
     * Handles the player respawning in the world.
     */

    public respawn(): void {
        // Cannot respawn if the player is not marked as dead.
        if (!this.dead) return log.warning(`Invalid respawn request.`);

        this.dead = false;

        let spawn = this.getSpawn();

        this.teleport(spawn.x, spawn.y);

        // Signal to other players that the player is spawning.
        this.sendToRegions(new Spawn(this), true);

        this.send(new Respawn(this));

        this.hitPoints.reset();
        this.mana.reset();

        this.sync();
    }

    /**
     * Sends a welcome notification when the player logs in the game. If the player is new
     * then we will send a slightly different welcome message. If there are other players
     * online, we will also send a notification to the player with the player count.
     */

    public welcome(): void {
        if (this.isNew()) return this.notify(`Welcome to ${config.name}!`);

        this.notify(`Welcome back to ${config.name}!`);

        let population = this.world.getPopulation();

        if (population > 1)
            this.notify(`There are currently ${population} players online.`, '', '', true);
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
            case 'passive': {
                if (!this.mana.isFull()) this.mana.increment(amount);

                // Scale the heal rate by the maximum hitpoints.
                amount += Math.floor(this.hitPoints.getMaxHitPoints() * 0.005);

                super.heal(amount);

                break;
            }

            case 'hitpoints':
            case 'mana': {
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
     * Synchronizes the player's client entity positions and server entities in a region.
     */

    public updateEntityPositions(): void {
        this.regions.sendEntityPositions(this);
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
     * @param timestamp Timestamp at which the packet was originally sent.
     */

    private verifyMovement(x: number, y: number, timestamp: number): boolean {
        let now = Date.now(),
            stepDiff = now - this.lastStep + 7, // +7ms for margin of error.
            regionDiff = now - this.lastRegionChange,
            timestampDiff = now - timestamp;

        // High latency may cause packets to be sent in a delayed manner, causing two to be sent/received at once.
        if (timestampDiff > 35 && stepDiff < 35) return false;

        // Firstly ensure that the last step was behaving normally.
        if (stepDiff >= this.getMovementSpeed()) return false;

        // A region change may trigger a movement anomaly, so we ignore movement for 1.5 seconds of a region change.
        if (regionDiff < 1500) return false;

        // Check if the player is currently going into a door.
        if (this.map.isDoor(x, y)) return false;

        return true;
    }

    /**
     * Handles the action of attacking a target. We receive a packet from the client
     * with the instance of the target and perform checks prior to initiating combat.
     * @param instance The instance of the target we are attacking.
     */

    public handleTargetAttack(instance: string): void {
        let target = this.entities.get(instance);

        // Ignore if the target is not a character that can actually be attacked.
        if (!target?.isCharacter() || target.dead) return;

        // Ensure that the player can actually attack the target.
        if (!this.canAttack(target)) return;

        // Clear the cheat score
        this.cheatScore = 0;

        // Start combat with the target.
        this.combat.attack(target);
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
        fromContainer: Modules.ContainerType,
        fromIndex: number,
        toContainer: Modules.ContainerType,
        toIndex?: number
    ): void {
        let item: Item;

        switch (type) {
            case Modules.ContainerType.Inventory: {
                item = this.inventory.getItem(this.inventory.get(fromIndex));

                if (!item) return;

                // Checks if the player can eat and uses the item's plugin to handle the action.
                if (item.edible && this.canEat() && item.plugin?.onUse(this)) {
                    this.inventory.remove(fromIndex, 1);
                    this.lastEdible = Date.now();
                }

                if (item.isEquippable() && item.canEquip(this)) {
                    this.inventory.remove(fromIndex, item.count);
                    this.equipment.equip(item);
                }

                break;
            }

            case Modules.ContainerType.Bank: {
                let from =
                        fromContainer === Modules.ContainerType.Bank ? this.bank : this.inventory,
                    to = toContainer === Modules.ContainerType.Bank ? this.bank : this.inventory;

                from.move(fromIndex, to, toIndex);

                break;
            }
        }
    }

    /**
     * Handles the removing of an item from a container. This can be an inventory or a bank.
     * In the case of the inventory, we check that the player isn't dropping an item in front
     * of a door.
     * @param type The type of container we are working with.
     * @param index The index at which we are removing the item.
     * @param count The amount of items we are removing.
     */

    public handleContainerRemove(type: Modules.ContainerType, index: number, count: number): void {
        if (count < 1 || isNaN(count)) return this.notify('You have entered an invalid amount.');

        let container = type === Modules.ContainerType.Inventory ? this.inventory : this.bank;

        if (type === Modules.ContainerType.Inventory && this.map.isDoor(this.x, this.y))
            return this.notify('You cannot drop items while standing in a door.');

        container.remove(index, count, true);
    }

    /**
     * Handles the swap action of a container. This is when we want to move items around.
     * @param type The type of container we are working with.
     * @param fromIndex The index at which we are swapping the item.
     * @param toIndex The index at which we are swapping the item with.
     */

    public handleContainerSwap(
        type: Modules.ContainerType,
        fromIndex: number,
        toIndex: number
    ): void {
        if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex < 0 || toIndex < 0)
            return log.warning(
                `[${this.username}] Invalid container swap [${fromIndex}, ${toIndex}}]`
            );

        let container = type === Modules.ContainerType.Inventory ? this.inventory : this.bank;

        container.swap(fromIndex, container, toIndex);
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

        if (tree) return this.skills.getLumberjacking().cut(this, tree);

        // If we don't find a tree then we try finding a rock.

        let rock = this.world.globals.getRocks().findResource(index);

        if (rock) return this.skills.getMining().mine(this, rock);
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
     * Handles the experience gained from hitting a mob. Experience is determined by the attack
     * style the player currently has selected. Weapons have varying attack styles and the player
     * selects them depending on the skill they wish to train.
     * @param damage The amount of damage the player dealt.
     */

    public handleExperience(damage: number): void {
        // Ignore invalid damage values.
        if (damage < 1) return;

        let experience = damage * Modules.Constants.EXPERIENCE_PER_HIT,
            weapon = this.equipment.getWeapon();

        /**
         * If the player doesn't have enough mana then we halve the experience gain.
         */

        if (this.hasManaForAttack()) experience = Math.floor(experience / 2);

        /**
         * Since there are four combat skills, we evenly distribute the experience between them.
         * Depending on the attack style, we add a different amount of experience to each skill.
         */

        this.skills.get(Modules.Skills.Health).addExperience(Math.ceil(experience / 4), false);

        // Archery directs experience to the archery skill.
        if (this.isArcher())
            return this.skills
                .get(Modules.Skills.Archery)
                .addExperience(Math.ceil(experience * 0.75), false);

        // Magic directs experience to the magic skill.
        if (this.isMagic())
            return this.skills
                .get(Modules.Skills.Magic)
                .addExperience(Math.ceil(experience * 0.75), false);

        /**
         * The rest of the experiences are distributed according to the attack style selected.
         */

        switch (weapon.attackStyle) {
            // Stab gives the remaining accuracy experience.
            case Modules.AttackStyle.Stab: {
                this.skills
                    .get(Modules.Skills.Accuracy)
                    .addExperience(Math.ceil(experience * 0.75), false);
                break;
            }

            // Slash gives the remaining strength experience.
            case Modules.AttackStyle.Slash: {
                this.skills
                    .get(Modules.Skills.Strength)
                    .addExperience(Math.ceil(experience * 0.75), false);
                break;
            }

            // Defense gives the remaining defence experience.
            case Modules.AttackStyle.Defensive: {
                this.skills
                    .get(Modules.Skills.Defense)
                    .addExperience(Math.ceil(experience * 0.75), false);
                break;
            }

            // Crush gives accuracy + strength experience.
            case Modules.AttackStyle.Crush: {
                this.skills
                    .get(Modules.Skills.Accuracy)
                    .addExperience(Math.ceil(experience * 0.375), false);
                this.skills
                    .get(Modules.Skills.Strength)
                    .addExperience(Math.ceil(experience * 0.375), false);
                break;
            }

            // Shared experience evenly distributes the experience between all skills.
            case Modules.AttackStyle.Shared: {
                this.skills
                    .get(Modules.Skills.Accuracy)
                    .addExperience(Math.ceil(experience * 0.25), false);
                this.skills
                    .get(Modules.Skills.Strength)
                    .addExperience(Math.ceil(experience * 0.25), false);
                this.skills
                    .get(Modules.Skills.Defense)
                    .addExperience(Math.ceil(experience * 0.25), false);
                break;
            }

            // Axe hacking attack style gives strength + defence experience.
            case Modules.AttackStyle.Hack: {
                this.skills
                    .get(Modules.Skills.Strength)
                    .addExperience(Math.ceil(experience * 0.375), false);
                this.skills
                    .get(Modules.Skills.Defense)
                    .addExperience(Math.ceil(experience * 0.375), false);
                break;
            }

            // Axe chop gives accuracy + defence experience.
            case Modules.AttackStyle.Chop: {
                this.skills
                    .get(Modules.Skills.Accuracy)
                    .addExperience(Math.floor(experience * 0.375), false);
                this.skills
                    .get(Modules.Skills.Defense)
                    .addExperience(Math.floor(experience * 0.375), false);
                break;
            }

            // Default (unarmed)
            default: {
                this.skills
                    .get(Modules.Skills.Strength)
                    .addExperience(Math.ceil(experience * 0.75), false);
                break;
            }
        }
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

        let diffX = Math.abs(this.x - x),
            diffY = Math.abs(this.y - y);

        if (diffX > 1 || diffY > 1) {
            this.notify(`No-clip detected at ${this.x}(${x}), ${this.y}(${y}).`);
            this.invalidMovement++;

            log.bug(`${this.username} has no-clipped from ${this.x}(${x}), ${this.y}(${y}).`);
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
        if (speed !== this.getMovementSpeed())
            this.incrementCheatScore(`${this.username} Received incorrect movement speed.`);

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
     * @param timestamp The time when the packet was sent (UNIX timestamp).
     */

    public handleMovementStep(x: number, y: number, timestamp = Date.now()): void {
        if (this.stunned || this.isInvalidMovement()) return;

        if (this.verifyMovement(x, y, timestamp))
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
        if (entity?.isItem()) {
            // Prevent picking up dropped items that belong to other players.
            if (!entity.isOwner(this.username))
                return this.notify(
                    `This item can only be picked up by ${Utils.formatName(entity.owner)}.`
                );

            this.inventory.add(entity);
        }

        // Update the player's position.
        if (!this.isInvalidMovement()) this.setPosition(x, y);

        // Handle doors when the player stops on one.
        if (this.map.isDoor(x, y) && (!target || entity?.isPlayer())) {
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
                case 'lockX': {
                    this.send(new Camera(Opcodes.Camera.LockX));
                    break;
                }

                case 'lockY': {
                    this.send(new Camera(Opcodes.Camera.LockY));
                    break;
                }

                case 'player': {
                    this.send(new Camera(Opcodes.Camera.Player));
                    break;
                }
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
        let speed =
                this.overrideMovementSpeed === -1 // Whether to use the movement speed override.
                    ? Modules.Defaults.MOVEMENT_SPEED
                    : this.overrideMovementSpeed, // Start with default.
            armour = this.equipment.getArmour(),
            boots = this.equipment.getBoots();

        // Update the movement speed with that of the armour currently wielded.
        if (armour.hasMovementModifier()) speed = Math.floor(speed * armour.movementModifier);

        // Check the boots for movement modifiers
        if (boots.hasMovementModifier()) speed = Math.floor(speed * boots.movementModifier);

        // Apply a 10% speed boost if the player running effect is present.
        if (this.running) speed = Math.floor(speed * 0.9);

        // Apply a 20% speed boost if the player is using the hot sauce.
        if (this.hotSauce) speed = Math.floor(speed * 0.8);

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

    public setRunning(running: boolean, hotSauce = false): void {
        log.debug(`${this.username} is running: ${running}`);

        // Update the hot sauce status.
        this.hotSauce = hotSauce;
        this.running = running;

        this.sendToRegions(
            new Effect(Opcodes.Effect.Speed, {
                instance: this.instance,
                movementSpeed: this.getMovementSpeed()
            })
        );
    }

    /**
     * Applies a visual effect onto a player. This can also be used to remove
     * an effect by passing in the `Opcodes.Effect.None` opcode.
     * @param opcode The opcode of the effect we want to apply.
     */

    public setEffect(opcode: Opcodes.Effect): void {
        this.sendToRegions(new Effect(opcode, { instance: this.instance }));
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
     * Sets the cold resistance snow potion status and creates a (or updates an existing) timeout.
     * The effect is removed after a set amount of time specified in the game `Constants`.
     */

    public setSnowPotionEffect(): void {
        // If we already have an active effect then we restart the timer.
        if (this.snowPotion) {
            clearTimeout(this.snowPotionTimeout!);
            this.snowPotionTimeout = null;
        }

        this.snowPotion = true;

        // Remove the freezing special effect if the potion is active.
        this.setEffect(Opcodes.Effect.None);

        this.notify(
            `You are now immune to freezing effects for ${
                Modules.Constants.SNOW_POTION_DURATION / 1000
            } seconds.`
        );

        // Set a timeout to remove the effect.
        this.snowPotionTimeout = setTimeout(() => {
            // If the player is still in a freezing area, reapply the effect
            if (this.overlayArea && this.overlayArea.type === 'damage')
                this.setEffect(Opcodes.Effect.Freeze);

            this.snowPotion = false;
            this.snowPotionTimeout = null;

            this.notify('Your immunity to freezing effects has worn off.');
        }, Modules.Constants.SNOW_POTION_DURATION);
    }

    /**
     * Updates the player's rank and sends a packet to the client.
     * @param rank The new rank of the player, defaults to `None`.
     */

    public setRank(rank: Modules.Ranks = Modules.Ranks.None): void {
        this.rank = rank;

        this.send(new Rank(rank));
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
     * Creates an instance of a pet based on the key provided. The pet then
     * starts following the player.
     * @param key The key of t he pet we want to create.
     */

    public setPet(key: string): void {
        if (this.pet) return this.notify(`You already have a pet!`);

        // Create a new pet instance based on the key.
        this.pet = new Pet(this, key, this.x, this.y);
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
     * @returns Whether or not the player has enough mana to attack.
     */

    public hasManaForAttack(): boolean {
        return this.mana.getMana() >= this.equipment.getWeapon().manaCost;
    }

    /**
     * @returns Whether or not the player has enough arrows to shoot the bow.
     */

    public override hasArrows(): boolean {
        if (!this.quests.isTutorialFinished()) return true;

        return this.equipment.getArrows().count > 0;
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
     * Sends a ping request to the client. This is used to calculate the latency.
     */

    public ping(): void {
        this.pingTime = Date.now();

        this.send(new Network(Opcodes.Network.Ping));
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
     * @returns Whether the player has the cheater rank.
     */

    public isCheater(): boolean {
        return this.rank === Modules.Ranks.Cheater;
    }

    /**
     * @returns Whether the player's rank is artist.
     */

    public isArtist(): boolean {
        return this.rank === Modules.Ranks.Artist;
    }

    /**
     * @returns Whether or not the player's rank is a moderator.
     */

    public isMod(): boolean {
        return this.rank === Modules.Ranks.Moderator;
    }

    /**
     * @returns Whether or not the player's rank is an administrator.
     */

    public isAdmin(): boolean {
        return this.rank === Modules.Ranks.Admin || config.skipDatabase;
    }

    /**
     * Accounts younger than 1 minute are considered new accounts.
     * @returns Whether the account's creation date is within the last minute.
     */

    public isNew(): boolean {
        return Date.now() - this.statistics.creationTime < 60_000;
    }

    /**
     * @returns Whether or not the player's invalid movement count is greater than the threshold.
     */

    private isInvalidMovement(): boolean {
        return this.invalidMovement >= Modules.Constants.INVALID_MOVEMENT_THRESHOLD;
    }

    /**
     * @returns Whether or not the player is using archery-based weapons.
     */

    public isArcher(): boolean {
        return this.equipment.getWeapon().isArcher();
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
     * @returns Whether or not the player uses magic-based weapons.
     */

    public override isMagic(): boolean {
        return this.equipment.getWeapon().isMagic();
    }

    /**
     * @returns Whether or not the time delta is greater than the cooldown since last edible.
     */

    private canEat(): boolean {
        return Date.now() - this.lastEdible > Modules.Constants.EDIBLE_COOLDOWN;
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
     * Entrypoint for sending a private message across servers. This function is bypassed
     * when we receive a message from another server and we use `sendMessage` instead.
     * @param playerName The username of the player we are sending the message to.
     * @param message The string contents of the message.
     */

    public sendPrivateMessage(playerName: string, message: string): void {
        if (config.hubEnabled) {
            this.world.api.sendPrivateMessage(this, playerName, message);
            return;
        }

        if (!this.world.isOnline(playerName))
            return this.notify(`@aquamarine@${playerName}@crimson@ is not online.`, 'crimson');

        this.sendMessage(playerName, message);
    }

    /**
     * Sends the message to the player specified in the current server.
     * @param playerName The username of the player we are sending the message to.
     * @param message The string contents of the message.
     */

    public sendMessage(playerName: string, message: string, source = ''): void {
        let otherPlayer = this.world.getPlayerByName(playerName),
            oFormattedName = Utils.formatName(playerName), // Formated username of the player receiving the message.
            formattedName = Utils.formatName(source || this.username); // Formatted username of the source

        if (source) this.notify(message, 'aquamarine', `[From ${formattedName}]`, true);
        else otherPlayer.notify(message, 'aquamarine', `[From ${formattedName}]`, true);

        if (!source) this.notify(message, 'aquamarine', `[To ${oFormattedName}]`, true);
    }

    /**
     * Function to be used for syncing up health,
     * mana, exp, and other variables.
     */

    public sync(): void {
        // Update attack range each-time we sync.
        this.attackRange = this.equipment.getWeapon().attackRange;

        this.getMovementSpeed();

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
        if (!this.canTalk) return this.notify('You cannot talk at this time.', 'crimson');

        log.debug(`[${this.username}] ${message}`);

        let name = Utils.formatName(this.username);

        if (this.rank !== Modules.Ranks.None) {
            name = `[${Modules.RankTitles[this.rank]}] ${name}`;
            colour = global ? '' : Modules.RankColours[this.rank];
        }

        let source = `${global ? '[Global]' : ''} ${name}`;

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

        log.chat(`${this.username}: ${message}`);

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
     * @param bypass Allows sending notifications without the timeout.
     */

    public notify(message: string, colour = '', source = '', bypass = false): void {
        if (!message) return;

        // Prevent notify spams
        if (!bypass && Date.now() - this.lastNotify < 250) return;

        message = Utils.parseMessage(message);

        this.send(
            new Notification(Opcodes.Notification.Text, {
                message,
                colour,
                source
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
        data.rank = this.rank;
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
        // We use magic level for accuracy when the player is using a magic weapon.
        if (this.isMagic()) return this.skills.get(Modules.Skills.Magic).level;
        if (this.isArcher()) return this.skills.get(Modules.Skills.Archery).level;

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
     * @returns The player's defense level from the skills controller.
     */

    public override getDefenseLevel(): number {
        return this.skills.get(Modules.Skills.Defense).level;
    }

    /**
     * @returns The player's magic level from the skills controller.
     */

    private getMagicLevel(): number {
        return this.skills.get(Modules.Skills.Magic).level;
    }

    /**
     * @param weaponType The weapon type we are checking for.
     * @returns The player's last attack style. Will return undefined and then a default
     * value will be used.
     */

    public getLastAttackStyle(weaponType: string): Modules.AttackStyle {
        return this.lastStyles[weaponType];
    }

    /**
     * Override for the damage bonus getter. Player also considers the magic
     * bonus when using a magic weapons.
     * @returns The bonus that the player will be using for max damage calculation
     * given their current weapon damage type.
     */

    public override getDamageBonus(): number {
        // Handle magic bonuses
        if (this.isMagic()) {
            // If the player does not have enough mana for the attack decrease the damage.
            if (!this.hasManaForAttack()) return -3;

            // Return the total magic bonus.
            return this.getBonuses().magic;
        }

        // Return the archery bonus if using ranged weapons.
        if (this.isArcher()) return this.getBonuses().archery;

        return this.getBonuses().strength;
    }

    /**
     * Override for the player's primary skill used in damage calculation.
     * @returns The damage level of the primary skill given the player's
     * current weapon damage type.
     */

    public override getSkillDamageLevel(): number {
        if (this.isMagic()) return this.getMagicLevel();
        if (this.isArcher()) return this.getArcheryLevel();

        return this.getStrengthLevel();
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

        // Attack style defensive boosts defence by 10%.
        if (this.getAttackStyle() === Modules.AttackStyle.Defensive) reduction -= 0.1;

        // Shared attack style defensive boosts defence by 4%.
        if (this.getAttackStyle() === Modules.AttackStyle.Shared) reduction -= 0.04;

        return reduction;
    }

    /**
     * Gets the player's currently selected attack style for the weapon
     * they are wielding. We use this to determine combat bonuses and whatnot.
     * @returns The attack style the weapon currently has selected.
     */

    public override getAttackStyle(): Modules.AttackStyle {
        return this.equipment.getWeapon().attackStyle;
    }

    /**
     * @returns Returns the projectile sprite name for the character.
     */

    public override getProjectileName(): string {
        // Use `Character` default `projectileName` in tutorial.
        if (!this.quests.isTutorialFinished()) return this.projectileName;

        // Use the projectile name of the arrows if the player is using ranged weapons.
        if (this.isArcher()) return this.equipment.getArrows().projectileName;

        return this.equipment.getWeapon().projectileName;
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
