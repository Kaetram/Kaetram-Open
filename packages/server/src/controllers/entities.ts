import _ from 'lodash';
import Character from '../game/entity/character/character';
import Mob from '../game/entity/character/mob/mob';
import Player from '../game/entity/character/player/player';
import Entity from '../game/entity/entity';
import NPC from '../game/entity/npc/npc';
import Chest from '../game/entity/objects/chest';
import Item from '../game/entity/objects/item';
import Projectile from '../game/entity/objects/projectile';

import World from '../game/world';
import Grids from '../map/grids';
import Map from '../map/map';
import Messages from '../network/messages';
import Packets from '@kaetram/common/src/packets';
import Region from '../region/region';

import log from '../util/log';
import Utils from '../util/utils';

import Items from '../util/items';
import Mobs from '../util/mobs';
import NPCs from '../util/npcs';
import Formulas from '../util/formulas';
import * as Modules from '@kaetram/common/src/modules';

export default class Entities {
    private world: World;
    private region: Region;
    private map: Map;
    private grids: Grids;

    public players: { [key: string]: Player };
    public entities: { [key: string]: Entity };
    public items: { [key: string]: Item };
    public mobs: { [key: string]: Mob };
    public chests: { [key: string]: Chest };
    public npcs: { [key: string]: NPC };
    public projectiles: { [key: string]: Projectile };

    constructor(world: World) {
        this.world = world;
        this.region = world.region;
        this.map = world.map;
        this.grids = world.map.grids;

        this.players = {};
        this.entities = {};
        this.items = {};
        this.chests = {};
        this.mobs = {};
        this.npcs = {};
        this.projectiles = {};

        this.spawn();
    }

    /**
     * Spawn Entities
     */

    private spawn() {
        // Spawns the static entities such as mobs, items, and npcs

        _.each(this.map.staticEntities, (entityInfo) => {
            const key = entityInfo.string,
                instance = Utils.generateInstance(),
                position = this.map.indexToGridPosition(entityInfo.tileIndex, 1);

            switch (entityInfo.type) {
                case 'item': {
                    const item = this.createItem(
                        Items.stringToId(key),
                        instance,
                        position.x,
                        position.y
                    );

                    item.static = true;

                    this.addItem(item);

                    break;
                }

                case 'npc': {
                    const npc = new NPC(NPCs.stringToId(key), instance, position.x, position.y);

                    this.addNPC(npc);

                    break;
                }

                case 'mob': {
                    const mob = new Mob(Mobs.stringToId(key), instance, position.x, position.y);

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
                        this.world.push(Packets.PushOpcode.Regions, {
                            regionId: mob.region,
                            message: new Messages.NPC(Packets.NPCOpcode.Talk, {
                                id: mob.instance,
                                text: message,
                                nonNPC: true
                            })
                        });
                    });

                    mob.onRoaming(() => {
                        if (this.mobs.dead) return;

                        const newX =
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

                        const plateauLevel = this.map.getPlateauLevel(
                            mob.spawnLocation[0],
                            mob.spawnLocation[1]
                        );

                        if (plateauLevel !== this.map.getPlateauLevel(newX, newY)) return;

                        // if (config.debug)
                        //    this.forceTalk('Yes hello, I am moving.');

                        mob.setPosition(newX, newY);

                        this.world.push(Packets.PushOpcode.Regions, {
                            regionId: mob.region,
                            message: new Messages.Movement(Packets.MovementOpcode.Move, {
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
            this.spawnChest(info.items.split(','), info.x, info.y, true, info.achievement);
        });

        log.info(`Spawned ${Object.keys(this.chests).length} static chests!`);
    }

    spawnMob(id: number, gridX: number, gridY: number): Mob {
        const mob = new Mob(id, Utils.generateInstance(), gridX, gridY);

        this.addMob(mob);

        return mob;
    }

    spawnChest(
        items: string[],
        gridX: number,
        gridY: number,
        isStatic?: boolean,
        achievement?: number
    ): Chest {
        const chest = new Chest(194, Utils.generateInstance(), gridX, gridY, achievement);

        chest.addItems(items);

        if (isStatic) {
            chest.static = isStatic;

            chest.onRespawn(() => this.addChest(chest));
        }

        chest.onOpen((player?: Player) => {
            this.removeChest(chest);

            const item = chest.getItem();

            if (!item) return;

            this.dropItem(Items.stringToId(item.string), item.count, chest.x, chest.y);

            if (player && chest.achievement) player.finishAchievement(chest.achievement);
        });

        this.addChest(chest);

        return chest;
    }

    spawnProjectile([attacker, target]: Character[]): Projectile {
        if (!attacker || !target) return null;

        const startX = attacker.x, // gridX
            startY = attacker.y, // gridY
            type = attacker.getProjectile();
        let hit = null;
        const projectile = new Projectile(type, Utils.generateInstance());

        projectile.setStart(startX, startY);
        projectile.setTarget(target);

        if (attacker.type === 'player') {
            const player = attacker as Player;

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

    add(entity: Entity, region: string): void {
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

            this.world.push(Packets.PushOpcode.Broadcast, [
                {
                    message: new Messages.Combat(Packets.CombatOpcode.Finish, {
                        attackerId: null,
                        targetId: entity.instance
                    })
                },
                {
                    message: new Messages.Movement(Packets.MovementOpcode.Move, {
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
                this.world.push(Packets.PushOpcode.Regions, {
                    regionId: entity.region,
                    message: new Messages.Movement(Packets.MovementOpcode.Stunned, {
                        id: entity.instance,
                        state: stun
                    })
                });
            });
        }
    }

    addNPC(npc: NPC): void {
        this.add(npc, npc.region);

        this.npcs[npc.instance] = npc;
    }

    addItem(item: Item): void {
        if (item.static) item.onRespawn(() => this.addItem(item));

        this.add(item, item.region);

        this.items[item.instance] = item;
    }

    addMob(mob: Mob): void {
        this.add(mob, mob.region);

        this.mobs[mob.instance] = mob;

        mob.addToChestArea(this.map.getChestAreas());

        mob.onHit((attacker: Character) => {
            if (mob.isDead() || mob.combat.started) return;

            mob.combat.begin(attacker);
        });
    }

    addPlayer(player: Player): void {
        this.add(player, player.region);

        this.players[player.instance] = player;

        if (this.world.populationCallback) this.world.populationCallback();
    }

    addChest(chest: Chest): void {
        this.add(chest, chest.region);

        this.chests[chest.instance] = chest;
    }

    addProjectile(projectile: Projectile): void {
        this.add(projectile, projectile.owner.region);

        this.projectiles[projectile.instance] = projectile;
    }

    /**
     * Remove Entities
     */

    remove(entity: Entity): void {
        this.grids.removeFromEntityGrid(entity, entity.x, entity.y);

        this.region.remove(entity);

        delete this.entities[entity.instance];
        delete this.mobs[entity.instance];
        delete this.items[entity.instance];
        delete this.players[entity.instance];
        delete this.projectiles[entity.instance];
    }

    removeItem(item: Item): void {
        this.remove(item);

        this.world.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Despawn(item.instance)
        });

        if (item.static) item.respawn();
    }

    removePlayer(player: Player): void {
        this.remove(player);

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: player.region,
            message: new Messages.Despawn(player.instance)
        });

        if (player.ready) player.save();

        if (this.world.populationCallback) this.world.populationCallback();

        this.world.cleanCombat(player);

        delete this.world.network.packets[player.instance];

        // Unsure about this since garbage collector should handle it.
        player.destroy();
        player = null;
    }

    removeChest(chest: Chest): void {
        this.remove(chest);

        this.world.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Despawn(chest.instance)
        });

        if (chest.static) chest.respawn();
        else delete this.chests[chest.instance];
    }

    /**
     * Getters
     */

    isOnline(username: string): boolean {
        return !!this.getPlayer(username);
    }

    get<E extends Entity>(instance: string): E | undefined {
        if (instance in this.entities) return this.entities[instance] as E;
    }

    getPlayer(username: string): Player {
        return _.find(this.players, (player: Player) => {
            return player.username.toLowerCase() === username.toLowerCase();
        });
    }

    forEachEntity(callback: (entity: Entity) => void): void {
        _.each(this.entities, callback);
    }

    forEachPlayer(callback: (player: Player) => void): void {
        _.each(this.players, callback);
    }

    /**
     * Miscellaneous Functions
     */

    createItem(
        id: number,
        instance: string,
        gridX: number,
        gridY: number,
        ability?: number,
        abilityLevel?: number
    ): Item {
        return new Item(id, instance, gridX, gridY, ability, abilityLevel);
    }

    dropItem(
        id: number,
        count: number,
        gridX: number,
        gridY: number,
        ability?: number,
        abilityLevel?: number
    ): void {
        const item = this.createItem(
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
            this.world.push(Packets.PushOpcode.Broadcast, {
                message: new Messages.Blink(item.instance)
            });
        });

        item.onDespawn(() => {
            this.removeItem(item);
        });
    }
}
