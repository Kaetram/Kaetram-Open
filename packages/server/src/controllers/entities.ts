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
import Mobs from '../info/mobs';
import NPCs from '../info/npcs';

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

    private load(): void {
        this.map.forEachEntity((position: Position, key: string) => {
            let type = this.getEntityType(key);

            switch (type) {
                case Modules.EntityType.Item:
                    return this.addItem(new Item(key, position.x, position.y, -1, -1, true));

                case Modules.EntityType.NPC:
                    return this.addNPC(new NPC(key, position.x, position.y));

                case Modules.EntityType.Mob: {
                    let mob = new Mob(key, position.x, position.y);

                    mob.static = true;
                    // mob.roaming = entityInfo.roaming;

                    // if (entityInfo.miniboss) {
                    //     // TODO - Rename `achievementId` -> `achievement`
                    //     if (entityInfo.achievementId) mob.achievementId = entityInfo.achievementId;

                    //     mob.miniboss = entityInfo.miniboss;
                    // }

                    // if (entityInfo.boss) mob.boss = entityInfo.boss;

                    if (Mobs.isHidden(key)) mob.hiddenName = true;

                    mob.load();

                    mob.onRespawn(() => {
                        mob.dead = false;

                        mob.lastAttacker = null;

                        //mob.refresh();

                        this.addMob(mob);
                    });

                    mob.onForceTalk((message: string) => {
                        this.world.push(Opcodes.Push.Regions, {
                            regionId: mob.region,
                            message: new Messages.NPC(Opcodes.NPC.Talk, {
                                id: mob.instance,
                                text: message,
                                nonNPC: true
                            })
                        });
                    });

                    mob.onRoaming(() => {
                        if (this.mobs.dead) return;

                        let newX =
                                mob.spawnX +
                                Utils.randomInt(-mob.maxRoamingDistance, mob.maxRoamingDistance),
                            newY =
                                mob.spawnY +
                                Utils.randomInt(-mob.maxRoamingDistance, mob.maxRoamingDistance),
                            distance = Utils.getDistance(mob.spawnX, mob.spawnY, newX, newY);

                        // Return if the tile is colliding.
                        if (this.map.isColliding(newX, newY)) return;

                        // Prevent movement if the area is empty.
                        if (this.map.isEmpty(newX, newY)) return;

                        // Don't have mobs block a door.
                        if (this.map.isDoor(newX, newY)) return;

                        // Prevent mobs from going outside of their roaming radius.
                        if (distance < mob.maxRoamingDistance) return;

                        // No need to move mobs to the same position as theirs.
                        if (newX === mob.x && newY === mob.y) return;

                        // We don't want mobs randomly roaming while in combat.
                        if (mob.combat.started) return;

                        /**
                         * An expansion of the plateau level present in BrowserQuest.
                         * Because the map is far more complex, we will require multiple
                         * levels of plateau in order to properly roam entities without
                         * them walking into other regions (or clipping).
                         */
                        let plateauLevel = this.map.getPlateauLevel(mob.spawnX, mob.spawnY);

                        if (plateauLevel !== this.map.getPlateauLevel(newX, newY)) return;

                        // if (config.debugging) this.forceTalk('Yes hello, I am moving.');

                        mob.setPosition(newX, newY);

                        this.world.push(Opcodes.Push.Regions, {
                            regionId: mob.region,
                            message: new Messages.Movement(Opcodes.Movement.Move, {
                                id: mob.instance,
                                x: newX,
                                y: newY
                            })
                        });
                    });

                    this.addMob(mob);

                    break;
                }
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
        let mob = new Mob(key, gridX, gridY);

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
     * Add Entities
     */
    private add(entity: Entity): void {
        if (entity.instance in this.entities)
            log.warning(`Entity ${entity.instance} already exists.`);

        this.entities[entity.instance] = entity;

        this.regions.handle(entity);

        this.grids.addToEntityGrid(entity, entity.x, entity.y);

        // // Todo move this into a separate handler.
        // entity.onMovement(() => {
        //     this.grids.updateEntityPosition(entity);

        //     if (!entity.isMob()) return;

        //     if (!entity.isOutsideSpawn()) return;

        //     entity.removeTarget();

        //     entity.combat.forget();
        //     entity.combat.stop();

        //     entity.return();

        //     this.world.push(Opcodes.Push.Broadcast, [
        //         {
        //             message: new Messages.Combat(Opcodes.Combat.Finish, {
        //                 attackerId: null,
        //                 targetId: entity.instance
        //             })
        //         },
        //         {
        //             message: new Messages.Movement(Opcodes.Movement.Move, {
        //                 id: entity.instance,
        //                 x: entity.x,
        //                 y: entity.y,
        //                 forced: false,
        //                 teleport: false
        //             })
        //         }
        //     ]);
        // });

        if (entity instanceof Character)
            entity.onStunned((stun: boolean) => {
                this.world.push(Opcodes.Push.Regions, {
                    regionId: entity.region,
                    message: new Messages.Movement(Opcodes.Movement.Stunned, {
                        id: entity.instance,
                        state: stun
                    })
                });
            });
    }

    private addNPC(npc: NPC): void {
        this.add(npc);

        this.npcs[npc.instance] = npc;
    }

    private addItem(item: Item): void {
        if (item.respawnable) item.onRespawn(() => this.addItem(item));

        this.add(item);

        this.items[item.instance] = item;
    }

    private addMob(mob: Mob): void {
        this.add(mob);

        this.mobs[mob.instance] = mob;

        mob.addToChestArea(this.map.getChestAreas());

        mob.onHit((attacker: Character) => {
            if (mob.isDead() || mob.combat.started) return;

            mob.combat.begin(attacker);
        });
    }

    public addPlayer(player: Player): void {
        this.add(player);

        this.players[player.instance] = player;

        this.world.populationCallback?.();
    }

    private addChest(chest: Chest): void {
        this.add(chest);

        this.chests[chest.instance] = chest;
    }

    private addProjectile(projectile: Projectile): void {
        this.add(projectile);

        this.projectiles[projectile.instance] = projectile;
    }

    /**
     * Remove Entities
     */
    public remove(entity: Entity): void {
        this.grids.removeFromEntityGrid(entity, entity.x, entity.y);

        this.regions.remove(entity);

        delete this.entities[entity.instance];
        delete this.mobs[entity.instance];
        delete this.items[entity.instance];
        delete this.players[entity.instance];
        delete this.projectiles[entity.instance];
    }

    public removeItem(item: Item): void {
        this.remove(item);

        this.world.push(Opcodes.Push.Broadcast, {
            message: new Messages.Despawn(item.instance)
        });

        if (item.respawnable) item.respawn();
    }

    public removePlayer(player: Player): void {
        this.world.push(Opcodes.Push.Regions, {
            regionId: player.region,
            message: new Messages.Despawn(player.instance)
        });

        this.remove(player);

        if (player.ready) player.save();

        this.world.populationCallback?.();

        this.world.cleanCombat(player);

        delete this.world.network.packets[player.instance];

        // Unsure about this since garbage collector should handle it.
        player.destroy();
    }

    public removeChest(chest: Chest): void {
        this.remove(chest);

        this.world.push(Opcodes.Push.Broadcast, {
            message: new Messages.Despawn(chest.instance)
        });

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
        if (NPCs.stringToId(entityString)) return Modules.EntityType.NPC;
        if (Mobs.stringToId(entityString)) return Modules.EntityType.Mob;
        if (Items.stringToId(entityString)) return Modules.EntityType.Item;

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
