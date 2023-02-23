import mobData from '../../data/mobs.json';
import itemData from '../../data/items.json';
import npcData from '../../data/npcs.json';
import NPC from '../game/entity/npc/npc';
import Item from '../game/entity/objects/item';
import Chest from '../game/entity/objects/chest';
import Mob from '../game/entity/character/mob/mob';
import Character from '../game/entity/character/character';
import Projectile from '../game/entity/objects/projectile';
import { Blink, Despawn } from '../network/packets';

import log from '@kaetram/common/util/log';
import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';
import type Hit from '../game/entity/character/combat/hit';
import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type Map from '../game/map/map';
import type World from '../game/world';
import type Pet from '../game/entity/character/pet/pet';
import type Regions from '../game/map/regions';
import type Grids from '../game/map/grids';

export default class Entities {
    private map: Map;
    private regions: Regions;
    private grids: Grids;

    // Stores all the entities in the world.
    private entities: { [instance: string]: Entity } = {};

    public players: { [instance: string]: Player } = {};
    private items: { [instance: string]: Item } = {};
    private mobs: { [instance: string]: Mob } = {};
    private chests: { [instance: string]: Chest } = {};
    private npcs: { [instance: string]: NPC } = {};
    private pets: { [instance: string]: Pet } = {};

    public constructor(private world: World) {
        this.map = world.map;
        this.regions = this.world.map.regions;
        this.grids = this.world.map.grids;

        this.load();
    }

    /**
     * Looks through all the static entities in the map and spawns
     * them according to their type. Next, we load up all the chests
     * in the world.
     */

    private load(): void {
        this.map.forEachEntity((position: Position, key: string) => {
            let type = this.getEntityType(key);

            switch (type) {
                case Modules.EntityType.Item: {
                    return this.spawnItem(key, position.x, position.y, false);
                }

                case Modules.EntityType.NPC: {
                    return this.spawnNPC(key, position.x, position.y);
                }

                case Modules.EntityType.Mob: {
                    return this.spawnMob(key, position.x, position.y);
                }
            }
        });

        log.info(`Spawned ${Object.keys(this.entities).length} entities!`);

        // Spawns the static chests throughout the world.

        for (let info of this.map.chest)
            this.spawnChest(
                info.items?.split(',') || [],
                info.x,
                info.y,
                true,
                info.achievement,
                info.mimic
            );

        log.info(`Spawned ${Object.keys(this.chests).length} static chests!`);

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
    ): void {
        this.addItem(new Item(key, x, y, dropped, count, enchantments, owner));
    }

    /**
     * Spawns a mob and adds it to the world. Similarly to `spawnItem` this
     * function is used to easily spawn mobs from external means.
     * @param key The key of the mub, used to determine its sprite.
     * @param x The x grid coordinate of the mob spawn.
     * @param y The y grid coordinate of the mob spawn.
     * @param plugin Whether or not to use a plugin with the mob's key.
     * @returns The mob object we just created.
     */

    public spawnMob(key: string, x: number, y: number, plugin = false): Mob {
        let mob = new Mob(this.world, key, x, y, plugin);

        this.addMob(mob);

        return mob;
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
        let chest = new Chest(x, y, achievement, mimic, items);

        // Static chests respawn after a certain amount of time.
        if (isStatic) {
            chest.static = isStatic;
            chest.onRespawn(() => this.add(chest));
        }

        chest.onOpen((player?: Player) => {
            this.remove(chest);

            // We use the player's world instance to spawn mimic mob.
            if (player && mimic) {
                let mimic = this.spawnMob('mimic', chest.x, chest.y);

                // Mimic's death respawns the chest. We also ensure mimic doesn't respawn.
                if (mimic) {
                    mimic.respawnable = false;
                    mimic.chest = chest;
                }
            }

            // Spawn chest items if there are any.
            let item = chest.getItem();

            if (!item) return;

            this.spawnItem(item.key, chest.x, chest.y, true, item.count);

            // Reward the player with an achievement if they have one.
            if (player && chest.achievement) player.achievements.get(chest.achievement)?.finish();
        });

        this.addChest(chest);

        return chest;
    }

    /**
     * Shorcut for creating a new NPC instance and adding it to the world.
     * @param key The key of the NPC we are creating (for sprite and identification).
     * @param x The x grid coordinate of the NPC spawn.
     * @param y THe y grid coordinate of the NPC spawn.
     */

    private spawnNPC(key: string, x: number, y: number): void {
        this.addNPC(new NPC(key, x, y));
    }

    /**
     * Creates a projectile and adds it to the world. Projectiles are despawned
     * server-sided after a calculated amount of time that would take
     * them to reach their target.
     * @param owner The owner of the projectile, used to grab the projectile sprite.
     * @param target The target the projectile goes after.
     * @param hit Information about the hit type.
     * @returns The projectile object that was created.
     */

    public spawnProjectile(owner: Character, target: Character, hit: Hit): Projectile {
        let projectile = new Projectile(owner, target, hit);

        // Remove on impact
        projectile.onImpact(() => this.remove(projectile));

        this.add(projectile);

        return projectile;
    }

    /**
     * Registers an entity within the world. This is used to keep track
     * of all the entities in a single dictionary. This may contain every
     * type of entity, including players, mobs, and items, etc.
     * @param entity The entity we are adding to the world.
     */

    private add(entity: Entity): void {
        if (entity.instance in this.entities)
            log.warning(`Entity ${entity.instance} already exists.`);

        this.entities[entity.instance] = entity;

        // Do not have the projectiles be parsed as part of the region.
        if (entity.isProjectile()) return;

        this.regions.handle(entity);

        this.grids.addToEntityGrid(entity);
    }

    /**
     * Adds the newly created player instance to our list of players.
     * @param player Player we are adding to our dictionary.
     */

    public addPlayer(player: Player): void {
        this.add(player);

        this.players[player.instance] = player;
    }

    /**
     * Adds an item to our list of items and entities, then creates
     * the necessary callbacks for despawning said item (and respawning
     * if applicable).
     * @param item The item object we are adding to the world.
     */

    private addItem(item: Item): void {
        // Callback for removing the item from the world.
        item.onDespawn(() => this.removeItem(item));

        // Dropped items have a callback for their despawn.
        if (item.dropped) {
            item.despawn();

            // Blinking timeout before the item despawns.
            item.onBlink(() =>
                this.world.push(Modules.PacketType.Broadcast, {
                    packet: new Blink(item.instance)
                })
            );
        } else item.onRespawn(() => this.addItem(item));

        this.add(item);

        this.items[item.instance] = item;
    }

    /**
     * Adds the mob instance to its dictionary and its
     * chest area if existent.
     * @param mob Mob instance we are adding.
     */

    public addMob(mob: Mob): void {
        this.add(mob);

        this.mobs[mob.instance] = mob;

        mob.addToChestArea(this.map.getChestAreas());
    }

    /**
     * Creates an entry in the entity dictionary and the chest one.
     * @param chest The chest object we are adding to the world.
     */

    private addChest(chest: Chest): void {
        this.add(chest);

        this.chests[chest.instance] = chest;
    }

    /**
     * Adds an NPC object to the world entity dictionary and its
     * own dictionary.
     * @param npc The NPC object we are adding to the world.
     */

    private addNPC(npc: NPC): void {
        this.add(npc);

        this.npcs[npc.instance] = npc;
    }

    /**
     * Adds a pet object to the world entity dictionary and its
     * own dictionary.
     * @param pet The pet object we are adding to the world.
     */

    private addPet(pet: Pet): void {
        this.add(pet);

        this.pets[pet.instance] = pet;
    }

    /**
     * Removes the entity from the entity dictionary and sends a despawn
     * callback to the nearby regions the entity is in.
     */

    public remove(entity: Entity): void {
        // Signal to nearby regions that the entity has been removed.
        this.world.push(Modules.PacketType.Regions, {
            region: entity.region,
            packet: new Despawn({
                instance: entity.instance
            })
        });

        // Remove the entity from the entity grid
        this.grids.removeFromEntityGrid(entity);

        // Remove the entity from the region it is in.
        this.regions.remove(entity);

        delete this.entities[entity.instance];

        // Clean combat when removing a player.
        if (entity.isPlayer()) this.world.cleanCombat(entity as Character);
    }

    /**
     * Removes the player and clears out its packets and instance.
     * @param player Player we are removing.
     */

    public removePlayer(player: Player): void {
        this.remove(player);

        delete this.players[player.instance];

        this.world.network.deletePacketQueue(player);
    }

    /**
     * Removes a chest or respawns it if it's a statically
     * spawned chest.
     * @param chest Chest we are removing.
     */

    public removeChest(chest: Chest): void {
        this.remove(chest);

        if (chest.mimic || !chest.static) delete this.chests[chest.instance];
        else chest.respawn();
    }

    /**
     * Removes an item from the items dictionary and only
     * respawns it if it's a statically spawned item.
     * @param item Item we are removing.
     */

    public removeItem(item: Item): void {
        this.remove(item);

        // Dropped items are removed permanently, static ones respawn.
        if (item.dropped) delete this.items[item.instance];
        else item.respawn();
    }

    /**
     * Removes the mob from all the entities and the mobs dictionary.
     * @param mob The mob object that we are removing.
     */

    public removeMob(mob: Mob): void {
        this.remove(mob);

        delete this.mobs[mob.instance];
    }

    /**
     * Removes a pet object from the world and its dictionary.
     * @param pet The pet object we are removing.
     */

    public removePet(pet: Pet): void {
        this.remove(pet);

        delete this.pets[pet.instance];
    }

    /**
     * Getters
     */

    /**
     * Grabs an entity from our dictionary of entities.
     * @param instance The instance of the entity we want.
     * @returns Returns an entity or undefined.
     */

    public get(instance: string): Entity {
        return this.entities[instance];
    }

    /**
     * Finds a player based on their username.
     * @param username The username of the player to find.
     * @returns A playerobject if found, otherwise undefined.
     */

    public getPlayer(username: string): Player | undefined {
        return Object.values(this.players).find((player: Player) => {
            return player.username.toLowerCase() === username.toLowerCase();
        });
    }

    /**
     * Maps all the players in the world to an array of usernames.
     * @returns A string array of all usernames.
     */

    public getPlayerUsernames(): string[] {
        return Object.values(this.players).map((player: Player) => player.username);
    }

    /**
     * Looks for the string of the entity in all the data files
     * and returns the type of entity it is.
     * @param key The string key of the entity we are determining.
     * @returns Entity type id from Modules.
     */

    private getEntityType(key: string): number {
        if (key in itemData) return Modules.EntityType.Item;
        if (key in npcData) return Modules.EntityType.NPC;
        if (key in mobData) return Modules.EntityType.Mob;

        return -1;
    }

    /**
     * Callback pointer for the entity iterator in the the `allEntities.`
     * @param callback An entity that is being iterated.
     */

    public forEachEntity(callback: (entity: Entity) => void): void {
        for (let entity of Object.values(this.entities)) callback(entity);
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
        for (let mob of Object.values(this.mobs)) callback(mob);
    }

    /**
     * Iterates through each player in the players collection.
     * @param callback A player instance.
     */

    public forEachPlayer(callback: (player: Player) => void): void {
        for (let player of Object.values(this.players)) callback(player);
    }
}
