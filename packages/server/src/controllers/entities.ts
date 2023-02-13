import Character from '../game/entity/character/character';

import log from '@kaetram/common/util/log';
import Collections from '@kaetram/server/src/game/entity/collection/collections';
import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';
import type { ProcessedArea } from '@kaetram/common/types/map';
import type Hit from '../game/entity/character/combat/hit';
import type Mob from '../game/entity/character/mob/mob';
import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type Chest from '../game/entity/objects/chest';
import type Item from '../game/entity/objects/item';
import type Projectile from '../game/entity/objects/projectile';
import type Map from '../game/map/map';
import type World from '../game/world';

export default class Entities {
    private map: Map;

    public readonly collections: Collections;

    public constructor(private world: World) {
        this.map = world.map;

        this.collections = new Collections(this.world);

        this.load();
    }

    /**
     * Parse through all the statically spawned entities in the map
     * and create them based on their type.
     */

    private load(): void {
        this.map.forEachEntity((position: Position, key: string) => {
            this.collections.forEachCollection((collection) => {
                collection.tryLoad(position, key);
            });
        });

        log.info(`Spawned ${this.collections.allEntities.length} entities!`);

        // Spawns the static chests throughout the world.

        _.each(this.map.chest, (info: ProcessedArea) => {
            this.spawnChest(
                info.items?.split(',') || [],
                info.x,
                info.y,
                true,
                info.achievement,
                info.mimic
            );
        });

        log.info(`Spawned ${this.collections.chests.length} static chests!`);

        // Initialize the roaming interval for mobs
        setInterval(
            () => this.forEachMob((mob) => mob.roamingCallback?.()),
            Modules.MobDefaults.ROAM_FREQUENCY
        );
    }

    /**
     * Spawning function for creating an item. Primary purpose of this is
     * to lessen the amount of code necessary should we try to spawn
     * an item from external means.
     * @param key The item key
     * @param x The x position in the grid to spawn the item.
     * @param y The y position in the grid to spawn the item.
     * @param dropped If the item is permanent or it will disappear.
     * @param count The amount of the item dropped.
     * @param enchantments The enchantments applied to the item.
     */

    public spawnItem(
        key: string,
        x: number,
        y: number,
        dropped = false,
        count = -1,
        enchantments: Enchantments = {},
        owner = ''
    ): Item {
        return this.collections.items.spawn({
            key,
            x,
            y,
            dropped,
            count,
            enchantments,
            owner
        })!;
    }

    public spawnMob(key: string, x: number, y: number, plugin = false): Mob {
        return this.collections.mobs.spawn({
            world: this.world,
            key,
            x,
            y,
            plugin
        })!;
    }

    /**
     * Spawns a chest in the world at the given position.
     * @param items The items that the chest might drop.
     * @param x The x grid coordinate of the chest spawn.
     * @param y The y grid coordinate of the chest spawn.
     * @param isStatic If the chest respawns when it is opened.
     * @param achievement Achievement ID that the chest is tied to.
     * @returns The chest object we just created.
     */

    public spawnChest(
        items: string[],
        x: number,
        y: number,
        isStatic = false,
        achievement?: string,
        mimic = false
    ): Chest {
        return this.collections.chests.spawn({ items, x, y, isStatic, achievement, mimic })!;
    }

    /**
     * Creates a projectile and adds it to the world.
     * @param owner The owner of the projectile, used to grab the projectile sprite.
     * @param target The target the projectile goes after.
     * @param hit Information about the hit type.
     * @returns The projectile object that was created.
     */

    public spawnProjectile(owner: Character, target: Character, hit: Hit): Projectile {
        let projectile = this.collections.projectiles.spawn({ owner, target, hit })!;

        // Remove on impact
        projectile.onImpact(() => this.removeProjectile(projectile));

        return projectile;
    }

    /**
     * Adds the newly created player instance to our list of players.
     * @param player Player we are adding to our dictionary.
     */

    public addPlayer(player: Player): void {
        this.collections.players.add(player);
    }

    /**
     * Adds the mob instance to its dictionary and its
     * chest area if existent.
     * @param mob Mob instance we are adding.
     */

    public addMob(mob: Mob): void {
        this.collections.mobs.add(mob);
    }

    /**
     * Removes the entity from the entity dictionary and sends a despawn
     * callback to the nearby regions the entity is in.
     */

    public remove(entity: Entity): void {
        this.collections.allEntities.remove(entity);
    }

    /**
     * Removes the player and clears out its packets and instance.
     * @param player Player we are removing.
     */

    public removePlayer(player: Player): void {
        this.collections.players.remove(player);
    }

    /**
     * Removes a chest or respawns it if it's a statically
     * spawned chest.
     * @param chest Chest we are removing.
     */

    public removeChest(chest: Chest): void {
        this.collections.chests.remove(chest);
    }

    /**
     * Removes an item from the items dictionary and only
     * respawns it if it's a statically spawned item.
     * @param item Item we are removing.
     */

    public removeItem(item: Item): void {
        this.collections.items.remove(item);
    }

    /**
     * Removes the mob from our mob dictionary.
     * @param mob Mob we are removing.
     */

    public removeMob(mob: Mob): void {
        this.collections.mobs.remove(mob);
    }

    /**
     * Removes the projectile from our entity and projectile dictionary.
     * @param projectile The projectile we are removing.
     */

    public removeProjectile(projectile: Projectile): void {
        this.collections.projectiles.remove(projectile);
    }

    /**
     * Getters
     */

    /**
     * Returns an copy of the list of Player entity objects.
     * Changes to this list will not affect the list inside the collection
     * @return players List of player entities
     */

    public get listOfPlayers(): { [instance: string]: Player } {
        return this.collections.players.getAll();
    }

    /**
     * Grabs an entity from our dictionary of entities.
     * @param instance The instance of the entity we want.
     * @returns Returns an entity or undefined.
     */

    public get(instance: string): Entity {
        return this.collections.allEntities.get(instance);
    }

    /**
     * Finds a player based on their username.
     * @param username The username of the player to find.
     * @returns A playerobject if found, otherwise undefined.
     */

    public getPlayer(username: string): Player | undefined {
        return this.collections.players.get(username) as Player;
    }

    /**
     * Takes all the players in the world and returns their
     * usernames in a string array.
     * @returns A string array of all usernames.
     */

    public getPlayerUsernames(): string[] {
        return this.collections.players.getUsernames();
    }

    /**
     * Callback pointer for the entity iterator in the the `allEntities.`
     * @param callback An entity that is being iterated.
     */

    public forEachEntity(callback: (entity: Entity) => void): void {
        this.collections.allEntities.forEachEntity(callback);
    }

    /**
     * Callback that iterates through all the entities and only
     * selects those that are instances of Character.
     * @param callback Returns a character type (mob or player for now).
     */

    public forEachCharacter(callback: (character: Character) => void): void {
        this.forEachEntity((entity: Entity) => {
            if (entity instanceof Character) callback(entity);
        });
    }

    /**
     * Iterates through all the entities and only selects those that are
     * instances of Mob.
     * @param callback The mob object we are iterating through.
     */

    public forEachMob(callback: (mob: Mob) => void): void {
        this.collections.mobs.forEachEntity(callback);
    }

    /**
     * Iterates through each player in the players collection.
     * @param callback A player instance.
     */

    public forEachPlayer(callback: (player: Player) => void): void {
        this.collections.players.forEachEntity(callback);
    }
}
