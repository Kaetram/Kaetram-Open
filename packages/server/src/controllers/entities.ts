import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Regions from '../game/map/regions';
import Map from '../game/map/map';
import Character from '../game/entity/character/character';
import Mob from '../game/entity/character/mob/mob';
import NPC from '../game/entity/npc/npc';
import Chest from '../game/entity/objects/chest';
import Item from '../game/entity/objects/item';
import Projectile from '../game/entity/objects/projectile';

import mobData from '../../data/mobs.json';
import itemData from '../../data/items.json';
import npcData from '../../data/npcs.json';

import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type World from '../game/world';
import Grids from '../game/map/grids';
import Hit from '../game/entity/character/combat/hit';
import PlayerCollection from '@kaetram/server/src/game/entity/collection/players';
import ItemCollection from '@kaetram/server/src/game/entity/collection/items';
import MobCollection from '@kaetram/server/src/game/entity/collection/mobs';
import ChestCollection from '@kaetram/server/src/game/entity/collection/chests';
import NpcCollection from '@kaetram/server/src/game/entity/collection/npcs';
import ProjectileCollection from '@kaetram/server/src/game/entity/collection/projectiles';
import AllCollection from '@kaetram/server/src/game/entity/collection/all';

export default class Entities {
    public static readonly PLAYERS = 'PLAYERS';
    public static readonly ITEMS = 'ITEMS';
    public static readonly MOBS = 'MOBS';
    public static readonly CHESTS = 'CHESTS';
    public static readonly NPCS = 'NPCS';
    public static readonly PROJECTILES = 'PROJECTILES';

    private map: Map;
    private regions: Regions;
    private grids: Grids;

    private readonly allEntities: AllCollection;
    private readonly players: PlayerCollection;
    private readonly items: ItemCollection;
    private readonly mobs: MobCollection;
    private readonly chests: ChestCollection;
    private readonly npcs: NpcCollection;
    private readonly projectiles: ProjectileCollection;

    public constructor(private world: World) {
        this.allEntities = new AllCollection(this.world);
        this.map = world.map;
        this.regions = world.map.regions;
        this.grids = world.map.grids;

        /**
         * Initializes the different data structures such as entity collections.
         */
        this.players = new PlayerCollection(this.world, this.allEntities);
        this.items = new ItemCollection(this.world, this.allEntities);
        this.mobs = new MobCollection(this.world, this.allEntities);
        this.chests = new ChestCollection(this.world, this.allEntities, this.items);
        this.npcs = new NpcCollection(this.world, this.allEntities);
        this.projectiles = new ProjectileCollection(this.world, this.allEntities);

        this.load();
    }

    /**
     * Parse through all the statically spawned entities in the map
     * and create them based on their type.
     */
    private load(): void {
        this.map.forEachEntity((position: Position, key: string) => {
            let type = this.getEntityType(key);

            switch (type) {
                case Modules.EntityType.Item:
                    return this.items.spawn({
                        key,
                        x: position.x,
                        y: position.y,
                        dropped: false
                    });

                case Modules.EntityType.NPC:
                    return this.npcs.add(new NPC(key, position.x, position.y));

                case Modules.EntityType.Mob:
                    return this.mobs.add(new Mob(this.world, key, position.x, position.y));
            }
        });

        log.info(`Spawned ${this.allEntities.length} entities!`);

        // Spawns the static chests throughout the world.

        //TODO - Redo chests
        // _.each(this.map.chests, (info) => {
        //     this.spawnChest(info.items!.split(','), info.x, info.y, true, info.achievement);
        // });

        log.info(`Spawned ${this.chests.length} static chests!`);
    }

    public spawnMob(key: string, x: number, y: number): Mob {
        return <Mob>this.mobs.spawn({
            world: this.world,
            key,
            x,
            y
        });
    }

    /**
     * Removes the mob from our mob dictionary.
     * @param mob Mob we are removing.
     */
    public removeMob(mob: Mob): void {
        this.mobs.remove(mob);
    }

    /**
     * Adds the mob instance to its dictionary and its
     * chest area if existent.
     * @param mob Mob instance we are adding.
     */
    public addMob(mob: Mob): void {
        this.mobs.add(mob);
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
     * @param ability The ability type of the item.
     * @param abilityLevel The ability level of the item.
     */
    public spawnItem(
        key: string,
        x: number,
        y: number,
        dropped = false,
        count = 1,
        ability = -1,
        abilityLevel = -1
    ): Item {
        return <Item>this.items.spawn({
            key,
            x,
            y,
            dropped,
            count,
            ability,
            abilityLevel
        });
    }

    /**
     * Removes an item from the items dictionary and only
     * respawns it if it's a statically spawned item.
     * @param item Item we are removing.
     */
    public removeItem(item: Item): void {
        this.items.remove(item);
    }

    public spawnChest(
        items: string[],
        x: number,
        y: number,
        isStatic = false,
        achievement?: number
    ): Chest {
        return <Chest>this.chests.spawn({ items, x, y, isStatic, achievement });
    }

    /**
     * Removes a chest or respawns it if it's a statically
     * spawned chest.
     * @param chest Chest we are removing.
     */

    public removeChest(chest: Chest): void {
        this.chests.remove(chest);
    }

    /**
     * Creates a projectile and adds it to the world.
     * @param owner The owner of the projectile, used to grab the projectile sprite.
     * @param target The target the projectile goes after.
     * @param hit Information about the hit type.
     * @returns The projectile object that was created.
     */
    public spawnProjectile(owner: Character, target: Character, hit: Hit): Projectile {
        return <Projectile>this.projectiles.spawn({ owner, target, hit });
    }

    /**
     * Adds the newly created player instance to our list of players.
     * @param player Player we are adding to our dictionary.
     */
    public addPlayer(player: Player): void {
        this.players.add(player);
    }

    /**
     * Removes the player and clears out its packets and instance.
     * @param player Player we are removing.
     */
    public removePlayer(player: Player): void {
        this.players.remove(player);
    }

    /**
     * Removes the entity from the entity dictionary and sends a despawn
     * callback to the nearby regions the entity is in.
     */
    public remove(entity: Entity): void {
        this.allEntities.remove(entity);
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
        return this.players.getAll();
    }

    /**
     * Grabs an entity from our dictionary of entities.
     * @param instance The instance of the entity we want.
     * @returns Returns an entity or undefined.
     */
    public get(instance: string): Entity {
        return this.allEntities.get(instance);
    }

    /**
     * Finds a player based on their username.
     * @param username The username of the player to find.
     * @returns A playerobject if found, otherwise undefined.
     */

    public getPlayer(username: string): Player | undefined {
        return this.players.get(username);
    }

    /**
     * Takes all the players in the world and returns their
     * usernames in a string array.
     * @returns A string array of all usernames.
     */

    public getPlayerUsernames(): string[] {
        return this.players.getUsernames();
    }

    /**
     * Compares the string against npcs and mobs to find the entity type.
     * @param entityString The string of the entity
     * @returns Entity type id from Modules.
     */

    private getEntityType(entityString: string): number {
        if (entityString in itemData) return Modules.EntityType.Item;
        if (entityString in npcData) return Modules.EntityType.NPC;
        if (entityString in mobData) return Modules.EntityType.Mob;

        return -1;
    }

    public forEachEntity(callback: (entity: Entity) => void): void {
        this.allEntities.forEachEntity(callback);
    }

    public forEachPlayer(callback: (player: Player) => void): void {
        this.players.forEachEntity(callback);
    }
}
