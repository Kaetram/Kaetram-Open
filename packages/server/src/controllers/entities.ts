import _ from 'lodash';

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
import Formulas from '../info/formulas';

import mobData from '../../data/mobs.json';
import itemData from '../../data/items.json';
import npcData from '../../data/npcs.json';

import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type World from '../game/world';
import { Blink, Despawn } from '../network/packets';
import Grids from '../game/map/grids';
import Hit from '../game/entity/character/combat/hit';

export default class Entities {
    private map: Map;
    private regions: Regions;
    private grids: Grids;

    public players: { [instance: string]: Player } = {};
    private entities: { [instance: string]: Entity } = {};
    private items: { [instance: string]: Item } = {};
    private mobs: { [instance: string]: Mob } = {};
    private chests: { [instance: string]: Chest } = {};
    private npcs: { [instance: string]: NPC } = {};
    private projectiles: { [instance: string]: Projectile } = {};

    public constructor(private world: World) {
        this.map = world.map;
        this.regions = world.map.regions;
        this.grids = world.map.grids;

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
                    return this.spawnItem(key, position.x, position.y, false);

                case Modules.EntityType.NPC:
                    return this.addNPC(new NPC(key, position.x, position.y));

                case Modules.EntityType.Mob:
                    return this.addMob(new Mob(this.world, key, position.x, position.y));
            }
        });

        log.info(`Spawned ${Object.keys(this.entities).length} entities!`);

        // Spawns the static chests throughout the world.

        //TODO - Redo chests
        // _.each(this.map.chests, (info) => {
        //     this.spawnChest(info.items!.split(','), info.x, info.y, true, info.achievement);
        // });

        log.info(`Spawned ${Object.keys(this.chests).length} static chests!`);
    }

    public spawnMob(key: string, x: number, y: number): Mob {
        let mob = new Mob(this.world, key, x, y);

        this.addMob(mob);

        return mob;
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
    ): void {
        this.addItem(new Item(key, x, y, dropped, count, ability, abilityLevel));
    }

    public spawnChest(
        items: string[],
        x: number,
        y: number,
        isStatic = false,
        achievement?: number
    ): Chest {
        let chest = new Chest(x, y, achievement);

        chest.addItems(items);

        if (isStatic) {
            chest.static = isStatic;

            chest.onRespawn(() => this.addChest(chest));
        }

        chest.onOpen((player?: Player) => {
            this.removeChest(chest);

            let item = chest.getItem();

            if (!item) return;

            this.spawnItem(item.string, chest.x, chest.y, true, item.count);

            if (player && chest.achievement) player.finishAchievement(chest.achievement);
        });

        this.addChest(chest);

        return chest;
    }

    /**
     * Creates a projectile and adds it to the world.
     * @param owner The owner of the projectile, used to grab the projectile sprite.
     * @param target The target the projectile goes after.
     * @param hit Information about the hit type.
     * @returns The projectile object that was created.
     */

    public spawnProjectile(owner: Character, target: Character, hit: Hit): Projectile {
        let projectile = new Projectile(owner, target, hit);

        this.addProjectile(projectile);

        return projectile;
    }

    /**
     * Adds an entity to the list of entities. Whether it be a mob, player
     * npc, item, chest, etc. we keep track of them in the list of entities.
     */

    private add(entity: Entity): void {
        if (entity.instance in this.entities)
            log.warning(`Entity ${entity.instance} already exists.`);

        this.entities[entity.instance] = entity;

        this.regions.handle(entity);

        this.grids.addToEntityGrid(entity, entity.x, entity.y);
    }

    /**
     * Removes the entity from the entity dictionary and sends a despawn
     * callback to the nearby regions the entity is in.
     */

    public remove(entity: Entity): void {
        this.world.push(Modules.PacketType.Regions, {
            region: entity.region,
            packet: new Despawn(entity.instance)
        });

        // Remove the entity from the entity grid
        this.grids.removeFromEntityGrid(entity, entity.x, entity.y);

        // Remove the entity from the region it is in.
        this.regions.remove(entity);

        delete this.entities[entity.instance];

        if (entity.isPlayer()) this.world.cleanCombat(entity as Character);
    }

    /**
     * Adds the NPC to our dictionary of NPCs.
     * @param npc NPC we are adding.
     */

    private addNPC(npc: NPC): void {
        this.add(npc);

        this.npcs[npc.instance] = npc;
    }

    /**
     * Adds the item to our dictionary of items.
     * @param item Item we are adding.
     */

    private addItem(item: Item): void {
        // Not the prettiest way of doing it honestly...
        item.onDespawn(() => this.removeItem(item));

        if (item.dropped) {
            item.despawn();
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
     * Adds the newly created player instance to our list of players.
     * @param player Player we are adding to our dictionary.
     */

    public addPlayer(player: Player): void {
        this.add(player);

        this.players[player.instance] = player;
    }

    /**
     * Creates a chest and adds it to its dictionary.
     * @param chest Chest we are adding to our dictionary.
     */

    private addChest(chest: Chest): void {
        this.add(chest);

        this.chests[chest.instance] = chest;
    }

    /**
     * Creates a projectile and adds it to its dictionary.
     * @param projectile Projectile we are adding to our dictionary.
     */

    private addProjectile(projectile: Projectile): void {
        this.add(projectile);

        this.projectiles[projectile.instance] = projectile;
    }

    /**
     * Removes an item from the items dictionary and only
     * respawns it if it's a statically spawned item.
     * @param item Item we are removing.
     */

    public removeItem(item: Item): void {
        this.remove(item);

        if (!item.dropped) item.respawn();
        else delete this.items[item.instance];
    }

    /**
     * Removes the mob from our mob dictionary.
     * @param mob Mob we are removing.
     */

    public removeMob(mob: Mob): void {
        this.remove(mob);

        delete this.mobs[mob.instance];
    }

    /**
     * Removes the player and clears out its packets and instance.
     * @param player Player we are removing.
     */

    public removePlayer(player: Player): void {
        if (player.ready) player.save();

        this.remove(player);

        delete this.players[player.instance];

        this.world.network.deletePacketQueue(player);

        // Unsure about this since garbage collector should handle it.
        player.destroy();
    }

    /**
     * Removes a chest or respawns it if it's a statically
     * spawned chest.
     * @param chest Chest we are removing.
     */

    public removeChest(chest: Chest): void {
        this.remove(chest);

        if (chest.static) chest.respawn();
        else delete this.chests[chest.instance];
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
        return _.find(this.players, (player: Player) => {
            return player.username.toLowerCase() === username.toLowerCase();
        });
    }

    /**
     * Takes all the players in the world and returns their
     * usernames in a string array.
     * @returns A string array of all usernames.
     */

    public getPlayerUsernames(): string[] {
        return _.map(this.players, (player: Player) => player.username);
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
        _.each(this.entities, callback);
    }

    public forEachPlayer(callback: (player: Player) => void): void {
        _.each(this.players, callback);
    }
}
