import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Character from '../game/entity/character/character';
import Mob from '../game/entity/character/mob/mob';
import NPC from '../game/entity/npc/npc';
import Chest from '../game/entity/objects/chest';
import Item from '../game/entity/objects/item';
import Projectile from '../game/entity/objects/projectile';
import Messages from '../network/messages';
import Formulas from '../util/formulas';
import Items from '../util/items';
import Mobs from '../util/mobs';
import NPCs from '../util/npcs';

import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type World from '../game/world';

export default class Entities {
    private region;
    private map;
    private grids;

    public players: { [instance: string]: Player } = {};
    private entities: { [instance: string]: Entity } = {};
    private items: { [instance: string]: Item } = {};
    private mobs: { [instance: string]: Mob } = {};
    private chests: { [instance: string]: Chest } = {};
    private npcs: { [instance: string]: NPC } = {};
    private projectiles: { [instance: string]: Projectile } = {};

    public constructor(private world: World) {
        this.region = world.region;
        this.map = world.map;
        this.grids = world.map.grids;

        this.spawn();
    }

    /**
     * Spawn Entities
     */
    private spawn() {
        // Spawns the static entities such as mobs, items, and npcs

        _.each(this.map.staticEntities, (entityInfo) => {
            let key = entityInfo.string,
                instance = Utils.generateInstance(),
                position = this.map.indexToGridPosition(entityInfo.tileIndex, 1);

            switch (entityInfo.type) {
                case 'item': {
                    let item = this.createItem(
                        Items.stringToId(key)!,
                        instance,
                        position.x,
                        position.y
                    );

                    item.static = true;

                    this.addItem(item);

                    break;
                }

                case 'npc': {
                    let npc = new NPC(NPCs.stringToId(key)!, instance, position.x, position.y);

                    this.addNPC(npc);

                    break;
                }

                case 'mob': {
                    let mob = new Mob(Mobs.stringToId(key)!, instance, position.x, position.y);

                    mob.static = true;
                    mob.roaming = entityInfo.roaming;

                    if (entityInfo.miniboss) {
                        // TODO - Rename `achievementId` -> `achievement`
                        if (entityInfo.achievementId) mob.achievementId = entityInfo.achievementId;

                        mob.miniboss = entityInfo.miniboss;
                    }

                    if (entityInfo.boss) mob.boss = entityInfo.boss;

                    if (Mobs.isHidden(key)) mob.hiddenName = true;

                    mob.load();

                    mob.onRespawn(() => {
                        mob.dead = false;

                        mob.lastAttacker = null;

                        mob.refresh();

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
                                mob.spawnLocation[0] +
                                Utils.randomInt(-mob.maxRoamingDistance, mob.maxRoamingDistance),
                            newY =
                                mob.spawnLocation[1] +
                                Utils.randomInt(-mob.maxRoamingDistance, mob.maxRoamingDistance),
                            distance = Utils.getDistance(
                                mob.spawnLocation[0],
                                mob.spawnLocation[1],
                                newX,
                                newY
                            );

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
                        let plateauLevel = this.map.getPlateauLevel(
                            mob.spawnLocation[0],
                            mob.spawnLocation[1]
                        );

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

        _.each(this.map.chests, (info) => {
            this.spawnChest(info.items!.split(','), info.x, info.y, true, info.achievement);
        });

        log.info(`Spawned ${Object.keys(this.chests).length} static chests!`);
    }

    public spawnMob(id: number, gridX: number, gridY: number): Mob {
        let mob = new Mob(id, Utils.generateInstance(), gridX, gridY);

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
        let chest = new Chest(194, Utils.generateInstance(), gridX, gridY, achievement);

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
            projectile = new Projectile(type, Utils.generateInstance());

        projectile.setStart(startX, startY);
        projectile.setTarget(target);

        if (attacker.type === 'player') {
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
    private add(entity: Entity, region: string | null): void {
        if (entity.instance in this.entities)
            log.warning(`Entity ${entity.instance} already exists.`);

        this.entities[entity.instance] = entity;

        this.region.handle(entity, region);

        this.grids.addToEntityGrid(entity, entity.x, entity.y);

        entity.onSetPosition(() => {
            this.grids.updateEntityPosition(entity);

            if (!entity.isMob()) return;

            if (!entity.isOutsideSpawn()) return;

            entity.removeTarget();

            entity.combat.forget();
            entity.combat.stop();

            entity.return();

            this.world.push(Opcodes.Push.Broadcast, [
                {
                    message: new Messages.Combat(Opcodes.Combat.Finish, {
                        attackerId: null,
                        targetId: entity.instance
                    })
                },
                {
                    message: new Messages.Movement(Opcodes.Movement.Move, {
                        id: entity.instance,
                        x: entity.x,
                        y: entity.y,
                        forced: false,
                        teleport: false
                    })
                }
            ]);
        });

        if (entity instanceof Character) {
            entity.combat.setWorld(this.world);

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
    }

    private addNPC(npc: NPC): void {
        this.add(npc, npc.region);

        this.npcs[npc.instance] = npc;
    }

    private addItem(item: Item): void {
        if (item.static) item.onRespawn(() => this.addItem(item));

        this.add(item, item.region);

        this.items[item.instance] = item;
    }

    private addMob(mob: Mob): void {
        this.add(mob, mob.region);

        this.mobs[mob.instance] = mob;

        mob.addToChestArea(this.map.getChestAreas());

        mob.onHit((attacker: Character) => {
            if (mob.isDead() || mob.combat.started) return;

            mob.combat.begin(attacker);
        });
    }

    public addPlayer(player: Player): void {
        this.add(player, player.region);

        this.players[player.instance] = player;

        this.world.populationCallback?.();
    }

    private addChest(chest: Chest): void {
        this.add(chest, chest.region);

        this.chests[chest.instance] = chest;
    }

    private addProjectile(projectile: Projectile): void {
        this.add(projectile, projectile.owner!.region);

        this.projectiles[projectile.instance] = projectile;
    }

    /**
     * Remove Entities
     */
    public remove(entity: Entity): void {
        this.grids.removeFromEntityGrid(entity, entity.x, entity.y);

        this.region.remove(entity);

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

        if (item.static) item.respawn();
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

    public forEachEntity(callback: (entity: Entity) => void): void {
        _.each(this.entities, callback);
    }

    public forEachPlayer(callback: (player: Player) => void): void {
        _.each(this.players, callback);
    }

    /**
     * Miscellaneous Functions
     */
    private createItem(
        id: number,
        instance: string,
        gridX: number,
        gridY: number,
        ability?: number,
        abilityLevel?: number
    ): Item {
        return new Item(id, instance, gridX, gridY, ability, abilityLevel);
    }

    public dropItem(
        id: number,
        count: number,
        gridX: number,
        gridY: number,
        ability?: number,
        abilityLevel?: number
    ): void {
        let item = this.createItem(
            id,
            Utils.generateInstance(),
            gridX,
            gridY,
            ability,
            abilityLevel
        );

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
