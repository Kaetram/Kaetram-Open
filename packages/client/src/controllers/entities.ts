import Character from '../entity/character/character';
import Mob from '../entity/character/mob/mob';
import NPC from '../entity/character/npc/npc';
import Player from '../entity/character/player/player';
import Chest from '../entity/objects/chest';
import Item from '../entity/objects/item';
import Projectile from '../entity/objects/projectile';
import log from '../lib/log';
import Grids from '../renderer/grids';

import { Modules } from '@kaetram/common/network';

import type { EntityData } from '@kaetram/common/types/entity';
import type { PlayerData } from '@kaetram/common/types/player';
import type Entity from '../entity/entity';
import type Game from '../game';
import type SpritesController from './sprites';

interface EntitiesCollection {
    [instance: string]: Entity;
}

export interface Movable {
    string: number;
    characterId: string;
    targetId: string;
    attackerId: string;
    hitType: number;
}

export default class EntitiesController {
    public grids: Grids;
    public sprites: SpritesController;

    public entities: EntitiesCollection = {};
    public decrepit: Entity[] = [];

    public constructor(private game: Game) {
        this.grids = new Grids(game.map);
        this.sprites = game.sprites;

        game.input.loadCursors();
    }

    /**
     * Creates a new entity based on the EntityData object we
     * received from the server. The entity is created depending
     * on the type specified. The code following is the base
     * entity data each entity contains (name, coordinates,
     * sprite key).
     * @param info EntityData containing information about an entity.
     */

    public create(info: EntityData): void {
        // Don't spawn if we receive our own player data somehow.
        if (this.isPlayer(info.instance)) return;

        // Entity already exists, don't respawn.
        if (info.instance in this.entities) return;

        let entity!: Entity;

        switch (info.type) {
            case Modules.EntityType.Chest: {
                entity = this.createChest(info.instance);
                break;
            }

            case Modules.EntityType.NPC: {
                entity = this.createNPC(info.instance);
                break;
            }

            case Modules.EntityType.Item: {
                entity = this.createItem(info);
                break;
            }

            case Modules.EntityType.Mob: {
                entity = this.createMob(info);
                break;
            }

            case Modules.EntityType.Projectile: {
                entity = this.createProjectile(info)!;
                break;
            }

            case Modules.EntityType.Player: {
                entity = this.createPlayer(info as PlayerData);
                break;
            }
        }

        // Something went wrong creating the entity.
        if (!entity) return log.error(`Failed to create entity ${info.instance}`);

        let sprite = this.game.sprites.get(entity.isItem() ? `item-${info.key}` : info.key);

        // Don't add entities that don't have a sprite.
        if (!sprite) return log.error(`Failed to create sprite for entity ${info.key}.`);

        // The name the player sees for an entity.
        entity.name = info.name;

        // Server-sided x and y coordinates are the `gridX` and `gridY` client coordinates.
        entity.setGridPosition(info.x, info.y);

        // Set the sprite and sprite idle speed.
        entity.setSprite(sprite);
        entity.setIdleSpeed(sprite.idleSpeed);

        // Begin the idling animation.
        entity.idle();

        this.addEntity(entity);

        // Start the entity handler.
        if (entity instanceof Character) entity.handler.load(this.game);
    }

    /**
     * Creates a new chest entity with the instance provided.
     * @param instance The instance of the chest entity.
     * @returns A new chest object.
     */

    private createChest(instance: string): Chest {
        return new Chest(instance);
    }

    /**
     * Creates a new NPC object with the instance string provided.
     * @param instance The instance of the NPC character.
     * @returns A new NPC object.
     */

    private createNPC(instance: string): NPC {
        return new NPC(instance);
    }

    /**
     * Creates a new item object with the instance, count, and enchantments.
     * @param info EntityData object containing item information.
     * @returns A new item object.
     */

    private createItem(info: EntityData): Item {
        return new Item(info.instance, info.count, info.enchantments);
    }

    /**
     * Creates a new mob object, sets data such as its health,
     * attack range, level, etc, and returns that object.
     * @param info The entity data object containing mob information.
     * @returns A new mob object.
     */

    private createMob(info: EntityData): Mob {
        let mob = new Mob(info.instance);

        mob.setHitPoints(info.hitPoints!, info.maxHitPoints);

        // Apply the mob-specific properties
        mob.attackRange = info.attackRange!;
        mob.level = info.level!;
        mob.hiddenName = info.hiddenName!;
        mob.movementSpeed = info.movementSpeed!;
        mob.orientation = info.orientation!;

        // Set the display info properties directly onto the mob.
        if (info.displayInfo) {
            if (info.displayInfo.colour) mob.nameColour = info.displayInfo.colour;
            if (info.displayInfo.scale) mob.customScale = info.displayInfo.scale;
        }

        return mob;
    }

    /**
     * Creates a projectile based on the provided entity data. The projectile
     * is a bit special in that it handles callbacks. This function will be further
     * refactored, and timing for projectile collision will be handled server-sided
     * instead of relying on the client to detect collision. Client should only
     * be responsible for rendering. Right now, this could potentially be exploited.
     * @param info Entity data containing projectile information.
     * @returns New projectile object.
     */

    private createProjectile(info: EntityData): Projectile | undefined {
        let attacker = this.get<Character>(info.ownerInstance!),
            target = this.get<Character>(info.targetInstance!);

        if (!attacker || !target) return undefined;

        attacker.lookAt(target);

        let projectile = new Projectile(info.instance, attacker);

        projectile.name = info.name;

        projectile.setStart(attacker.x, attacker.y);
        projectile.setTarget(target);

        projectile.angled = true;
        projectile.type = info.type;

        /**
         * Move this into the external overall function
         */

        projectile.onImpact(() => {
            /**
             * Data contained within the projectile is solely for rendering purposes.
             * The logic is handled in the backend.
             */

            let impactEffect = projectile.getImpactEffect();

            if (impactEffect !== Modules.Effects.None) target.setEffect(impactEffect);

            this.game.info.create(
                Modules.Hits.Damage,
                info.damage!,
                target.x,
                target.y,
                this.isPlayer(target.instance)
            );

            target.triggerHealthBar();

            this.unregisterPosition(projectile);
            delete this.entities[projectile.instance];
        });

        attacker.performAction(attacker.orientation, Modules.Actions.Attack);
        attacker.triggerHealthBar();

        return projectile;
    }

    /**
     * Creates a new player object based on the info provided.
     * @param info Entity data info to spawn the player.
     * @returns A new player object.
     */

    private createPlayer(info: PlayerData): Player {
        let player = new Player(info.instance);

        player.load(info);

        player.setSprite(this.game.sprites.get(player.getSpriteName()));

        return player;
    }

    /**
     * Checks if the instance provided is the same as the main player.
     * @param instance The instance we are checking.
     * @returns If the instance is the same as the main player's instance.
     */

    private isPlayer(instance: string): boolean {
        return this.game.player.instance === instance;
    }

    /**
     * Gets an entity based on its instance, an entity type
     * can be specified as long as its a sublcass of Entity.
     * @param instance The instance of the entity we are looking for.
     * @returns An entity object or subclass of Entity.
     */

    public get<E extends Entity>(instance: string): E {
        return this.entities[instance] as E;
    }

    /**
     * Adds an entity to the rendering grid and the list of entities.
     * We do not render in the fading if the user is on a mobile device.
     * @param entity The entity object we are adding.
     */

    public addEntity(entity: Entity): void {
        this.entities[entity.instance] = entity;
        this.registerPosition(entity);

        if (!(entity instanceof Item && entity.dropped)) entity.fadeIn(this.game.time);
    }

    /**
     * Removes an entity from the rendering grid, and also deletes
     * it from our entity controller list.
     * @param entity The entity we are removing.
     */

    public removeEntity(entity: Entity): void {
        this.unregisterPosition(entity);

        delete this.entities[entity.instance];
    }

    /**
     * Removes an item entity from the rendering grid and
     * deletes it from our controller's list of entities.
     * @param item The item instance we are removing.
     */

    public removeItem(item: Entity): void {
        this.unregisterPosition(item);

        delete this.entities[item.instance];
    }

    /**
     * Chests have a special remove method which requires them
     * to undergo the death animation before being removed.
     * @param chest Chest we are removing.
     */

    public removeChest(chest: Chest): void {
        chest.setSprite(this.game.sprites.getDeath());
        chest.animateDeath(() => {
            this.unregisterPosition(chest);

            delete this.entities[chest.instance];
        });
    }

    /**
     * Removes an NPC from the game and plays the death animation.
     * @param npc The NPC we are removing.
     */

    public removeNPC(npc: NPC): void {
        npc.setSprite(this.game.sprites.getDeath());
        npc.animateDeath(() => {
            this.unregisterPosition(npc);

            delete this.entities[npc.instance];
        });
    }

    /**
     * Registers an entity's position on the renderin grid.
     * @param entity The entity we are adding to rendering grid.
     */

    public registerPosition(entity: Entity): void {
        this.grids.addToRenderingGrid(entity);
    }

    /**
     * Removes an entity from the renderin grid.
     * @param entity The entity we are removing.
     */

    public unregisterPosition(entity: Entity): void {
        this.grids.removeFromRenderingGrid(entity);
    }

    /**
     * Decrepit entities are entities that are queued for deletion.
     * This occurs when we traverse regions and the need to despawn
     * entities no longer visible becomes necessary.
     */

    public clean(): void {
        if (this.decrepit.length === 0) return;

        for (let entity of this.decrepit) {
            // Prevent cleaning an entity that may have been removed from a different packet.
            if (!entity) continue;

            this.removeEntity(entity);
        }
    }

    /**
     * Temporary solution (that will probably become permanent because
     * I have a tendency of forgetting sorry) which removes the name
     * colour and scaling effect from all entities prior to receiving
     * new data.
     */

    public cleanDisplayInfo(): void {
        for (let entity of Object.values(this.entities)) {
            entity.nameColour = '';
            entity.customScale = 0;
        }
    }

    /**
     * Clears all player entities from our list.
     * @param exception A player type entity that we are excluding from the clear.
     */

    public clearPlayers(exception: Player): void {
        for (let entity of Object.values(this.entities))
            if (entity.isPlayer() && entity.instance !== exception.instance)
                this.removeEntity(entity);
    }

    /**
     * Shortcut for grabbing entity dictionary. Primarily used to increase
     * readability when accessing the `entities` class. (Prevent .entities.entities)
     * @returns The entities collection containing all loaded entities.
     */

    public getAll(): EntitiesCollection {
        return this.entities;
    }

    /**
     * Iterates through all the loaded entities and makes a callback for each one.
     * @param callback Contains the entity object currently being iterated.
     */

    public forEachEntity(callback: (entity: Entity) => void): void {
        for (let entity of Object.values(this.entities)) callback(entity);
    }
}
