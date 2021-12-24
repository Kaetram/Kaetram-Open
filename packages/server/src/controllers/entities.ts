import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Regions from '../game/map/regions';
import Map, { Position } from '../game/map/map';
import Character from '../game/entity/character/character';
import Mob from '../game/entity/character/mob/mob';
import NPC from '../game/entity/npc/npc';
import Chest from '../game/entity/objects/chest';
import Item from '../game/entity/objects/item';
import Projectile from '../game/entity/objects/projectile';
import Messages from '../network/messages';
import Formulas from '../info/formulas';
import Items from '../info/items';

import mobData from '../../data/mobs.json';
import itemData from '../../data/items.json';
import npcData from '../../data/npcs.json';

import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type World from '../game/world';

export default class Entities {
    private map: Map;
    private regions: Regions;
    private grids;

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
                    return this.addItem(new Item(key, position.x, position.y, -1, -1, true));

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

    public spawnMob(key: string, gridX: number, gridY: number): Mob {
        let mob = new Mob(this.world, key, gridX, gridY);

        this.addMob(mob);

        return mob;
    }

    public spawnChest(
        items: string[],
        gridX: number,
        gridY: number,
        isStatic = false,
        achievement?: number
    ): Chest {
        let chest = new Chest(gridX, gridY, achievement);

        chest.addItems(items);

        if (isStatic) {
            chest.static = isStatic;

            chest.onRespawn(() => this.addChest(chest));
        }

        chest.onOpen((player?: Player) => {
            this.removeChest(chest);

            let item = chest.getItem();

            if (!item) return;

            this.dropItem(Items.stringToId(item.string)!, item.count, chest.x, chest.y);

            if (player && chest.achievement) player.finishAchievement(chest.achievement);
        });

        this.addChest(chest);

        return chest;
    }

    public spawnProjectile([attacker, target]: Character[]): Projectile | null {
        if (!attacker || !target) return null;

        let startX = attacker.x, // gridX
            startY = attacker.y, // gridY
            type = attacker.getProjectile(),
            hit = null,
            projectile = new Projectile(type, startX, startY);

        projectile.setStart(startX, startY);
        projectile.setTarget(target);

        if (attacker.isPlayer()) {
            let player = attacker as Player;

            hit = player.getHit(target);
        }

        projectile.damage = hit ? hit.damage : Formulas.getDamage(attacker, target, true);
        projectile.hitType = hit ? hit.type : Modules.Hits.Damage;

        projectile.owner = attacker;

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
        this.world.push(Opcodes.Push.Regions, {
            regionId: entity.region,
            message: new Messages.Despawn(entity.instance)
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
        if (item.respawnable) item.onRespawn(() => this.addItem(item));

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

        this.world.populationCallback?.();
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

        if (item.respawnable) item.respawn();
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
        this.remove(player);

        if (player.ready) player.save();

        this.world.populationCallback?.();

        delete this.players[player.instance];
        delete this.world.network.packets[player.instance];

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

    public isOnline(username: string): boolean {
        return !!this.getPlayer(username);
    }

    public get<E extends Entity>(instance: string): E | null {
        if (instance in this.entities) return this.entities[instance] as E;

        return null;
    }

    public getPlayer(username: string): Player | undefined {
        return _.find(this.players, (player: Player) => {
            return player.username.toLowerCase() === username.toLowerCase();
        });
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

    /**
     * Miscellaneous Functions
     */

    public dropItem(
        id: number,
        count: number,
        gridX: number,
        gridY: number,
        ability?: number,
        abilityLevel?: number
    ): void {
        let item = new Item(Items.idToString(id), gridX, gridY, ability, abilityLevel);

        item.count = count;
        item.dropped = true;

        this.addItem(item);
        item.despawn();

        item.onBlink(() => {
            this.world.push(Opcodes.Push.Broadcast, {
                message: new Messages.Blink(item.instance)
            });
        });

        item.onDespawn(() => {
            this.removeItem(item);
        });
    }
}
