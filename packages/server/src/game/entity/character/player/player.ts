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
import Incoming from './incoming';

import Mana from '../points/mana';
import Character from '../character';
import Item from '../../objects/item';
import Formulas from '../../../../info/formulas';

import Utils from '@kaetram/common/util/utils';
import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import { PacketType } from '@kaetram/common/network/modules';
import { Opcodes, Modules } from '@kaetram/common/network';
import { Team } from '@kaetram/common/api/minigame';
import {
    CameraPacket,
    ChatPacket,
    GuildPacket,
    HealPacket,
    MovementPacket,
    MusicPacket,
    NetworkPacket,
    NotificationPacket,
    OverlayPacket,
    PlayerPacket,
    PointerPacket,
    PVPPacket,
    RankPacket,
    RespawnPacket,
    SpawnPacket,
    SyncPacket,
    TeleportPacket,
    WelcomePacket
} from '@kaetram/common/network/impl';

import type Pet from '../pet/pet';
import type NPC from '../../npc/npc';
import type Skill from './skill/skill';
import type Map from '../../../map/map';
import type World from '../../../world';
import type Area from '../../../map/areas/area';
import type Regions from '../../../map/regions';
import type Connection from '../../../../network/connection';
import type Minigame from '../../../minigames/minigame';
import type Entities from '../../../../controllers/entities';
import type Packet from '@kaetram/common/network/packet';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';
import type { EntityDisplayInfo } from '@kaetram/common/types/entity';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type { ProcessedDoor } from '@kaetram/common/types/map';
import type { PlayerData } from '@kaetram/common/network/impl/player';
import type { PointerData } from '@kaetram/common/network/impl/pointer';
import type { PlayerInfo } from '@kaetram/common/database/mongodb/creator';

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
    public map: Map;
    private regions: Regions;
    private entities: Entities;

    public incoming: Incoming;

    public bank: Bank = new Bank(Modules.Constants.BANK_SIZE);
    public inventory: Inventory = new Inventory(Modules.Constants.INVENTORY_SIZE);

    public abilities: Abilities;
    public quests: Quests;
    public achievements: Achievements;
    public skills: Skills;
    public equipment: Equipments;
    public mana: Mana;
    public statistics: Statistics;
    public friends: Friends;
    public trade: Trade;

    public handler: Handler;

    public ready = false; // indicates if login processed finished
    public authenticated = false;
    public isGuest = false;
    public canTalk = true;
    public noclip = false;
    public questsLoaded = false;
    public invalidateMovement = false;
    public achievementsLoaded = false;
    public displayedManaWarning = false;
    public bypassAntiCheat = false;
    public pickingUpPet = false; // Used to doubly ensure the player is not spamming the pickup button.
    public overrideMovementSpeed = -1;

    // Player info
    public username = '';
    public password = '';
    public email = '';
    public userAgent = '';
    public guild = '';

    public rank: Modules.Ranks = Modules.Ranks.None;

    // Stores the last attack style for each type of weapon.
    public lastStyles: { [type: string]: Modules.AttackStyle } = {};

    // Pet information
    public pet: Pet | undefined;

    // Warps
    public lastWarp = 0;

    // Moderation variables
    public ban = 0; // epoch timestamp
    public mute = 0;
    public jail = 0;

    // Player miscellaneous data
    public mapVersion = -1;
    public cheatScore = 0;
    public movementStart = 0;
    public pingTime = 0;

    public lastCraft = 0;
    public lastGlobalChat = 0;
    private lastNotify = 0;
    private lastEdible = 0;

    private currentSong: string | undefined;

    // Minigame variables
    public minigameArea: Area | undefined = undefined;
    public coursingScore = 0; // Probably will have a dictionary for this data when we have more minigames.
    public coursingTarget = ''; // The player we are chasing.

    // Region data
    public regionsLoaded: number[] = [];
    public lightsLoaded: number[] = [];

    // NPC talking
    public npcTalk = '';
    public talkIndex = 0;

    // Anti-cheat container
    public canAccessContainer = false;
    public activeCraftingInterface = -1; // The skill ID
    public activeLootBag = ''; // The instance of the loot bag currently open

    // Minigame status of the player.
    public minigame?: Opcodes.Minigame;
    public team?: Team;

    // Currently open store of the player.
    public storeOpen = '';

    private cameraArea: Area | undefined;
    public overlayArea: Area | undefined;

    public readyTimeout!: NodeJS.Timeout | null;

    public killCallback?: KillCallback;
    public npcTalkCallback?: NPCTalkCallback;
    public doorCallback?: DoorCallback;
    public regionCallback?: RegionCallback;
    public recentRegionsCallback?: RecentRegionsCallback;

    private cheatScoreCallback?: () => void;

    public constructor(
        world: World,
        public database: MongoDB,
        public connection: Connection
    ) {
        super(connection.instance, world, '', -1, -1);

        this.connection.onClose(this.handleClose.bind(this));

        this.map = this.world.map;
        this.regions = this.world.map.regions;
        this.entities = this.world.entities;

        this.incoming = new Incoming(this);
        this.abilities = new Abilities(this);
        this.quests = new Quests(this);
        this.achievements = new Achievements(this);
        this.skills = new Skills(this);
        this.equipment = new Equipments(this);
        this.mana = new Mana(Formulas.getMaxMana(this.level));
        this.statistics = new Statistics(this);
        this.friends = new Friends(this);
        this.trade = new Trade(this);
        this.handler = new Handler(this);
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

    public async load(data: PlayerInfo): Promise<void> {
        // The player's ban timestamp is in the future, so they are still banned.
        if (data.ban > Date.now()) return this.connection.reject('banned');

        // Store coords for when we're done loading.
        this.x = data.x;
        this.y = data.y;
        this.name = data.username;
        this.guild = data.guild;
        this.rank = data.rank || Modules.Ranks.None;
        this.ban = data.ban;
        this.jail = data.jail;
        this.mute = data.mute;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;
        this.userAgent = data.userAgent;
        this.regionsLoaded = data.regionsLoaded || [];
        this.lastGlobalChat = data.lastGlobalChat || 0;

        this.setPoison(data.poison.type, Date.now() - data.poison.remaining);
        this.setLastWarp(data.lastWarp);

        this.hitPoints.updateHitPoints(data.hitPoints);
        this.mana.updateMana(data.mana);

        this.friends.load(data.friends);

        this.loadSkills();
        this.loadEquipment();
        this.loadInventory();
        this.loadBank();
        this.loadStatistics();
        this.loadAbilities();

        // Synchronize login with the hub's server list.
        this.world.client.send(
            new PlayerPacket(Opcodes.Player.Login, { username: this.username, guild: this.guild })
        );

        // Quests and achievements have to be loaded prior to introducing the player.
        await this.loadQuests();
        await this.loadAchievements();

        this.intro();

        // Connect the player to their guild if they are in one.
        if (this.guild) this.world.guilds.connect(this, this.guild);

        // Spawn the pet if the player has one.
        if (data.pet) this.setPet(data.pet);

        // Apply the status effects from the database.
        this.status.load(data.effects);
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

    public async loadQuests(): Promise<void> {
        this.quests.load(await this.database.loader?.loadQuests(this));
    }

    /**
     * Loads the achievement data from the database.
     */

    public async loadAchievements(): Promise<void> {
        this.achievements.load(await this.database.loader?.loadAchievements(this));
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
     * Handles closing a connection. We have to take into consideration
     * that a connection may have closed prior to all the controllers
     * being initialized, so we have to check for that.
     */

    public handleClose(): void {
        // Stops the character-based intervals
        this.stop();

        // Stops intervals in handler if it has been initialized
        this.handler?.clear();

        // If authenticated send information to the hub and Discord.
        if (this.authenticated) {
            this.world.discord.sendMessage(this.username, 'has logged out!');

            this.world.client.send(
                new PlayerPacket(Opcodes.Player.Logout, {
                    username: this.username,
                    guild: this.guild
                })
            );
        }

        // Send data to the minigames if present...
        if (this.inMinigame()) this.getMinigame()?.disconnect(this);

        // Stop all trading.
        this.trade?.close();

        // Stop combat.
        this.combat?.stop();

        // Stop skilling
        this.skills?.stop();

        // Clear the player from areas
        this.clearAreas();
        this.minigameArea?.exitCallback?.(this);

        // Signal to other attacking entities that we have left.
        this.world.cleanCombat(this);

        // Synchronize friends list and guilds with the logout status
        this.world.syncFriendsList(this.username, true);
        this.world.syncGuildMembers(this.guild, this.username, true);

        // Save the player if authenticated and ready.
        if (this.authenticated && this.ready) this.save();

        // Remove the player from the region.
        this.entities.removePlayer(this);

        // Despawn the pet from the world.
        if (this.hasPet()) this.world.entities.removePet(this.pet!);
    }

    /**
     * Handle the actual player login. Check if the user is banned,
     * update hitPoints and mana, and send the player information
     * to the client.
     */

    public intro(): void {
        // Reset hitpoints if they are unitialized.
        if (this.hitPoints.getHitPoints() < 0)
            this.hitPoints.setHitPoints(this.hitPoints.getMaxHitPoints());

        // Reset mana if it is unitialized.
        if (this.mana.getMana() < 0) this.mana.setMana(this.mana.getMaxMana());

        // Update the player's timeout based on their rank.
        if (this.rank !== Modules.Ranks.None)
            this.connection.updateTimeout(this.getTimeoutByRank());

        // Timeout the player if the ready packet is not received within 10 seconds.
        this.readyTimeout = setTimeout(() => {
            if (!this.ready || this.connection.closed) this.connection.reject('error');
        }, 7000);

        this.setPosition(this.x, this.y);

        this.entities.addPlayer(this);

        this.send(new WelcomePacket(this.serialize(false, true, true)));
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
        this.sendToRegions(new SpawnPacket(this), true);

        this.send(new RespawnPacket(this));

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
        if (this.isNew()) {
            this.save();

            return this.notify(`misc:WELCOME;name=${config.name}`);
        }

        this.notify(`misc:WELCOME_BACK;name=${config.name}`);

        let population = this.world.getPopulation(),
            { activeEvent } = this.world.events;

        if (population > 1)
            this.notify(`misc:PEOPLE_ONLINE;population=${population}`, '', '', true);

        if (activeEvent)
            this.notify(`The ${activeEvent} event is currently active!`, 'crimsonred', '', true);

        if (this.isJailed())
            this.notify(`misc:JAILED;duration=${this.getJailDuration()}`, 'crimsonred', '', true);
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
                // Increment mana by 1% of the max mana.
                if (!this.mana.isFull())
                    this.mana.increment(Math.floor(this.mana.getMaxMana() * 0.01));

                // Base healing amount by 0.5% of the max hitpoints.
                let healAmount = this.hitPoints.getMaxHitPoints() * 0.005;

                // Use the eating level to increase the healing amount.
                healAmount += this.skills.get(Modules.Skills.Eating).level / 10;

                super.heal(Math.ceil(healAmount));

                break;
            }

            case 'hitpoints':
            case 'mana': {
                if (this.isCheater()) this.notify(`Healing is disabled for cheaters, sorry.`);

                if (type === 'hitpoints') this.hitPoints.increment(amount);
                else if (type === 'mana') this.mana.increment(amount);

                this.sendToRegions(
                    new HealPacket({
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
     * Loitering occurs when the player is in a region for over 90 seconds. This will
     * trigger the loitering skill which will give the player a small amount of experience
     * every 20 seconds. The experience received is proportional to the player's loitering skill.
     * In the future this experience will correlate to the amount of actions performed in the
     * 20 second timeframe.
     */

    public loiter(): void {
        // Skip if we have not reached the loitering threshold for the region.
        if (!this.quests.isTutorialFinished() || !this.isLoiteringThreshold()) return;

        let loitering = this.skills.get(Modules.Skills.Loitering);

        loitering.addExperience(loitering.level * 5);
    }

    /**
     * When a character is on the same tile as another character and they are in a combat,
     * we use this function to move them near the other character.
     */

    public override findAdjacentTile(): void {
        if (!this.world.map.isColliding(this.x + 1, this.y))
            this.setPosition(this.x + 1, this.y, true);
        else if (!this.world.map.isColliding(this.x - 1, this.y))
            this.setPosition(this.x - 1, this.y, true);
        else if (!this.world.map.isColliding(this.x, this.y + 1))
            this.setPosition(this.x, this.y + 1, true);
        else if (!this.world.map.isColliding(this.x, this.y - 1))
            this.setPosition(this.x, this.y - 1, true);
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

    public override teleport(
        x: number,
        y: number,
        withAnimation = false,
        before = false,
        bypass = false
    ): void {
        if (this.dead) return;
        if (bypass) this.bypassAntiCheat = true;

        if (before) this.sendTeleportPacket(x, y, withAnimation);

        this.setPosition(x, y, false);
        this.world.cleanCombat(this);

        if (before) return;

        this.sendTeleportPacket(x, y, withAnimation);

        this.bypassAntiCheat = false;
    }

    /**
     * Sends the teleport packet to the nearby regions.
     * @param x The new x grid coordinate.
     * @param y The new y grid coordinate.
     * @param withAnimation Whether or not to animate the teleportation.
     */

    private sendTeleportPacket(x: number, y: number, withAnimation = false): void {
        this.sendToRegions(
            new TeleportPacket({
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
        if (this.bypassAntiCheat) return;
        if (this.combat.started) return;

        if (reason) log.debug(`[${this.username}] ${reason}`);

        this.cheatScore += amount;

        this.cheatScoreCallback?.();
    }

    /**
     * Updates the coursing score of the player and handles edge cases
     * for when we are setting negative score values for the parameter.
     * @param score The score value we wish to increment by.
     */

    public incrementCoursingScore(score: number): void {
        this.coursingScore += score;

        // If the score is negative, we set it to 0.
        if (this.coursingScore < 0) this.coursingScore = 0;
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
            // Increment the cheat score.
            this.incrementCheatScore(`Noclip detected at ${x}, ${y}.`);

            // Send player to the last valid position.
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

    public handleTargetAttack(instance: string, x?: number, y?: number): void {
        // Prevent targetting yourself.
        if (instance === this.instance) return;

        let target = this.entities.get(instance);

        // Ignore if the target is not a character that can actually be attacked.
        if (!target?.isCharacter() || target.dead) return;

        // Ensure that the player can actually attack the target.
        if (!this.canAttack(target)) return;

        if (target.isMob() && !target.combat.started && x && y) target.setPosition(x, y);

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

                // Have the plugin handle the action if it exists.
                if (item.interactable && item.plugin?.onUse(this)) return;

                // Checks if the player can eat and uses the item's plugin to handle the action.
                if (item.edible && this.canEat() && item.plugin?.onUse(this)) {
                    this.inventory.remove(fromIndex, 1);
                    this.lastEdible = Date.now();

                    if (item.isSmallBowl())
                        this.inventory.add(new Item('bowlsmall', -1, -1, false, 1));
                    else if (item.isMediumBowl())
                        this.inventory.add(new Item('bowlmedium', -1, -1, false, 1));
                }

                // The item is equippable and the player has the requirements to equip it.
                if (item.isEquippable() && item.canEquip(this))
                    this.equipment.equip(item, fromIndex);

                break;
            }

            case Modules.ContainerType.Bank: {
                if (!this.canAccessContainer) return this.notify(`misc:CANNOT_DO_THAT`);

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
        if (count < 1 || isNaN(count)) return this.notify('misc:INVALID_AMOUNT');

        let container = type === Modules.ContainerType.Inventory ? this.inventory : this.bank;

        if (type === Modules.ContainerType.Inventory && this.map.isDoor(this.x, this.y))
            return this.notify('misc:CANNOT_DROP_ITEM_DOOR');

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

        // Ignore same index swaps.
        if (fromIndex === toIndex) return log.warning(`[${this.username}] Same index swap.`);

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

        let entity = this.entities.get(instance);

        // Ensure that the entity is close enough to interact with.
        if (entity?.getDistance(this) > 2) return;

        // If the entity is a tree we use the lumberjacking skill to handle the interaction.
        if (entity?.isTree()) this.skills.getLumberjacking().cut(this, entity);

        // If the entity is a rock we use the mining skill to handle the interaction.
        if (entity?.isRock()) this.skills.getMining().mine(this, entity);

        // If the entity is a fishing spot we use the fishing skill to handle the interaction.
        if (entity?.isFishSpot()) this.skills.getFishing().catch(this, entity);

        // If the entity is a forageable plant we use the foraging skill to handle the interaction.
        if (entity?.isForaging()) this.skills.getForaging().harvest(this, entity);

        // Attempt to find a sign first.
        let sign = this.world.globals.getSigns().get(instance);

        if (sign) return sign.talk(this);

        // If no sign was found, we attempt to find a tree.
        let coords = instance.split('-'),
            diffX = Math.abs(this.x - parseInt(coords[0])),
            diffY = Math.abs(this.y - parseInt(coords[1]));

        // Ensure that the player is close enough to the object.
        if (diffX > 2 || diffY > 2) return;

        /**
         * Here we use the cursor (I know, it's a bit of a hack) to handle
         * interactions with objects in the world. Most of these
         * are used by crafting stations.
         */

        let index = this.map.coordToIndex(parseInt(coords[0]), parseInt(coords[1])),
            cursor = this.map.getCursor(index);

        if (!cursor) return;

        // Handle interactable objects based on the cursor.
        switch (cursor) {
            case 'smithing': {
                return this.world.crafting.open(this, Modules.Skills.Smithing);
            }

            case 'smelting': {
                return this.world.crafting.open(this, Modules.Skills.Smelting);
            }

            case 'cooking': {
                return this.world.crafting.open(this, Modules.Skills.Cooking);
            }

            case 'crafting': {
                if (!this.canUseCrafting()) return this.notify('misc:NO_KNOWLEDGE_USE');

                return this.world.crafting.open(this, Modules.Skills.Crafting);
            }

            case 'alchemy': {
                if (!this.canUseAlchemy()) return this.notify('misc:NO_KNOWLEDGE_USE');

                return this.world.crafting.open(this, Modules.Skills.Alchemy);
            }
        }
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

        let experience = damage * this.world.getExperiencePerHit(),
            weapon = this.equipment.getWeapon();

        /**
         * If the player doesn't have enough mana then we halve the experience gain.
         * We make the experience half of what it would normally be.
         */

        if (!this.hasManaForAttack()) experience = Math.floor(experience / 2);

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
     */

    public handleMovementRequest(x: number, y: number, target: string): void {
        // Immediately clear the target to prevent combat from sticking to previous target.
        if (target !== this.target?.instance) this.target = undefined;

        // Stop the movement if the player is stunned.
        if (this.isStunned() || this.teleporting) return this.stopMovement();

        // If the player clicked anywhere outside the bank then the bank is no longer opened.
        this.canAccessContainer = false;
        this.activeLootBag = '';
        this.activeCraftingInterface = -1;

        if (this.map.isDoor(x, y) || this.inCombat()) return;

        let diffX = Math.abs(this.x - x),
            diffY = Math.abs(this.y - y);

        // No-clip detection if the difference is greater than 2 tiles.
        if (diffX > 2 || diffY > 2) {
            this.notify(`No-clip detected at ${this.x}(${x}), ${this.y}(${y}). Please relog.`);

            this.cheatScore++;

            log.bug(`${this.username} has no-clipped from ${this.x}(${x}), ${this.y}(${y}).`);

            this.teleport(this.oldX, this.oldY, false);

            this.invalidateMovement = true;
            return;
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
        // Stop the movement if the client is reporting a different position.
        let diffX = Math.abs(this.x - x),
            diffY = Math.abs(this.y - y);

        // Refuse any movement if the starting point mismatches our player's position by more than 2 tiles.
        if (diffX > 2 || diffY > 2) return;

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
     * @param nextX The next x coordinate of the player as reported by the client.
     * @param nextY The next y coordinate of the player as reported by the client.
     * @param timestamp The time when the packet was sent (UNIX timestamp).
     */

    public handleMovementStep(
        x: number,
        y: number,
        nextX: number,
        nextY: number,
        timestamp = Date.now()
    ): void {
        // Increment cheat score if the player is moving while stunned.
        if (this.isStunned()) {
            this.incrementCheatScore(`[${this.username}] Movement while stunned.`);

            this.stopMovement();
        }

        let now = Date.now();

        // Use time stamp if within normal latency.
        timestamp = now - timestamp < 250 ? now : timestamp;

        if (this.verifyMovement(x, y, timestamp))
            this.incrementCheatScore(`Mismatch in movement speed: ${Date.now() - timestamp}`);

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
        // Ignore movements that don't follow the packet order.
        if (!this.moving)
            return this.incrementCheatScore('Did not receive movement started packet.');

        let entity = this.entities.get(target);

        // Update orientation
        this.setOrientation(orientation);

        // Player has stopped on top of a loot bag.
        if (entity?.isLootBag()) {
            // Prevent access to the loot bag by other players.
            if (!entity.isOwner(this.username))
                return this.notify(`This lootbag belongs to ${Utils.formatName(entity.owner)}.`);

            entity.open(this);
        }

        // Player has stopped on top of an item.
        if (entity?.isItem()) {
            // Prevent cheaters from picking up item
            if (this.isCheater()) return;

            // Prevent picking up dropped items that belong to other players.
            if (!entity.isOwner(this.username))
                return this.notify(
                    `misc:CANNOT_PICK_UP_ITEM;username=${Utils.formatName(entity.owner)}`
                );

            // If the item's owner is existent and the player is the owner we add it to the statistics.
            if (entity.owner === this.username) this.statistics.addDrop(entity.key, entity.count);

            this.inventory.add(entity);
        }

        // Update the player's position.
        this.setPosition(x, y);

        // Handle doors when the player stops on one.
        if (this.map.isDoor(x, y)) {
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

        if (this.pvp && !pvp) this.notify('misc:NOT_IN_PVP_ZONE');
        else this.notify('misc:IN_PVP_ZONE');

        this.pvp = pvp;

        this.send(
            new PVPPacket({
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

        // Store the active overlay.
        let tempOverlay = this.overlayArea;

        // Store for comparison.
        this.overlayArea = overlay;

        // No overlay object or invalid object, remove the overlay.
        if (!overlay) {
            tempOverlay?.removePlayer(this);

            return this.send(new OverlayPacket(Opcodes.Overlay.Remove));
        }

        // New overlay is being loaded, remove lights.
        this.lightsLoaded = [];

        let colour =
            overlay.rgb.length > 1
                ? `rgba(${overlay.rgb[0]}, ${overlay.rgb[1]}, ${overlay.rgb[2]}, ${overlay.darkness})`
                : `rgba(0, 0, 0, ${overlay.darkness})`;

        this.send(
            new OverlayPacket(Opcodes.Overlay.Set, {
                image: overlay.fog || 'blank',
                colour
            })
        );

        if (overlay.isStatusArea()) overlay.addPlayer(this);
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
                    this.send(new CameraPacket(Opcodes.Camera.LockX));
                    break;
                }

                case 'lockY': {
                    this.send(new CameraPacket(Opcodes.Camera.LockY));
                    break;
                }

                case 'player': {
                    this.send(new CameraPacket(Opcodes.Camera.Player));
                    break;
                }
            }
        else this.send(new CameraPacket(Opcodes.Camera.FreeFlow));
    }

    /**
     * Receives information about the current music area the player is in.
     * @param info The music area information, could be undefined.
     */

    public updateMusic(info?: Area): void {
        let song = info?.song;

        if (song === this.currentSong) return;

        this.currentSong = song;

        this.send(new MusicPacket(song));
    }

    /**
     * Updates the current minigame area the player is in. It also creates a callback
     * to the area itself when the player enters (or exits).
     * @param info The area the player is entering, or undefined if they are exiting.
     */

    public updateMinigame(info?: Area): void {
        if (info === this.minigameArea) return;

        let entering = info !== undefined && this.minigameArea === undefined;

        if (entering) info?.enterCallback?.(this);
        else this.minigameArea?.exitCallback?.(this);

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
            boots = this.equipment.getBoots();

        // Check the boots for movement modifiers
        if (boots.hasMovementModifier()) speed = Math.floor(speed * boots.movementModifier);

        // Apply a 10% speed boost if the player running effect is present.
        if (this.status.has(Modules.Effects.Running)) speed = Math.floor(speed * 0.9);

        // Apply a 20% speed boost if the player is using the hot sauce.
        if (this.status.has(Modules.Effects.HotSauce)) speed = Math.floor(speed * 0.8);

        // Apply freezing movement speed effect, make the player move 25% slower.
        if (
            this.status.has(Modules.Effects.Freezing) &&
            !this.status.has(Modules.Effects.SnowPotion)
        )
            speed = Math.floor(speed * 1.25);

        // Halve speed if the player is cheating.
        if (this.isCheater()) speed = Math.floor(speed * 2);

        // Update the movement speed if there is a change from default.
        if (this.movementSpeed !== speed) this.setMovementSpeed(speed);

        return speed;
    }

    /**
     * Setters
     */

    /**
     * Updates the movement speed of the player.
     * @param movementSpeed The new movement speed of the player.
     */

    public setMovementSpeed(movementSpeed: number): void {
        this.movementSpeed = movementSpeed;

        // Sync to other players in the region.
        this.sendToRegions(
            new MovementPacket(Opcodes.Movement.Speed, {
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

        if (running) this.status.add(Modules.Effects.Running);
        else this.status.remove(Modules.Effects.Running);

        if (hotSauce) this.status.add(Modules.Effects.HotSauce);
        else this.status.remove(Modules.Effects.HotSauce);

        this.sendToRegions(
            new MovementPacket(Opcodes.Movement.Speed, {
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
        if (dualistsMark) this.status.add(Modules.Effects.DualistsMark);
        else this.status.remove(Modules.Effects.DualistsMark);

        this.combat.updateLoop();
    }

    /**
     * Adds a temporary status effect for the snow potion. This prevents the player
     * from taking cold-based damage and also protects them against freezing effects.
     */

    public setSnowPotion(): void {
        // Remove freezing effect if it has been caused by a timeout (attack).
        if (this.status.hasTimeout(Modules.Effects.Freezing))
            this.status.remove(Modules.Effects.Freezing);

        this.status.addWithTimeout(
            Modules.Effects.SnowPotion,
            Modules.Constants.SNOW_POTION_DURATION,
            () => {
                this.notify('misc:FREEZE_IMMUNITY_WORN_OFF');
            }
        );

        this.notify(
            `misc:FREEZE_IMMUNITY;duration=${Modules.Constants.SNOW_POTION_DURATION / 1000}`
        );
    }

    /**
     * Adds a temporary status effect for the fire potion. This prevents the player
     * from repeatedly taking fire damage as result of the burn effect.
     */

    public setFirePotion(): void {
        // Remove burning effect if present
        if (this.status.has(Modules.Effects.Burning)) this.status.remove(Modules.Effects.Burning);

        this.status.addWithTimeout(
            Modules.Effects.FirePotion,
            Modules.Constants.FIRE_POTION_DURATION,
            () => {
                this.notify('misc:FIRE_IMMUNITY_WORN_OFF');
            }
        );

        let duration = (Modules.Constants.FIRE_POTION_DURATION / 1000).toString();

        this.notify(`misc:FIRE_IMMUNITY;duration=${duration}`);
    }

    /**
     * Updates the player's rank and sends a packet to the client.
     * @param rank The new rank of the player, defaults to `None`.
     */

    public setRank(rank: Modules.Ranks = Modules.Ranks.None): void {
        this.rank = rank;

        this.send(new RankPacket(rank));
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
        if (this.dead || this.verifyCollision(x, y) || this.invalidateMovement) return;

        // Sets the player's new position.
        super.setPosition(x, y);

        if (skip) return;

        // Relay a packet to the nearby regions without including the player.
        this.sendToRegions(
            new MovementPacket(Opcodes.Movement.Move, {
                instance: this.instance,
                x,
                y,
                target: this.target?.instance,
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
        if (this.hasPet()) return this.notify(`misc:ALREADY_HAVE_PET`);

        // Create a new pet instance based on the key.
        this.pet = this.entities.spawnPet(this, key);

        // Begin the pet following the player.
        this.pet.follow(this);
    }

    /**
     * Removes the player's pet and adds it to their inventory if they have space.
     */

    public removePet(): boolean {
        if (!this.hasPet()) return false;

        // Ensure the player has enough space in their inventory.
        if (!this.inventory.hasSpace()) {
            this.notify('misc:NO_SPACE_PET');
            return false;
        }

        // Create a pet item and add it to the player's inventory.
        this.inventory.add(new Item(`${this.pet!.key}pet`, -1, -1, false, 1));

        // Remove the pet from the world
        this.entities.remove(this.pet!);

        // Remove the pet from the player.
        this.pet = undefined;

        return true;
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
     * @returns Whether or not the player has a weapon with the bloodsucking enchantment.
     */

    public override hasBloodsucking(): boolean {
        return this.equipment.getWeapon().isBloodsucking();
    }

    /**
     * @returns Whether or not the player currently has a pet.
     */

    public hasPet(): boolean {
        return !!this.pet;
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
        if (this.isJailed()) return Utils.getPositionFromString(Modules.Constants.JAIL_SPAWN_POINT);

        if (!this.quests.isTutorialFinished())
            return Utils.getPositionFromString(Modules.Constants.TUTORIAL_SPAWN_POINT);

        if (this.inMinigame()) return this.getMinigame()!.getSpawnPoint(this.team);

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

    public getMinigame(): Minigame | undefined {
        return this.world.minigames.get(this.minigame);
    }

    /**
     * This is the timeout duration in milliseconds for the player's connection
     * depending on their rank. Patrons and administrators have a longer timeout
     * duration than regular players.
     */

    public getTimeoutByRank(): number {
        switch (this.rank) {
            case Modules.Ranks.TierOne: {
                return 15 * 60_000; // 15 minutes
            }

            case Modules.Ranks.TierTwo: {
                return 20 * 60_000; // 20 minutes
            }

            case Modules.Ranks.TierThree: {
                return 25 * 60_000; // 25 minutes
            }

            case Modules.Ranks.TierFour: {
                return 30 * 60_000; // 30 minutes
            }

            case Modules.Ranks.TierFive: {
                return 35 * 60_000; // 35 minutes
            }

            case Modules.Ranks.HollowAdmin:
            case Modules.Ranks.Moderator:
            case Modules.Ranks.TierSix: {
                return 40 * 60_000; // 40 minutes
            }

            case Modules.Ranks.Admin:
            case Modules.Ranks.TierSeven: {
                return 45 * 60_000; // 45 minutes
            }

            default: {
                return 10 * 60_000; // 10 minutes
            }
        }
    }

    /**
     * Calculates the global chat cooldown based on the player's rank.
     */

    public getGlobalChatCooldown(): number {
        switch (this.rank) {
            case Modules.Ranks.TierOne: {
                return 55 * 60_000;
            }

            case Modules.Ranks.TierTwo: {
                return 50 * 60_000;
            }

            case Modules.Ranks.TierThree: {
                return 45 * 60_000;
            }

            case Modules.Ranks.TierFour: {
                return 40 * 60_000;
            }

            case Modules.Ranks.TierFive: {
                return 35 * 60_000;
            }

            case Modules.Ranks.TierSix: {
                return 30 * 60_000;
            }

            case Modules.Ranks.TierSeven: {
                return 15 * 60_000;
            }

            case Modules.Ranks.Moderator:
            case Modules.Ranks.HollowAdmin:
            case Modules.Ranks.Admin: {
                return 5000;
            }

            default: {
                return 60 * 60_000;
            }
        }
    }

    /**
     * Converts the global chat cooldown duration into minutes.
     * @returns An integer representing the minutes left.
     */

    public getGlobalChatDuration(): number {
        let difference = this.getGlobalChatCooldown() - (Date.now() - this.lastGlobalChat);

        return Math.ceil(difference / 60_000);
    }

    /**
     * Adds a region id to the list of loaded regions.
     * @param region The region id we are adding.
     */

    public loadRegion(region: number): void {
        this.regionsLoaded.push(region);
    }

    /**
     * @param region Region id of the region we are checking.
     * @returns Whether or not the region has been added to the list of loaded regions.
     */

    public hasLoadedRegion(region: number): boolean {
        return this.regionsLoaded.includes(region);
    }

    /**
     * @param light The light that we are checking if it exists in the list of loaded lights.
     * @returns Whether or not the light has been added to the list of loaded lights.
     */

    public hasLoadedLight(light: number): boolean {
        return this.lightsLoaded.includes(light);
    }

    /**
     * Sends a ping request to the client. This is used to calculate the latency.
     */

    public ping(): void {
        this.pingTime = Date.now();

        this.send(new NetworkPacket(Opcodes.Network.Ping));
    }

    /**
     * Removes the player from any areas that keep track of players.
     */

    public clearAreas(): void {
        if (!this.inFreezingArea()) return;

        this.overlayArea!.removePlayer(this);
    }

    /**
     * Clears a minigame instance from the player and erases
     * all the minigame data for all minigames.
     */

    public clearMinigame(): void {
        this.minigame = undefined;

        this.coursingScore = 0;
        this.coursingTarget = '';
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
     * @returns Whether or not the player is jailed.
     */

    public isJailed(): boolean {
        return this.jail - Date.now() > 0;
    }

    /**
     * Checks if the player is currently in  a minigame.
     */

    public inMinigame(): boolean {
        return this.minigame !== undefined;
    }

    /**
     * Whether or not the player is in a team war minigame.
     * @returns The player is in a team war minigame.
     */

    public inTeamWar(): boolean {
        return this.minigame === Opcodes.Minigame.TeamWar;
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
     * A hollow admin is an administrator that can perform all of the commands of
     * an admin but cannot influence the economy of the game.
     * @returns Whether or not the player has the hollow admin rank.
     */

    public isHollowAdmin(): boolean {
        return this.rank === Modules.Ranks.HollowAdmin;
    }

    /**
     * Accounts younger than 1 minute are considered new accounts.
     * @returns Whether the account's creation date is within the last minute.
     */

    public isNew(): boolean {
        return Date.now() - this.statistics.creationTime < 60_000;
    }

    /**
     * @returns Whether or not the player is using archery-based weapons.
     */

    public override isArcher(): boolean {
        return this.equipment.getWeapon().isArcher();
    }

    /**
     * The threshold for loitering occurs when a player is in
     * the same region for at least 90 seconds. This is used to level
     * up the loitering skill when the player sits in one area doing
     * things like crafting, smithing, etc.
     */

    public isLoiteringThreshold(): boolean {
        return Date.now() - this.lastRegionChange >= Modules.Constants.LOITERING_THRESHOLD;
    }

    /**
     * Players obtain their poisoning abilities from their weapon. Certain
     * weapons may be imbued with a poison effect. This checks if that status
     * is active.
     * @returns Whether or not the weapon is poisonous.
     */

    public override isPoisonous(): boolean {
        // If the player is an archer, we use the arrows to determine the poisonous status.
        if (this.isArcher()) return this.equipment.getArrows().poisonous;

        return this.equipment.getWeapon().poisonous;
    }

    /**
     * @returns Whether or not the player uses magic-based weapons.
     */

    public override isMagic(): boolean {
        return this.equipment.getWeapon().isMagic();
    }

    /**
     * Checks whether or not the player is in a freezing area. This is used
     * to determine stacking of freezing effect (e.g. from ice arrows).
     * @returns Whether or not the player is in a freezing area.
     */

    public inFreezingArea(): boolean {
        return !!this.overlayArea?.isStatusArea();
    }

    /**
     * @returns Whether or not the time delta is greater than the cooldown since last edible.
     */

    private canEat(): boolean {
        return Date.now() - this.lastEdible > Modules.Constants.EDIBLE_COOLDOWN;
    }

    /**
     * @returns Whether or not the time delta is greater than the cooldown since last craft.
     */

    public canCraft(): boolean {
        return Date.now() - this.lastCraft > Modules.Constants.CRAFT_COOLDOWN;
    }

    /**
     * @returns Whether or not the player can use the global chat given his last global chat time.
     */

    public canGlobalChat(): boolean {
        return Date.now() - this.lastGlobalChat > this.getGlobalChatCooldown();
    }

    /**
     * @returns Whether or not the player has started the necessary quest to use crafting benches.
     */

    public canUseCrafting(): boolean {
        return this.quests.get(Modules.Constants.CRAFTING_QUEST_KEY).isStarted();
    }

    /**
     * @returns Whether or not the player has started the necessary quest to use alchemy.
     */

    public canUseAlchemy(): boolean {
        return this.quests.get(Modules.Constants.ALCHEMY_QUEST_KEY).isStarted();
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
            this.world.client.send(
                new ChatPacket({ source: this.username, message, target: playerName })
            );
            return;
        }

        if (!this.world.isOnline(playerName))
            return this.notify(`misc:NOT_ONLINE;username=${playerName}`, 'crimson');

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
        this.sendToRegions(new SyncPacket(this.serialize(true)), true);
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
        if (!this.canTalk) return this.notify('misc:CANNOT_TALK', 'crimson');

        // Handle global chat
        if (global) {
            if (!this.quests.isTutorialFinished())
                return this.notify('misc:CANNOT_GLOBAL_CHAT_TUTORIAL', 'crimson');

            // Jailed players cannot global chat.
            if (this.isJailed()) return this.notify('misc:CANNOT_GLOBAL_CHAT_JAIL', 'crimson');

            // Limit the global chat to the cooldown based on ranks.
            if (!this.canGlobalChat())
                return this.notify(
                    `misc:CANNOT_GLOBAL_CHAT_MINUTES;duration=${this.getGlobalChatDuration()}`,
                    'crimson'
                );

            this.lastGlobalChat = Date.now();
        }

        log.debug(`[${this.username}] ${message}`);

        let name = Utils.formatName(this.username);

        if (this.rank !== Modules.Ranks.None) {
            name = `[${Modules.RankTitles[this.rank]}] ${name}`;
            colour = global ? 'rgba(191, 161, 63, 1.0)' : Modules.RankColours[this.rank];
        }

        let source = `${global ? '[Global]' : ''} ${name}`;

        // Relay the message to the discord channel if it is enabled.
        this.world.discord.sendMessage(source, message, undefined, true);

        // Relay the hub so that it can handle the discord relay.
        this.world.client.send(new ChatPacket({ source, message }));

        if (global) return this.world.globalMessage(name, message, colour);

        let packet = new ChatPacket({
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
     * @param soundEffect The sound effect to play when the popup is displayed.
     */

    public popup(title: string, message: string, colour = '#00000', soundEffect = ''): void {
        if (!title) return;

        this.send(
            new NotificationPacket(Opcodes.Notification.Popup, {
                title,
                message,
                colour,
                soundEffect
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

        this.send(
            new NotificationPacket(Opcodes.Notification.Text, {
                message,
                colour,
                source
            })
        );

        this.lastNotify = Date.now();
    }

    /**
     * Sends a message to the player's guild controller's interface.
     * @param message The message we are sending to the player.
     */

    public guildNotify(message: string): void {
        this.send(new GuildPacket(Opcodes.Guild.Error, { message }));
    }

    /**
     * Sends a pointer data packet to the player. Removes all
     * existing pointers first to prevent multiple pointers.
     * @param info Generic pointer object that contains the type and
     * associated information with the pointer.
     * @param remove Whether or not we should remove all existing pointers.
     */

    public pointer(info: PointerData, remove = true): void {
        // Remove all existing pointers first.
        if (remove) this.send(new PointerPacket(Opcodes.Pointer.Remove));

        // Invalid pointer data received.
        if (!(info.type in Opcodes.Pointer)) return;

        this.send(new PointerPacket(info.type, info));
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
        data.name = Utils.formatName(this.username);
        data.rank = this.rank;
        data.level = this.skills.getCombatLevel();
        data.hitPoints = this.hitPoints.getHitPoints();
        data.maxHitPoints = this.hitPoints.getMaxHitPoints();
        data.attackRange = this.attackRange;
        data.movementSpeed = this.getMovementSpeed();

        if (this.inTeamWar()) data.displayInfo = this.getDisplayInfo();

        // Include equipment only when necessary.
        if (withEquipment) data.equipments = this.equipment.serialize(true).equipments;

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
     * Subclass implementation that uses the appropriate type of weapon
     * to determine the player's accuracy bonus.
     * @returns The player's accuracy bonus based on their weapon type.
     */

    public override getAccuracyBonus(): number {
        if (this.isArcher()) return this.getBonuses().archery;
        if (this.isMagic()) return this.getBonuses().magic;

        return this.getBonuses().accuracy;
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
        if (this.status.has(Modules.Effects.ThickSkin)) reduction -= 0.2;

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
     * Subclass implementation for player's damage type. The damage hit type is selected
     * based on the arrows or the weapon the player has equipped.
     * @returns The damage type of the player's current weapon.
     */

    public override getDamageType(): Modules.Hits {
        // Attempt to apply the arrow effects if the player is using ranged weapons.
        if (this.isArcher()) {
            let arrows = this.equipment.getArrows();

            /**
             * Depending on the type of weapon the player is using, we will either use
             * the burning/freezing effect of the arrows or the weapon itself.
             */

            if (arrows.freezing && Formulas.getEffectChance()) return Modules.Hits.Freezing;
            if (arrows.burning && Formulas.getEffectChance()) return Modules.Hits.Burning;

            // We use the player's bow to determine the damage type if the arrows do not have any effects.
            let weapon = this.equipment.getWeapon();

            if (weapon.isStun() && Formulas.getEffectChance()) return Modules.Hits.Stun;

            // Apply the area-of-effect damage if the weapon is explosive.
            if (weapon.isExplosive() && Formulas.getEffectChance()) {
                this.aoe = 1;
                return Modules.Hits.Explosive;
            }
        } else {
            let weapon = this.equipment.getWeapon();

            /**
             * Weapon effects may vary. Here we do a roll against the weapon's enchantments
             * and their level to determine which damage type we will use.
             */

            if (weapon.isCritical() && Formulas.getEffectChance()) return Modules.Hits.Critical;
        }

        // Default case for damage.
        return Modules.Hits.Normal;
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
     * This function assumes that we already checked that the player has the bloodsucking
     * enchantment.
     * @returns The bloodsucking enchantment level the player currently has on his weapon.
     */

    public override getBloodsuckingLevel(): number {
        return (
            this.equipment.getWeapon().enchantments[Modules.Enchantment.Bloodsucking]?.level || 1
        );
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
        if (this.status.has(Modules.Effects.DualistsMark))
            return this.equipment.getWeapon().attackRate - 200;

        return this.equipment.getWeapon().attackRate;
    }

    /**
     * Gets the remaining time amount in a string format.
     * @returns The string format of the amount of minutes or seconds remaining.
     */

    public getJailDuration(): string {
        let duration = this.jail - Date.now();

        return duration > 60_000
            ? `${Math.ceil(duration / 60_000)} more minutes`
            : `${Math.floor(duration / 1000)} more seconds`;
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
