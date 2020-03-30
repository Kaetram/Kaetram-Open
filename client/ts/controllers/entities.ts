/* global log, _, Modules, Packets */

import Grids from '../renderer/grids';
import Chest from '../entity/objects/chest';
import Character from '../entity/character/character';
import Player from '../entity/character/player/player';
import Item from '../entity/objects/item';
import Sprites from './sprites';
import Mob from '../entity/character/mob/mob';
import NPC from '../entity/character/npc/npc';
import Projectile from '../entity/objects/projectile';
import Packets from '../network/packets';
import Modules from '../utils/modules';
import _ from 'underscore';

export default class Entities {
    game: any;
    renderer: any;
    grids: any;
    sprites: any;
    entities: { [key: string]: any };
    decrepit: { [key: string]: any };
    map: any;
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;

        this.grids = null;
        this.sprites = null;

        this.entities = {};
        this.decrepit = {};
    }

    load() {
        this.game.app.sendStatus('Loading sprites');

        if (!this.sprites) {
            this.sprites = new Sprites(this.game.renderer);

            this.sprites.onLoadedSprites(() => {
                this.game.input.loadCursors();
            });
        }

        this.game.app.sendStatus('Loading grids');

        if (!this.grids) this.grids = new Grids(this.game.map);
    }

    update() {
        if (this.sprites) this.sprites.updateSprites();
    }

    create(info) {
        let entity;

        if (this.isPlayer(info.id)) return;

        if (info.id in this.entities)
            // Don't initialize things twice.
            return;

        switch (info.type) {
            case 'chest':
                /**
                 * Here we will parse the different types of chests..
                 * We can go Dark Souls style and implement mimics
                 * the proper way -ahem- Kaetram V1.0
                 */

                const chest = new Chest(info.id, info.string);

                entity = chest;

                break;

            case 'npc':
                const npc = new NPC(info.id, info.string);

                entity = npc;

                break;

            case 'item':
                const item = new Item(
                    info.id,
                    info.string,
                    info.count,
                    info.ability,
                    info.abilityLevel
                );

                entity = item;

                break;

            case 'mob':
                const mob = new Mob(info.id, info.string);

                mob.setHitPoints(info.hitPoints);
                mob.setMaxHitPoints(info.maxHitPoints);

                mob.attackRange = info.attackRange;
                mob.level = info.level;
                mob.hiddenName = info.hiddenName;
                mob.movementSpeed = info.movementSpeed;

                entity = mob;

                break;

            case 'projectile':
                const attacker = this.get(info.characterId);
                const target = this.get(info.targetId);

                if (!attacker || !target) return;

                attacker.lookAt(target);

                const projectile = new Projectile(
                    info.id,
                    info.projectileType,
                    attacker
                );

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

                    if (
                        this.isPlayer(projectile.owner.id) ||
                        this.isPlayer(target.id)
                    )
                        this.game.socket.send(Packets.Projectile, [
                            Packets.ProjectileOpcode.Impact,
                            info.id,
                            target.id
                        ]);

                    if (info.hitType === Modules.Hits.Explosive)
                        target.explosion = true;

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

                attacker.performAction(
                    attacker.orientation,
                    Modules.Actions.Attack
                );
                attacker.triggerHealthBar();

                return;

            case 'player':
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

                const hitPointsData = info.hitPoints;
                const manaData = info.mana;
                const equipments = [
                    info.armour,
                    info.weapon,
                    info.pendant,
                    info.ring,
                    info.boots
                ];

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
                        equipment.abilityLevel,
                        equipment.power
                    );
                });

                player.loadHandler(this.game);

                this.addEntity(player);

                return;
        }

        if (!entity) return;

        const sprite = this.getSprite(
            info.type === 'item' ? 'item-' + info.string : info.string
        );

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

    isPlayer(id) {
        return this.game.player.id === id;
    }

    get(id) {
        if (id in this.entities) return this.entities[id];

        return null;
    }

    exists(id) {
        return id in this.entities;
    }

    removeEntity(entity) {
        this.grids.removeFromPathingGrid(entity.gridX, entity.gridY);
        this.grids.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);

        delete this.entities[entity.id];
    }

    clean(ids) {
        ids = ids[0];

        _.each(this.entities, (entity) => {
            if (ids) {
                if (
                    ids.indexOf(parseInt(entity.id)) < 0 &&
                    entity.id !== this.game.player.id
                )
                    this.removeEntity(entity);
            } else if (entity.id !== this.game.player.id)
                this.removeEntity(entity);
        });

        this.grids.resetPathingGrid();
    }

    clearPlayers(exception) {
        _.each(this.entities, (entity) => {
            if (entity.id !== exception.id && entity.type === 'player')
                this.removeEntity(entity);
        });

        this.grids.resetPathingGrid();
    }

    addEntity(entity) {
        if (this.entities[entity.id]) return;

        this.entities[entity.id] = entity;
        this.registerPosition(entity);

        if (
            !(entity instanceof Item && entity.dropped) &&
            !this.renderer.isPortableDevice()
        )
            entity.fadeIn(this.game.time);
    }

    removeItem(item) {
        if (!item) return;

        this.grids.removeFromItemGrid(item, item.gridX, item.gridY);
        this.grids.removeFromRenderingGrid(item, item.gridX, item.gridY);

        delete this.entities[item.id];
    }

    registerPosition(entity) {
        if (!entity) return;

        if (
            entity.type === 'player' ||
            entity.type === 'mob' ||
            entity.type === 'npc' ||
            entity.type === 'chest'
        ) {
            this.grids.addToEntityGrid(entity, entity.gridX, entity.gridY);

            /* if (entity.type !== 'player' || entity.nonPathable)
                          this.grids.addToPathingGrid(entity.gridX, entity.gridY); */
        }

        if (entity.type === 'item')
            this.grids.addToItemGrid(entity, entity.gridX, entity.gridY);

        this.grids.addToRenderingGrid(entity, entity.gridX, entity.gridY);
    }

    registerDuality(entity) {
        if (!entity) return;

        this.grids.entityGrid[entity.gridY][entity.gridX][entity.id] = entity;

        this.grids.addToRenderingGrid(entity, entity.gridX, entity.gridY);

        if (entity.nextGridX > -1 && entity.nextGridY > -1) {
            this.grids.entityGrid[entity.nextGridY][entity.nextGridX][
                entity.id
            ] = entity;

            /* if (!(entity instanceof Player))
                        this.grids.pathingGrid[entity.nextGridY][entity.nextGridX] = 1; */
        }
    }

    unregisterPosition(entity) {
        if (!entity) return;

        this.grids.removeEntity(entity);
    }

    getSprite(name) {
        return this.sprites.sprites[name];
    }

    getAll() {
        return this.entities;
    }

    forEachEntity(callback) {
        _.each(this.entities, (entity) => {
            callback(entity);
        });
    }

    forEachEntityAround(x, y, radius, callback) {
        for (let i = x - radius, maxI = x + radius; i <= maxI; i++) {
            for (let j = y - radius, maxJ = y + radius; j <= maxJ; j++) {
                if (this.map.isOutOfBounds(i, j)) continue;

                _.each(this.grids.renderingGrid[j][i], (entity) => {
                    callback(entity);
                });
            }
        }
    }
}
