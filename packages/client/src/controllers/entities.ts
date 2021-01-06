import _ from 'lodash';

import Character from '../entity/character/character';
import Mob from '../entity/character/mob/mob';
import NPC from '../entity/character/npc/npc';
import Equipment from '../entity/character/player/equipment/equipment';
import Weapon from '../entity/character/player/equipment/weapon';
import Player from '../entity/character/player/player';
import Entity from '../entity/entity';
import Chest from '../entity/objects/chest';
import Item from '../entity/objects/item';
import Projectile from '../entity/objects/projectile';
import Sprite from '../entity/sprite';
import Game from '../game';
import Map from '../map/map';
import Packets from '../network/packets';
import Grids from '../renderer/grids';
import Renderer from '../renderer/renderer';
import Modules from '../utils/modules';
import SpritesController from './sprites';

interface EntitiesCollection {
    [id: string]: Entity;
}

export interface Movable {
    string: number;
    characterId: string;
    targetId: string;
    attackerId: string;
    hitType: number;
}
export type AnyEntity = Entity & Player & Mob & Projectile & Weapon & Equipment & Movable;

export default class EntitiesController {
    game: Game;
    renderer: Renderer;
    grids: Grids;
    sprites: SpritesController;
    entities: EntitiesCollection;
    decrepit: Entity[];
    map: Map;

    constructor(game: Game) {
        this.game = game;
        this.renderer = game.renderer;

        this.grids = null;
        this.sprites = null;

        this.entities = {};
        this.decrepit = [];
    }

    load(): void {
        this.game.app.sendStatus('Loading sprites');

        if (!this.sprites) {
            this.sprites = new SpritesController(this.game.renderer);

            this.game.input.loadCursors();
        }

        this.game.app.sendStatus('Loading grids');

        this.grids ||= new Grids(this.game.map);
    }

    update(): void {
        if (this.sprites) this.sprites.updateSprites();
    }

    create(info: AnyEntity): void {
        let entity: Entity;

        if (this.isPlayer(info.id)) return;

        if (info.id in this.entities)
            // Don't initialize things twice.
            return;

        switch (info.type) {
            case 'chest': {
                /**
                 * Here we will parse the different types of chests..
                 * We can go Dark Souls style and implement mimics
                 * the proper way -ahem- Kaetram V1.0
                 */

                const chest = new Chest(info.id, info.string);

                entity = chest;

                break;
            }

            case 'npc': {
                const npc = new NPC(info.id, info.string);

                entity = npc;

                break;
            }

            case 'item': {
                const item = new Item(
                    info.id,
                    info.string,
                    info.count,
                    info.ability,
                    info.abilityLevel
                );

                entity = item;

                break;
            }

            case 'mob': {
                const mob = new Mob(info.id, info.string);

                mob.setHitPoints(info.hitPoints);
                mob.setMaxHitPoints(info.maxHitPoints);

                mob.attackRange = info.attackRange;
                mob.level = info.level;
                mob.hiddenName = info.hiddenName;
                mob.movementSpeed = info.movementSpeed;

                entity = mob;

                break;
            }

            case 'projectile': {
                const attacker = this.get(info.characterId) as Character & Entity,
                    target = this.get(info.targetId) as Character & Entity;

                if (!attacker || !target) return;

                attacker.lookAt(target);

                const projectile = new Projectile(info.id, info.string, attacker); // ? info.projectileType

                projectile.name = info.name;

                projectile.setStart(attacker.x, attacker.y);
                projectile.setTarget(target);

                projectile.setSprite(this.getSprite(projectile.name));
                projectile.setAnimation('travel', projectile.getSpeed());

                projectile.angled = true;
                projectile.type = info.type;

                /**
                 * Move this into the external overall function
                 */

                projectile.onImpact(() => {
                    /**
                     * The data in the projectile is only for rendering purposes
                     * there is nothing you can change for the actual damage output here.
                     */

                    if (this.isPlayer(projectile.owner.id) || this.isPlayer(target.id))
                        this.game.socket.send(Packets.Projectile, [
                            Packets.ProjectileOpcode.Impact,
                            info.id,
                            target.id
                        ]);

                    if (info.hitType === Modules.Hits.Explosive) target.explosion = true;

                    this.game.info.create(
                        Modules.Hits.Damage,
                        [info.damage, this.isPlayer(target.id)],
                        target.x,
                        target.y
                    );

                    target.triggerHealthBar();

                    this.unregisterPosition(projectile);
                    delete this.entities[projectile.getId()];
                });

                this.addEntity(projectile);

                attacker.performAction(attacker.orientation, Modules.Actions.Attack);
                attacker.triggerHealthBar();

                return;
            }

            case 'player': {
                const player = new Player();

                player.setId(info.id);
                player.setName(info.name);
                player.setGridPosition(info.x, info.y);

                player.rights = info.rights;
                player.level = info.level;
                player.pvp = info.pvp;
                player.pvpKills = info.pvpKills;
                player.pvpDeaths = info.pvpDeaths;
                player.attackRange = info.attackRange;
                player.orientation = info.orientation ? info.orientation : 0;
                player.type = info.type;
                player.movementSpeed = info.movementSpeed;

                const hitPointsData = info.hitPoints,
                    manaData = info.mana,
                    equipments = [info.armour, info.weapon, info.pendant, info.ring, info.boots];

                player.setHitPoints(hitPointsData[0]);
                player.setMaxHitPoints(hitPointsData[1]);

                player.setMana(manaData[0]);
                player.setMaxMana(manaData[1]);

                player.setSprite(this.getSprite(info.armour.string));
                player.idle();

                _.each(equipments, (equipment) => {
                    player.setEquipment(
                        equipment.type,
                        equipment.name,
                        equipment.string,
                        equipment.count,
                        equipment.ability,
                        equipment.abilityLevel
                    );
                });

                player.loadHandler(this.game);

                this.addEntity(player);

                return;
            }
        }

        if (!entity) return;

        const sprite = this.getSprite(info.type === 'item' ? `item-${info.string}` : info.string);

        entity.setGridPosition(info.x, info.y);
        entity.setName(info.name);

        entity.setSprite(sprite);

        entity.setIdleSpeed(sprite.idleSpeed);

        entity.idle();
        entity.type = info.type;

        if (info.nameColour) entity.nameColour = info.nameColour;

        if (info.customScale) entity.customScale = info.customScale;

        this.addEntity(entity);

        if (info.type !== 'item' && entity.handler) {
            entity.handler.setGame(this.game);
            entity.handler.load();
        }

        /**
         * Get ready for errors!
         */
    }

    isPlayer(id: string): boolean {
        return this.game.player.id === id;
    }

    get(id: string): Entity {
        if (id in this.entities) return this.entities[id];

        return null;
    }

    exists(id: number): boolean {
        return id in this.entities;
    }

    removeEntity(entity: Entity): void {
        this.grids.removeFromPathingGrid(entity.gridX, entity.gridY);
        this.grids.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);

        delete this.entities[entity.id];
    }

    clean(): void {
        // ids = ids[0];

        if (this.decrepit.length === 0) return;

        _.each(this.decrepit, (entity: Entity) => {
            if (entity.id === this.game.player.id) return;

            this.removeEntity(entity);
        });

        this.grids.resetPathingGrid();
    }

    clearPlayers(exception: Player): void {
        _.each(this.entities, (entity) => {
            if (entity.id !== exception.id && entity.type === 'player') this.removeEntity(entity);
        });

        this.grids.resetPathingGrid();
    }

    addEntity(entity: Entity): void {
        if (this.entities[entity.id]) return;

        this.entities[entity.id] = entity;
        this.registerPosition(entity);

        if (!(entity instanceof Item && entity.dropped) && !this.renderer.isPortableDevice())
            entity.fadeIn(this.game.time);
    }

    removeItem(item: Entity): void {
        if (!item) return;

        this.grids.removeFromItemGrid(item, item.gridX, item.gridY);
        this.grids.removeFromRenderingGrid(item, item.gridX, item.gridY);

        delete this.entities[item.id];
    }

    registerPosition(entity: Entity): void {
        if (!entity) return;

        // if (
        //     entity.type === 'player' ||
        //     entity.type === 'mob' ||
        //     entity.type === 'npc' ||
        //     entity.type === 'chest'
        // ) {
        //     if (entity.type !== 'player' || entity.nonPathable)
        //         this.grids.addToPathingGrid(entity.gridX, entity.gridY);
        // }

        if (entity.type === 'item') this.grids.addToItemGrid(entity, entity.gridX, entity.gridY);

        this.grids.addToRenderingGrid(entity, entity.gridX, entity.gridY);
    }

    registerDuality(entity: Player): void {
        if (!entity) return;

        this.grids.addToRenderingGrid(entity, entity.gridX, entity.gridY);

        // if (entity.nextGridX > -1 && entity.nextGridY > -1) {
        //     if (!(entity instanceof Player))
        //         this.grids.pathingGrid[(entity as Character).nextGridY][
        //             (entity as Character).nextGridX
        //         ] = 1;
        // }
    }

    unregisterPosition(entity: Entity): void {
        if (!entity) return;

        this.grids.removeEntity(entity);
    }

    getSprite(name: string): Sprite {
        return this.sprites.sprites[name];
    }

    getAll(): EntitiesCollection {
        return this.entities;
    }

    forEachEntity(callback: (entity: Entity) => void): void {
        _.each(this.entities, (entity) => {
            callback(entity);
        });
    }

    forEachEntityAround(
        x: number,
        y: number,
        radius: number,
        callback: (entity: Entity) => void
    ): void {
        for (let i = x - radius, max_i = x + radius; i <= max_i; i++) {
            for (let j = y - radius, max_j = y + radius; j <= max_j; j++) {
                if (this.map.isOutOfBounds(i, j)) continue;

                _.each(this.grids.renderingGrid[j][i], (entity: Entity) => {
                    callback(entity);
                });
            }
        }
    }
}
