import _ from 'lodash';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import Mob from '../entity/character/mob/mob';
import NPC from '../entity/character/npc/npc';
import Player from '../entity/character/player/player';
import Chest from '../entity/objects/chest';
import Item from '../entity/objects/item';
import Grids from '../renderer/grids';
import SpritesController from './sprites';

import type { ProjectileData } from '@kaetram/common/types/messages';
import type Character from '../entity/character/character';
import type Equipment from '../entity/character/player/equipment/equipment';
import type Weapon from '../entity/character/player/equipment/weapon';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
import { EquipmentData } from '@kaetram/common/types/equipment';
import Projectile from '../entity/objects/projectile';

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

// Replace AnyEntity with this soon..
export interface EntityData {
    // Entity data
    instance: string;
    type: number;
    key: string;
    name: string;
    x: number;
    y: number;

    // Character data
    movementSpeed: number;
    hitPoints: number;
    maxHitPoints: number;
    attackRange: number;
    level: number;
    hiddenName: boolean;

    // Item data
    count: number;
    ability: number;
    abilityLevel: number;

    // Player Data
    rights: number;
    pvp: boolean;
    orientation: number;

    // Projectile info
    ownerInstance: string;
    targetInstance: string;
    damage: number;
    hitType: Modules.Hits;

    equipments: EquipmentData[];
}

export type AnyEntity = Entity & Player & Mob & ProjectileData & Weapon & Equipment & Movable;

export default class EntitiesController {
    private renderer;

    public grids!: Grids;
    public sprites!: SpritesController;

    public entities: EntitiesCollection = {};
    public decrepit: Entity[] = [];

    public constructor(private game: Game) {
        this.renderer = game.renderer;
    }

    public load(): void {
        let { game, sprites } = this;

        game.app.sendStatus('Loading sprites');

        if (!sprites) {
            let sprites = new SpritesController();
            sprites.load();

            this.sprites = sprites;

            game.input.loadCursors();
        }

        game.app.sendStatus('Loading grids');

        this.grids ||= new Grids(game.map);
    }

    public update(): void {
        this.sprites?.updateSprites();
    }

    public create(info: EntityData): void {
        let { entities, game } = this,
            entity: Entity = null!;

        if (this.isPlayer(info.instance)) return;

        // Don't initialize things twice.
        if (info.instance in entities) return;

        switch (info.type) {
            case Modules.EntityType.Chest: {
                /**
                 * Here we will parse the different types of chests..
                 * We can go Dark Souls style and implement mimics
                 * the proper way -ahem- Kaetram V1.0
                 */

                let chest = new Chest(info.instance, info.key);

                entity = chest;

                break;
            }

            case Modules.EntityType.NPC: {
                let npc = new NPC(info.instance, info.key);

                entity = npc;

                break;
            }

            case Modules.EntityType.Item: {
                let item = new Item(
                    info.instance,
                    info.key,
                    info.count,
                    info.ability,
                    info.abilityLevel
                );

                entity = item;

                break;
            }

            case Modules.EntityType.Mob: {
                let mob = new Mob(info.instance, info.key);

                mob.setHitPoints(info.hitPoints);
                mob.setMaxHitPoints(info.maxHitPoints);

                mob.attackRange = info.attackRange;
                mob.level = info.level;
                mob.hiddenName = info.hiddenName;
                mob.movementSpeed = info.movementSpeed;

                entity = mob;

                break;
            }

            // TODO REFACTOR THIS
            case Modules.EntityType.Projectile: {
                let attacker = this.get<Character>(info.ownerInstance),
                    target = this.get<Character>(info.targetInstance);

                if (!attacker || !target) return;

                attacker.lookAt(target);

                let projectile = new Projectile(info.instance, info.key, attacker); // ? info.projectileType

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
                        game.socket.send(Packets.Projectile, {
                            opcode: Opcodes.Projectile.Impact,
                            instance: info.instance,
                            target: target.id
                        });

                    if (info.hitType === Modules.Hits.Explosive) target.explosion = true;

                    game.info.create(
                        Modules.Hits.Damage,
                        [info.damage, this.isPlayer(target.id)],
                        target.x,
                        target.y
                    );

                    target.triggerHealthBar();

                    this.unregisterPosition(projectile);
                    delete entities[projectile.getId()];
                });

                this.addEntity(projectile);

                attacker.performAction(attacker.orientation, Modules.Actions.Attack);
                attacker.triggerHealthBar();

                return;
            }

            case Modules.EntityType.Player: {
                let player = new Player();

                player.setId(info.instance);
                player.setName(info.name);
                player.setGridPosition(info.x, info.y);

                player.rights = info.rights;
                player.level = info.level;
                player.attackRange = info.attackRange;
                player.orientation = info.orientation;
                player.type = info.type;
                player.movementSpeed = info.movementSpeed;

                player.setHitPoints(info.hitPoints);
                player.setMaxHitPoints(info.maxHitPoints);

                console.log(info);

                player.setSprite(this.getSprite(player.getSpriteName()));
                player.idle();

                player.loadHandler(game);

                this.addEntity(player);

                // player.setMana(manaData[0]);
                // player.setMaxMana(manaData[1]);

                // player.setSprite(this.getSprite(info.armour.string));
                // player.idle();

                // _.each(equipments, (equipment) => {
                //     player.setEquipment(
                //         equipment.type,
                //         equipment.name,
                //         equipment.string,
                //         equipment.count,
                //         equipment.ability,
                //         equipment.abilityLevel
                //     );
                // });

                // player.loadHandler(game);

                // this.addEntity(player);

                return;
            }
        }

        if (!entity) return;

        let sprite = this.getSprite(
            info.type === Modules.EntityType.Item ? `item-${info.key}` : info.key
        )!;

        entity.setGridPosition(info.x, info.y);
        entity.setName(info.name);

        entity.setSprite(sprite);

        entity.setIdleSpeed(sprite.idleSpeed);

        entity.idle();
        entity.type = info.type;

        // if (info.nameColour) entity.nameColour = info.nameColour;

        // if (info.customScale) entity.customScale = info.customScale;

        this.addEntity(entity);

        let { handler } = entity as Character;

        if (info.type !== Modules.EntityType.Item && handler) {
            handler.setGame(game);
            handler.load();
        }

        /**
         * Get ready for errors!
         */
    }

    private isPlayer(id: string): boolean {
        let { player } = this.game;

        return player ? player.id === id : false;
    }

    public get<E extends Entity>(id: string): E {
        return this.entities[id] as E;
    }

    public removeEntity(entity: Entity): void {
        let { grids, entities } = this;

        grids.removeFromPathingGrid(entity.gridX, entity.gridY);
        grids.removeFromRenderingGrid(entity);

        delete entities[entity.id];
    }

    public clean(): void {
        let { decrepit, game, grids } = this;

        if (decrepit.length === 0) return;

        _.each(decrepit, (entity: Entity) => {
            let { player } = game;

            if (player ? entity.id === player.id : false) return;

            this.removeEntity(entity);
        });

        grids.resetPathingGrid();
    }

    public clearPlayers(exception: Player): void {
        let { entities, grids } = this;

        _.each(entities, (entity) => {
            if (entity.id !== exception.id && entity.isPlayer()) this.removeEntity(entity);
        });

        grids.resetPathingGrid();
    }

    public addEntity(entity: Entity): void {
        let { entities, renderer, game } = this;

        if (entities[entity.id]) return;

        entities[entity.id] = entity;
        this.registerPosition(entity);

        if (!(entity instanceof Item && entity.dropped) && !renderer.isPortableDevice())
            entity.fadeIn(game.time);
    }

    public removeItem(item: Entity): void {
        if (!item) return;

        let { grids, entities } = this;

        grids.removeFromItemGrid(item);
        grids.removeFromRenderingGrid(item);

        delete entities[item.id];
    }

    public registerPosition(entity: Entity): void {
        if (!entity) return;

        // if (
        //     entity.isPlayer() ||
        //     entity.isMob() ||
        //     entity.isNPC() ||
        //     entity.type === 'chest'
        // ) {
        //     if (entity.type !== 'player' || entity.nonPathable)
        //         this.grids.addToPathingGrid(entity.gridX, entity.gridY);
        // }

        if (entity instanceof Item) this.grids.addToItemGrid(entity);

        this.grids.addToRenderingGrid(entity);
    }

    public registerDuality(entity: Character): void {
        if (!entity) return;

        this.grids.addToRenderingGrid(entity);

        // if (entity.nextGridX > -1 && entity.nextGridY > -1 && !(entity instanceof Player))
        //     this.grids.pathingGrid[(entity as Character).nextGridY][
        //         (entity as Character).nextGridX
        //     ] = 1;
    }

    public unregisterPosition(entity: Entity): void {
        if (!entity) return;

        this.grids.removeEntity(entity);
    }

    public getSprite(name: string | undefined): Sprite | undefined {
        if (name) return this.sprites.sprites[name];
    }

    public getAll(): EntitiesCollection {
        return this.entities;
    }

    public forEachEntity(callback: (entity: Entity) => void): void {
        _.each(this.entities, callback);
    }
}
