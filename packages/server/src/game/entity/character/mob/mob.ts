import MobHandler from './handler';

import rawData from '../../../../../data/mobs.json';
import dropTables from '../../../../../data/tables.json';
import PluginIndex from '../../../../../data/plugins/mobs';
import Spawns from '../../../../../data/spawns.json';
import Character from '../character';

import { Modules, Opcodes } from '@kaetram/common/network';
import { SpecialEntityTypes } from '@kaetram/common/network/modules';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Heal, Movement } from '@kaetram/server/src/network/packets';

import type { EntityData, EntityDisplayInfo } from '@kaetram/common/types/entity';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type { MobData } from '@kaetram/common/types/mob';
import type DefaultPlugin from '../../../../../data/plugins/mobs/default';
import type Area from '../../../map/areas/area';
import type Areas from '../../../map/areas/areas';
import type World from '../../../world';
import type Entity from '../../entity';
import type Chest from '../../objects/chest';
import type Player from '../player/player';

interface RawData {
    [key: string]: MobData;
}

interface ItemDrop {
    key: string;
    count: number;
}

export default class Mob extends Character {
    public spawnX: number = this.x;
    public spawnY: number = this.y;

    public description: string | string[] = '';

    // An achievement that is completed upon defeating the mob.
    public achievement = '';
    public area!: Area;
    public chest!: Chest; // Used for mimics since they belong to a chest

    public boss = false;
    public respawnable = true;
    public miniboss = false;
    public roaming = false;
    public poisonous = false;
    public aggressive = false;
    public alwaysAggressive = false;
    private hiddenName = false;

    // Stats & Bonuses
    private attackStats: Stats = Utils.getEmptyStats();
    private defenseStats: Stats = Utils.getEmptyStats();
    private bonuses: Bonuses = Utils.getEmptyBonuses();

    private drops: { [itemKey: string]: number } = {}; // Empty if not specified.
    private dropTables: string[] = ['ordinary', 'arrows', 'unusual']; // Default drop table for all mobs.

    public defenseLevel = Modules.MobDefaults.DEFENSE_LEVEL;
    public attackLevel = Modules.MobDefaults.ATTACK_LEVEL;
    public respawnDelay = Modules.MobDefaults.RESPAWN_DELAY; // Use default spawn delay if not specified.
    public aggroRange = Modules.MobDefaults.AGGRO_RANGE;
    public roamDistance = Modules.MobDefaults.ROAM_DISTANCE;

    private handler?: MobHandler | DefaultPlugin;

    private respawnCallback?: () => void;

    public talkCallback?: (message: string) => void;
    public roamingCallback?: () => void;

    public constructor(world: World, key: string, x: number, y: number, plugin?: boolean) {
        super(Utils.createInstance(Modules.EntityType.Mob), world, key, x, y);

        let data = (rawData as RawData)[key];

        if (!data) {
            log.error(`[Mob] Could not find data for ${key}.`);
            return;
        }

        this.loadData(data);
        this.loadPlugin(plugin ? key : data.plugin!); // plugin boolean is used to load plugin based on key.
        this.loadSpawns();
        this.loadStats();

        if (!this.handler) log.error(`[Mob] Mob handler for ${key} is not initialized.`);
    }

    /**
     * Loads mob data based on the specified data object. We use this
     * function since this can be called once when the mob initializes and
     * when we want to load instance-based custom data.
     * @param data Contains information about the mob.
     */

    private loadData(data: MobData): void {
        if (data.hitPoints) this.hitPoints.updateHitPoints(data.hitPoints);

        this.name = data.name || this.name;
        this.description = data.description || this.description;
        this.drops = data.drops || this.drops;
        this.dropTables = data.dropTables || this.dropTables;
        this.level = data.level || this.level;
        this.attackLevel = data.attackLevel || this.attackLevel;
        this.defenseLevel = data.defenseLevel || this.defenseLevel;
        this.attackRange = data.attackRange || this.attackRange;
        this.aggroRange = data.aggroRange || this.aggroRange;
        this.aggressive = data.aggressive || this.aggressive;
        this.alwaysAggressive = data.alwaysAggressive || this.alwaysAggressive;
        this.attackRate = data.attackRate || this.attackRate;
        this.respawnDelay = data.respawnDelay || this.respawnDelay;
        this.movementSpeed = data.movementSpeed || this.movementSpeed;
        this.boss = data.boss || this.boss;
        this.miniboss = data.miniboss || this.miniboss;
        this.poisonous = data.poisonous || this.poisonous;
        this.hiddenName = data.hiddenName || this.hiddenName;
        this.achievement = data.achievement || this.achievement;
        this.projectileName = data.projectileName || this.projectileName;
        this.roamDistance = data.roamDistance || this.roamDistance;
        this.healRate = data.healRate || this.healRate;
        this.roaming = data.roaming || this.roaming;

        this.plateauLevel = this.world.map.getPlateauLevel(this.spawnX, this.spawnY);

        // Handle hiding the entity's name.
        if (this.hiddenName) this.name = '';
    }

    /**
     * Attempts to locate and load a plugin from the plugin index.
     * @param pluginName Optional parameter for loading a plugin specified by name.
     */

    private loadPlugin(pluginName?: string): void {
        if (!pluginName || !(pluginName in PluginIndex)) {
            // Initialize a mob handler since we couldn't find a plugin.
            this.handler = new MobHandler(this);
            return;
        }

        this.handler = new PluginIndex[pluginName as keyof typeof PluginIndex](this);
    }

    /**
     * Spawns are special entities at specific locations throughout the world
     * with differing properties. For example, we can spawn 50 goblins using the
     * Tiled map editor, and we use the `spawns.json` to specify that a goblin
     * at a specific location be marked as a miniboss, not roaming, or any other
     * property we'd like to modify on a per instance basis.
     *
     * The key in the `spawns.json` represents the x and y coordinates separated
     * by a dash. We check the mob's spawn location against the key, if there is
     * a match, then we apply the properties onto the current mob.
     */

    private loadSpawns(): void {
        // Coordinates of the mob's spawn location as a key.
        let key = `${this.spawnX}-${this.spawnY}`;

        // Check the coordinate key against the `spawns.json` dictionary JSON file.
        if (!(key in Spawns)) return;

        let data = (Spawns as { [key: string]: MobData })[key];

        /**
         * Here we attempt to load all the data from the `spawns.json` file.
         * If a property doesn't exist, then we just use the default value.
         */

        this.loadData(data);

        // Custom plugin can be specified on a per-instance bassis.
        if (data.plugin) this.loadPlugin(data.plugin);
    }

    /**
     * Loads the attack, defense stats, and the bonuses for the mob.
     */

    private loadStats(): void {
        this.attackStats = {
            crush: this.attackLevel,
            stab: this.attackLevel,
            slash: this.attackLevel,
            archery: this.attackLevel,
            magic: this.attackLevel
        };

        this.defenseStats = {
            crush: this.defenseLevel * 1.5,
            stab: this.defenseLevel * 1.5,
            slash: this.defenseLevel * 1.5,
            archery: this.defenseLevel * 1.5,
            magic: this.defenseLevel
        };

        this.bonuses = {
            accuracy: this.attackLevel,
            strength: this.attackLevel,
            archery: this.attackRange + this.attackLevel,
            magic: this.attackLevel
        };
    }

    /**
     * An override for the `heal` function which adds support for heal packet.
     * @param amount Amount we are healing the mob by.
     * @param type The type of healing performed (passive or hitpoints).
     */

    public override heal(amount = 1, type: Modules.HealTypes = 'passive'): void {
        super.heal(amount);

        if (type === 'hitpoints') {
            // Increment hitpoints by the amount.
            this.hitPoints.increment(amount);

            // Send the heal packet to the nearby regions.
            this.sendToRegions(
                new Heal({
                    instance: this.instance,
                    type,
                    amount
                })
            );
        }
    }

    /**
     * Destroys the mob and removes all targets. Begins
     * the respawning process if the mob is respawnable.
     * Sets the mob's position back to the spawn point,
     * and registers the mob's death with the area.
     */

    public destroy(): void {
        this.dead = true;
        this.damageTable = {};

        this.combat.stop();

        this.respawn();

        this.setPoison();
        this.setPosition(this.spawnX, this.spawnY);
    }

    /**
     * Permanently removes an entity from the world.
     */

    public despawn(): void {
        this.dead = true;
        this.combat.stop();

        this.world.entities.removeMob(this);
    }

    /**
     * Handles the dropping of items from the mob.
     * @param owner The leading attacker in the mob's death. Only they will be able
     * to pick up the drop for a certain period of time.
     */

    public drop(owner = ''): void {
        let drops = this.getDrops();

        if (drops.length === 0) return;

        for (let drop of drops)
            this.world.entities.spawnItem(drop.key, this.x, this.y, true, drop.count, {}, owner);
    }

    /**
     * Moves the mob and broadcasts the action
     * to all the adjacent regions.
     * @param x The new x position of the mob.
     * @param y The new y position of the mob.
     */

    public override move(x: number, y: number): void {
        this.setPosition(x, y);

        this.calculateOrientation();

        this.world.push(Modules.PacketType.Regions, {
            region: this.region,
            packet: new Movement(Opcodes.Movement.Move, {
                instance: this.instance,
                x,
                y
            })
        });
    }

    /**
     * Override for the superclass `setPosition` with added teleporting support.
     */

    public override setPosition(x: number, y: number): void {
        // Prevent changes in position if the mob is teleporting.
        if (this.teleporting) return;

        super.setPosition(x, y);
    }

    /**
     * The drop function works by picking a random item from the mob's personal
     * drop list. We randomly select an item and roll its chance against the overall
     * drop chance. We add the item to the list if the roll is successful. We continue
     * by looking through the mob's drop tables and doing the same thing. We then
     * return the list of items that the mob will drop.
     * @returns A list of items that the mob will drop.
     */

    public getDrops(): ItemDrop[] {
        let drops: ItemDrop[] = [], // The items that the mob will drop
            randomItem = this.getRandomItem(this.drops);

        // Add a random item from the mob's personal list of drops.
        if (randomItem) drops.push(randomItem);

        // Add items from the mob's drop table.
        drops = [...drops, ...this.getDropTableItems()];

        return drops;
    }

    /**
     * Looks through the drop tables of the mob and iterates through those to get items.
     * @returns List of items from the drop table.
     */

    private getDropTableItems(): ItemDrop[] {
        let drops: ItemDrop[] = [];

        for (let key of Object.values(this.dropTables)) {
            let table = dropTables[key as keyof typeof dropTables]; // Pick the table from the list of drop tables.

            // Something went wrong.
            if (table) {
                let randomItem = this.getRandomItem(table);

                // Add a random item from the table.
                if (randomItem) drops.push(randomItem);
            } else log.warning(`Mob ${this.key} has an invalid drop table.`);
        }

        return drops;
    }

    /**
     * Given a list of items (whether from the mob's drops) or the drop table, we will pick
     * a random item then roll that item's chance against the overall drop chance. We return
     * the item if the roll is successful, otherwise undefined.
     * @param items The list of items to pick from.
     * @returns Returns an `ItemDrop` object containing the key and the count.
     */

    private getRandomItem(items: { [key: string]: number }): ItemDrop | undefined {
        let keys = Object.keys(items);

        // No items to pick from.
        if (keys.length === 0) return undefined;

        let key = keys[Utils.randomInt(0, keys.length - 1)],
            drop = items[key],
            count = 1;

        switch (key) {
            case 'gold': {
                count = Utils.randomInt(this.level, this.level * 10);
                break;
            }

            case 'flask': {
                count = Utils.randomInt(1, 3);
                break;
            }

            case 'arrow': {
                count = Utils.randomInt(1, this.level);
                break;
            }

            case 'firearrow': {
                count = Utils.randomInt(1, Math.ceil(this.level / 2));
                break;
            }
        }

        // Something went wrong when trying to get the item drop.
        if (!drop) {
            log.warning(`Mob ${this.key} has an invalid drop.`);
            return undefined;
        }

        return Utils.randomInt(0, Modules.Constants.DROP_PROBABILITY) < drop
            ? { key, count }
            : undefined;
    }

    /**
     * Sorts the damage table from highest to lowest. The highest damage dealing player
     * will receive priority over the drops the mob has.
     * @returns Sorted damage table from highest to lowest.
     */

    public getDamageTable(): [string, number][] {
        return Object.entries(this.damageTable).sort((a, b) => b[1] - a[1]);
    }

    /**
     * This function roughly calculates the orientation based on the old
     * coordinates and the new coordinates. They do not matter much since
     * orientation is only sent when an entity is created. This gives the
     * effect to players entering new regions or just logging in that the
     * entities aren't just standing still and all facing the same direction.
     */

    private calculateOrientation(): void {
        if (this.oldX < this.x) this.setOrientation(Modules.Orientation.Right);
        else if (this.oldX > this.x) this.setOrientation(Modules.Orientation.Left);
        else if (this.oldY < this.y) this.setOrientation(Modules.Orientation.Down);
        else if (this.oldY > this.y) this.setOrientation(Modules.Orientation.Up);
    }

    /**
     * Checks if the mob can aggro the player depending on information
     * about the mob and player. An always aggressive mob will aggro
     * regardless of the player's level, otherwise, if the player's level
     * is roughly 1.5x greater than the mob's, then the mob does not aggro.
     * @param player Player entity to test aggro conditions against.
     * @returns Whether or not the mob can aggro the player.
     */

    public canAggro(player: Player): boolean {
        // Skip if mob has a target or the player targeted isn't fully loaded yet.
        if (this.target || !player.ready) return false;

        // Check for aggressive properties of the mob.
        if (!this.aggressive && !this.alwaysAggressive) return false;

        // Only aggro if the mob's level * 3 is lower than the player's level.
        if (Math.floor(this.level * 3) < player.level && !this.alwaysAggressive) return false;

        // Ensure the mob isnear the player within its aggro range.
        return this.isNear(player, this.aggroRange);
    }

    /**
     * Extracts the area the mob is currently in and adds it to it.
     * @param chestAreas The areas for chests for us to extract the mob's area.
     */

    public addToChestArea(chestAreas: Areas): void {
        // In case chests area does not exist in the map.
        if (!chestAreas) return;

        this.area = chestAreas.inArea(this.x, this.y)!;

        this.area?.addEntity(this);
    }

    /**
     * Moves the mob back to the spawn point.
     */

    public sendToSpawn(): void {
        this.combat.stop();

        this.move(this.spawnX, this.spawnY);
    }

    /**
     * Checks if the distance between the mob's current position and the spawn
     * point is greater than the roam distance.
     * @param entity Optional parameter to check against the entity.
     * @param distance Optional parameter to specify custom distance (used for combat).
     * @returns Whether or not the mob should return to the spawn.
     */

    public outsideRoaming(entity?: Entity, distance = this.roamDistance): boolean {
        return (
            Utils.getDistance(entity?.x || this.x, entity?.y || this.y, this.spawnX, this.spawnY) >
            distance
        );
    }

    /**
     * Grabs the name colour based on the mob's data. If a player is provided,
     * we check if the mob is an active quest/achievement entity.
     * @param player Optional parameter to check if the mob is an active quest/achievement entity.
     * @returns The string value of the name colour, an empty string indicates a problem.
     */

    private getNameColour(player?: Player): string {
        if (this.area) return Modules.NameColours[SpecialEntityTypes.Area];
        if (this.boss) return Modules.NameColours[SpecialEntityTypes.Boss];
        if (this.miniboss) return Modules.NameColours[SpecialEntityTypes.Miniboss];

        if (player) {
            if (player.quests.getQuestFromMob(this))
                return Modules.NameColours[SpecialEntityTypes.Quest];
            if (player?.achievements.getAchievementFromEntity(this))
                return Modules.NameColours[SpecialEntityTypes.Achievement];
        }

        return '';
    }

    /**
     * Grabs the display info for the mob depending on its properties.
     * @param player Optional player parameter used to grab info
     * depending on the mob's state in the player's quest progression.
     * @returns The display info for the mob.
     */

    public override getDisplayInfo(player?: Player): EntityDisplayInfo {
        let displayInfo: EntityDisplayInfo = {
            instance: this.instance,
            colour: this.getNameColour(player)
        };

        // Only minibosses have a special scale, we send the scale only if the mob is a miniboss.
        if (this.miniboss) displayInfo.scale = Modules.EntityScale[SpecialEntityTypes.Miniboss];

        return displayInfo;
    }

    /**
     * Returns the description if it's just a string, otherwise it picks a random description
     * from the array.
     * @returns A string containing the description for the mob.
     */

    public getDescription(): string {
        if (Array.isArray(this.description))
            return this.description[Utils.randomInt(0, this.description.length - 1)];

        return this.description;
    }

    /**
     * A mob contains special data if it is a mini-boss/boss, is part of an area,
     * or is part of a player's active quest.
     * @param player Optional paramater used to check mob's information against player's
     * quests and achievement information.
     * @returns Conditional on if the mob contains special data.
     */

    public override hasDisplayInfo(player?: Player): boolean {
        if (this.area || this.boss || this.miniboss) return true;

        // Check if player is provided and the mob's information against their quests/achievements.
        if (player) {
            if (player.quests?.getQuestFromMob(this)) return true;
            if (player.achievements?.getAchievementFromEntity(this)) return true;
        }

        return false;
    }

    /**
     * If the attack range is greater than 1, then the mob
     * is a ranged entity.
     * @returns If the mob is ranged or not.
     */

    public override isRanged(): boolean {
        return this.attackRange > 1;
    }

    /**
     * Activates the poisonous status effect on the mob.
     * @returns If the mob data contains a poisonous status.
     */

    public override isPoisonous(): boolean {
        return this.poisonous;
    }

    /**
     * Some entities are static (only spawned once during an event)
     * Meanwhile, other entities act as an illusion to another entity,
     * so the respawning script is handled elsewhere.
     */
    private respawn(): void {
        if (!this.respawnable) return;

        setTimeout(() => this.respawnCallback?.(), this.respawnDelay);
    }

    /**
     * Takes mob file and serializes it by adding extra
     * variables into the EntityData interface.
     * @param player Optional parameter used to include displayInfo into the packet.
     * @returns Entity data with mob elements inserted.
     */

    public override serialize(player?: Player): EntityData {
        let data = super.serialize();

        data.hitPoints = this.hitPoints.getHitPoints();
        data.maxHitPoints = this.hitPoints.getMaxHitPoints();
        data.attackRange = this.attackRange;

        // Include the display info in the packet if the player parameter is specified.
        if (player) data.displayInfo = this.getDisplayInfo(player);

        // Level is hidden as well so that it doesn't display.
        if (!this.hiddenName) data.level = this.level;

        return data;
    }

    /**
     * Override for the superclass attack stats function.
     * @return The total attack stats for the mob
     */

    public override getAttackStats(): Stats {
        return this.attackStats;
    }

    /**
     * Override for the superclass defence stats function.
     * @return The total defence stats for the mob
     */

    public override getDefenseStats(): Stats {
        return this.defenseStats;
    }

    /**
     * Override for the superclass bonuses function.
     * @returns The total bonuses of the mob.
     */

    public override getBonuses(): Bonuses {
        return this.bonuses;
    }

    /**
     * Implementation for accuracy level. We use the attack level for mobs.
     * @returns The attack level of the mob.
     */

    public override getAccuracyLevel(): number {
        return this.attackLevel;
    }

    /**
     * Implementation for strength level. In the case of mobs, we just
     * use their attack level to calculate their damage output.
     * @returns The mob's attack level.
     */

    public override getStrengthLevel(): number {
        return this.attackLevel;
    }

    /**
     * Implementation for archery level. In the case of mobs, we just
     * use their attack level to calculate their damage output.
     * @returns The mob's archery level.
     */

    public override getArcheryLevel(): number {
        return this.attackLevel;
    }

    /**
     * Subclass implementation for grabbing the defense level. For a mob
     * the defense level is specified in the mob data object.
     * @returns The defense level of the mob.
     */

    public override getDefenseLevel(): number {
        return this.defenseLevel;
    }

    /**
     * Callback for when the mob respawns.
     */

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    /**
     * A callback for when the mob is will display a chat bubble.
     * @param callback The message in a string format of what the mob says.
     */

    public onTalk(callback: (message: string) => void): void {
        this.talkCallback = callback;
    }

    /**
     * Callback for when roaming occurs.
     */

    public onRoaming(callback: () => void): void {
        this.roamingCallback = callback;
    }
}
