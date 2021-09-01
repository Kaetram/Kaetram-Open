import _ from 'lodash';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import Mob from '../entity/character/mob/mob';
import NPC from '../entity/character/npc/npc';
import Player from '../entity/character/player/player';
import Chest from '../entity/objects/chest';
import Item from '../entity/objects/item';
import Projectile from '../entity/objects/projectile';
import Grids from '../renderer/grids';
import SpritesController from './sprites';

import type { ProjectileData } from '@kaetram/common/types/messages';
import type Character from '../entity/character/character';
import type Equipment from '../entity/character/player/equipment/equipment';
import type Weapon from '../entity/character/player/equipment/weapon';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';

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

    public create(info: AnyEntity): void {
        let { entities, game } = this,
            entity: Entity = null!;

        if (this.isPlayer(info.id)) return;

        if (info.id in entities)
            // Don't initialize things twice.
            return;

        switch (info.type) {
            case 'chest': {
                /**
                 * Here we will parse the different types of chests..
                 * We can go Dark Souls style and implement mimics
                 * the proper way -ahem- Kaetram V1.0
                 */

                let chest = new Chest(info.id, info.string);

                entity = chest;

                break;
            }

            case 'npc': {
                let npc = new NPC(info.id, info.string);

                entity = npc;

                break;
            }

            case 'item': {
                let item = new Item(
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
                let mob = new Mob(info.id, info.string);

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
                let attacker = this.get<Character>(info.characterId),
                    target = this.get<Character>(info.targetId);

                if (!attacker || !target) return;

                attacker.lookAt(target);

                let projectile = new Projectile(info.id, info.string, attacker); // ? info.projectileType

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
                        game.socket.send(Packets.Projectile, [
                            Opcodes.Projectile.Impact,
                            info.id,
                            target.id
                        ]);

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

            case 'player': {
                let player = new Player();

                player.setId(info.id);
                player.setName(info.name);
                player.setGridPosition(info.x, info.y);

                player.rights = info.rights;
                player.level = info.level;
                player.pvp = info.pvp;
                player.pvpKills = info.pvpKills;
                player.pvpDeaths = info.pvpDeaths;
                player.attackRange = info.attackRange;
                player.orientation = info.orientation || 0;
                player.type = info.type;
                player.movementSpeed = info.movementSpeed;

                let hitPointsData = info.hitPoints as number[],
                    manaData = info.mana as number[],
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

                player.loadHandler(game);

                this.addEntity(player);

                return;
            }
        }

        if (!entity) return;

        let sprite = this.getSprite(info.type === 'item' ? `item-${info.string}` : info.string)!;

        entity.setGridPosition(info.x, info.y);
        entity.setName(info.name);

        entity.setSprite(sprite);

        entity.setIdleSpeed(sprite.idleSpeed);

        entity.idle();
        entity.type = info.type;

        if (info.nameColour) entity.nameColour = info.nameColour;

        if (info.customScale) entity.customScale = info.customScale;

        this.addEntity(entity);

        let { handler } = entity as Character;

        if (info.type !== 'item' && handler) {
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
            if (entity.id !== exception.id && entity.type === 'player') this.removeEntity(entity);
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
        //     entity.type === 'player' ||
        //     entity.type === 'mob' ||
        //     entity.type === 'npc' ||
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
