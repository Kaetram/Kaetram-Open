import MobHandler from './handler';

import Character from '../character';
import Item from '../../objects/item';
import Formulas from '../../../../info/formulas';
import rawData from '../../../../../data/mobs.json';
import Spawns from '../../../../../data/spawns.json';
import dropTables from '../../../../../data/tables.json';
import PluginIndex from '../../../../../data/plugins/mobs';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';
import { HealPacket, MovementPacket, TeleportPacket } from '@kaetram/common/network/impl';
import { SpecialEntityTypes } from '@kaetram/common/network/modules';

import type Area from '../../../map/areas/area';
import type Areas from '../../../map/areas/areas';
import type World from '../../../world';
import type Chest from '../../objects/chest';
import type Player from '../player/player';
import type DefaultPlugin from '../../../../../data/plugins/mobs/default';
import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type {
    RawMobData,
    MobData,
    MobSkills,
    MobDrop,
    MobDropTable
} from '@kaetram/common/types/mob';
import type { EntityData, EntityDisplayInfo } from '@kaetram/common/types/entity';

interface ItemDrop {
    key: string;
    count: number;
}

export default class Mob extends Character {
    private data: MobData;
    public spawnX: number;
    public spawnY: number;

    public description: string | string[] = '';

    // An achievement that is completed upon defeating the mob.
    public achievement = '';
    public area!: Area;
    public chest!: Chest; // Used for mimics since they belong to a chest

    public boss = false;
    public respawnable = true;
    public miniboss = false;
    public roaming = true; // Roaming is true by default
    public poisonous = false;
    public freezing = false;
    public burning = false;
    public aggressive = false;
    public alwaysAggressive = false;
    private hiddenName = false;

    // Stats & Bonuses
    private attackStats: Stats = Utils.getEmptyStats();
    private defenseStats: Stats = Utils.getEmptyStats();
    private bonuses: Bonuses = Utils.getEmptyBonuses();

    private drops: MobDrop[] = [];
    private dropTables: string[] = [];

    private skills: MobSkills = {
        accuracy: Modules.MobDefaults.ACCURACY_LEVEL,
        strength: Modules.MobDefaults.STRENGTH_LEVEL,
        defense: Modules.MobDefaults.DEFENSE_LEVEL,
        magic: Modules.MobDefaults.MAGIC_LEVEL,
        archery: Modules.MobDefaults.ARCHERY_LEVEL
    };

    public respawnDelay: number = Modules.MobDefaults.RESPAWN_DELAY; // Use default spawn delay if not specified.
    public aggroRange: number = Modules.MobDefaults.AGGRO_RANGE;
    public roamDistance: number = Modules.MobDefaults.ROAM_DISTANCE;

    private handler?: MobHandler | DefaultPlugin;

    private lastChangedTarget = 0;

    private respawnCallback?: () => void;

    public talkCallback?: (message: string) => void;
    public roamingCallback?: () => void;

    public constructor(world: World, key: string, x: number, y: number, plugin?: boolean) {
        super(Utils.createInstance(Modules.EntityType.Mob), world, key, x, y);

        this.spawnX = this.x;
        this.spawnY = this.y;

        this.data = (rawData as RawMobData)[key];

        if (!this.data) {
            log.error(`[Mob] Could not find data for ${key}.`);
            return;
        }

        this.loadData(this.data);
        this.loadPlugin(plugin ? key : this.data.plugin!); // plugin boolean is used to load plugin based on key.
        this.loadSpawns();

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
        this.skills = data.skills || this.skills;
        this.attackStats = data.attackStats || this.attackStats;
        this.defenseStats = data.defenseStats || this.defenseStats;
        this.bonuses = data.bonuses || this.bonuses;
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
        this.freezing = data.freezing || this.freezing;
        this.burning = data.burning || this.burning;
        this.hiddenName = data.hiddenName || this.hiddenName;
        this.achievement = data.achievement || this.achievement;
        this.projectileName = data.projectileName || this.projectileName;
        this.roamDistance = data.roamDistance || this.roamDistance;
        this.healRate = data.healRate || this.healRate;
        this.roaming = data.roaming === undefined ? this.roaming : data.roaming;

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
                new HealPacket({
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
        this.setPosition(this.spawnX, this.spawnY, false);
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
     * @param player The leading player who dealt the most damage.
     */

    public drop(player: Player): void {
        let drops = this.getDrops(player);

        // No drops were calculated, so we stop here.
        if (drops.length === 0) return;

        // If it's a single drop, drop only the item.
        if (drops.length === 1) {
            this.world.entities.spawnItem(
                drops[0].key,
                this.x,
                this.y,
                true,
                drops[0].count,
                {},
                player.username
            );
            return;
        }

        /**
         * If we have more than two items in our drops list, then we must
         * create a lootbag. First we turn all the ItemDrop types into actual
         * item objects, we add those items to the lootbag alongside with spawning it.
         */

        let items: Item[] = [];

        // Create the item objects from the ItemDrop types.
        for (let drop of drops) items.push(new Item(drop.key, -1, -1, false, drop.count));

        // Spawn the loot bag.
        this.world.entities.spawnLootBag(this.x, this.y, player.username, items);
    }

    /**
     * Override for the teleport functionality with added support for stopping
     * all additional packets from being sent to the regions.
     * @param x The x grid coordinate.
     * @param y The y grid coordinate.
     * @param withAnimation Whether or not to teleport with an animation.
     */

    public override teleport(x: number, y: number, withAnimation = false): void {
        this.setPosition(x, y, false);

        this.teleporting = true;

        this.sendToRegions(
            new TeleportPacket({
                instance: this.instance,
                x,
                y,
                withAnimation
            })
        );

        // Untoggle the teleporting flag after 500ms.
        setTimeout(() => (this.teleporting = false), 500);
    }

    /**
     * Moves the mob and broadcasts the action
     * to all the adjacent regions.
     * @param x The new x position of the mob.
     * @param y The new y position of the mob.
     * @param withPacket Whether or not to send the movement packet.
     */

    public override setPosition(x: number, y: number, withPacket = true): void {
        if (this.teleporting) return;

        super.setPosition(x, y);

        this.calculateOrientation();

        if (withPacket)
            this.world.push(Modules.PacketType.Regions, {
                region: this.region,
                packet: new MovementPacket(Opcodes.Movement.Move, {
                    instance: this.instance,
                    x,
                    y
                })
            });

        this.lastMovement = Date.now();
    }

    /**
     * The drop function works by picking a random item from the mob's personal
     * drop list. We randomly select an item and roll its chance against the overall
     * drop chance. We add the item to the list if the roll is successful. We continue
     * by looking through the mob's drop tables and doing the same thing. We then
     * return the list of items that the mob will drop.
     * @param player Theplayer entity that we use to determine what drops we can use.
     * @returns A list of items that the mob will drop.
     */

    public getDrops(player: Player): ItemDrop[] {
        let drops: ItemDrop[] = [], // The items that the mob will drop
            randomItem = this.getRandomItem(this.drops);

        // Add a random item from the mob's personal list of drops.
        if (randomItem) drops.push(randomItem);

        // Add items from the mob's drop table.
        drops = [...drops, ...this.getDropTableItems(player)];

        return drops;
    }

    /**
     * Looks through the drop tables of the mob and iterates through those to get items.
     * @param player The player entity that killed the mob. Used for determining whether or
     * not we can use the drop table.
     * @returns List of items from the drop table.
     */

    private getDropTableItems(player: Player): ItemDrop[] {
        let drops: ItemDrop[] = [];

        for (let key of Object.values(this.dropTables)) {
            let table: MobDropTable = dropTables[key as keyof typeof dropTables]; // Pick the table from the list of drop tables.

            // Player doesn't have the achievement for the drop table completed.
            if (table.achievement && !player.achievements.get(table.achievement)?.isFinished())
                continue;

            // Player doesn't have the quest completed to have access to the drop table.
            if (table.quest && !player.quests.get(table.quest)?.isFinished()) continue;

            // Something went wrong.
            if (table) {
                let randomItem = this.getRandomItem(table.drops);

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

    private getRandomItem(items: MobDrop[]): ItemDrop | undefined {
        // No items to pick from.
        if (items.length === 0) return undefined;

        let drop = items[Utils.randomInt(0, items.length - 1)],
            count = drop.count || 1; // 1 if not specified.

        switch (drop.key) {
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

            case 'feather': {
                count = Utils.randomInt(1, this.level);
                break;
            }
        }

        // Something went wrong when trying to get the item drop.
        if (!drop) {
            log.warning(`Mob ${this.key} has an invalid drop.`);
            return undefined;
        }

        let probability = this.world.getDropProbability();

        // If the chance is greater than the drop probability, we adjust the drop
        if (drop.chance > probability) drop.chance = probability;

        return Utils.randomInt(0, probability) < drop.chance ? { key: drop.key, count } : undefined;
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
        if (!player.ready) return false;

        // Prevent aggro if we already have a target.
        if (this.target) {
            // However, for bosses, we want to add the player to the list of attackers.
            if (this.boss) this.addAttacker(player);

            return false;
        }

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

        this.setPosition(this.spawnX, this.spawnY);
    }

    /**
     * Checks if the distance between the mob's current position and the spawn
     * point is greater than the roam distance.
     * @param x Optional parameter to specify custom x coordinate. We use this if provided.
     * @param y Optional parameter to specify custom y coordinate.
     * @param distance Optional parameter to specify custom distance (used for combat).
     * @returns Whether or not the mob should return to the spawn.
     */

    public outsideRoaming(x?: number, y?: number, distance = this.roamDistance): boolean {
        return Utils.getDistance(x || this.x, y || this.y, this.spawnX, this.spawnY) > distance;
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
     * We restrict how many times a mob can change targets in a short period of time.
     * @returns Whether or not the last target change was more than 13 seconds ago.
     */

    public canChangeTarget(): boolean {
        return Date.now() - this.lastChangedTarget > 13_000;
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
        return this.skills.accuracy;
    }

    /**
     * Implementation for strength level. In the case of mobs, we just
     * use their attack level to calculate their damage output.
     * @returns The mob's attack level.
     */

    public override getStrengthLevel(): number {
        return this.skills.strength;
    }

    /**
     * Implementation for archery level. In the case of mobs, we just
     * use their attack level to calculate their damage output.
     * @returns The mob's archery level.
     */

    public override getArcheryLevel(): number {
        return this.skills.archery;
    }

    /**
     * Subclass implementation for grabbing the defense level. For a mob
     * the defense level is specified in the mob data object.
     * @returns The defense level of the mob.
     */

    public override getDefenseLevel(): number {
        return this.skills.defense;
    }

    /**
     * Subclass implementation for damage type. Special mobs may have a freezing,
     * burning or other damage types that apply a special effect on the target.
     * @returns The damage type of the mob.
     */

    public override getDamageType(): Modules.Hits {
        if (this.freezing && Formulas.getEffectChance()) return Modules.Hits.Freezing;
        if (this.burning && Formulas.getEffectChance()) return Modules.Hits.Burning;

        return this.damageType;
    }

    /**
     * Checks whether the mob has a magic attack in its attack stats and whether
     * it is using projectile based attacks.
     * @return Whether or not the mob is a magic projectile based entity.
     */

    public override isMagic(): boolean {
        return this.isRanged() && this.attackStats.magic > 0;
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
