import Character from './character/character';

import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type { EntityData, EntityDisplayInfo } from '@kaetram/common/types/entity';
import type Combat from './character/combat/combat';
import type Player from './character/player/player';
import type NPC from './npc/npc';
import type Item from './objects/item';
import type Projectile from './objects/projectile';
import type Mob from './character/mob/mob';

type MovementCallback = (x: number, y: number) => void;

/**
 * An abstract class for every entity in the game. The `instance`
 * represents a unique ID assigned to each entity. `key` represents
 * the entity's data identification (and image file name).
 */

abstract class Entity {
    private type: number; // EntityType
    public name = '';

    public x = -1;
    public y = -1;

    public oldX = -1;
    public oldY = -1;

    public combat!: Combat;

    public dead = false;

    public username!: string;
    public region = -1;
    public colour = ''; // name colour displayed for the entity
    public scale = 0; // scale of the entity (default if not specified)
    public visible = true; // used to hide an entity from being sent to the client.

    public recentRegions: number[] = []; // regions the entity just left

    public movementCallback?: MovementCallback;

    protected constructor(public instance = '', public key = '', x: number, y: number) {
        this.type = Utils.getEntityType(this.instance);

        this.updatePosition(x, y);
    }

    /**
     * Updates the entity's position in the grid. We also store
     * the previous position for the entity prior to updating.
     * @param x The new x grid position.
     * @param y The new y grid position.
     */

    public setPosition(x: number, y: number): void {
        // On initialization just set oldX/Y to current position
        this.oldX = this.x;
        this.oldY = this.y;

        this.x = x;
        this.y = y;

        // Make a callback
        this.movementCallback?.(x, y);
    }

    /**
     * This is an external set position function used when initializing an entity.
     * This prevents any whacky subclass calls to `setPosition` when we first create
     * the entity.
     * @param x The new x grid position.
     * @param y The new y grid position.
     */

    public updatePosition(x: number, y: number): void {
        this.oldX = this.x === -1 ? x : this.x;
        this.oldY = this.y === -1 ? y : this.y;

        this.x = x;
        this.y = y;
    }

    /**
     * Update the entity's position.
     * @param region The new region we are setting.
     */

    public setRegion(region: number): void {
        this.region = region;
    }

    /**
     * Replaces the array indicating recently left regions with a new array.
     * @param regions The new array of recent regions the entity left from.
     */

    public setRecentRegions(regions: number[]): void {
        this.recentRegions = regions;
    }

    /**
     * Finds the distance between the current entity object and the
     * specified entity parameter.
     * @param entity Entity we are finding distance of.
     * @returns The approximate distance in tiles between entities.
     */

    public getDistance(entity: Entity): number {
        return Math.abs(this.x - entity.x) + Math.abs(this.y - entity.y);
    }

    /**
     * Superclass implementation for grabbing the display info. We provide the
     * player with the bare minimum in case this function gets called without
     * the entity actually containing alternate display info.
     * @param _var1 Optional parameter used in the subclasses.
     * @returns A EntityDisplayInfo object containing the instance of the entity.
     */

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getDisplayInfo(_var1?: unknown): EntityDisplayInfo {
        return {
            instance: this.instance
        };
    }

    /**
     * A superclass implementation for whether or not an entity
     * contains update data. For example, a mob may be contain
     * this data if it is part of an area or is a quest-based mob.
     * Display info refers to slight alterations to an entity's appearance.
     * This can be a different colour for their name, or a different scale.
     * @param _var1 Optional paramater used by the subclasses.
     */

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public hasDisplayInfo(_var1: unknown): boolean {
        return false;
    }

    /**
     * Checks the distance between the current entity object and another
     * specified entity. The distance paramter specifies how far the other
     * entity can be for us to return true.
     * @param entity The entity we are comparing against.
     * @param distance The offset distance we are looking for.
     * @returns Whether the `entity` parameter is `distance` or closer to our entity.
     */

    protected isNear(entity: Entity, distance: number): boolean {
        let dx = Math.abs(this.x - entity.x),
            dy = Math.abs(this.y - entity.y);

        return dx <= distance && dy <= distance;
    }

    /**
     * Checks if an entity is next to the current entity object.
     * @param entity Entity are checking distance of.
     * @returns Whether the distance of the entity we are checking is at MOST 1 block away.
     */

    public isAdjacent(entity: Entity): boolean {
        return this.getDistance(entity) < 2;
    }

    /**
     * Checks if the other entity is next to the current entity but not diganonally adjacent.
     * @param entity Entity we ar checking.
     * @returns That the entity is either up, right, left, or down of this entity object.
     */

    public isNonDiagonal(entity: Entity): boolean {
        return this.isAdjacent(entity) && !(entity.x !== this.x && entity.y !== this.y);
    }

    /**
     * Returns whether or not the entity is visible. An entity may be hidden when
     * an admin wants to not be shown to other players, or when a player finishes
     * a quest and we may want to hide an NPC.
     * @param player Optional parameter used to check if the player has finished
     * a quest associated with the entity.
     * @returns Whether or not the entity is visible.
     */

    public isVisible(player?: Player): boolean {
        // Return visibility status if no player provided or entity is not an NPC.
        if (!player || !this.isNPC()) return this.visible;

        let quest = player.quests.getQuestFromNPC(this as NPC, true);

        // No quest found, return the visibility status of the entity.
        if (!quest) return this.visible;

        // Check if quest is completed and check if NPC is hidden.
        return !(quest.isFinished() && quest.isHiddenNPC(this.key));
    }

    /**
     * Used to check whether the entity is a character that can move and perform combat.
     * @returns Whether the entity is a character.
     */

    public isCharacter(): this is Character {
        return this instanceof Character;
    }

    /**
     * Checks whether the entity's type is a mob.
     * @returns Whether the type is equal to the EntityType mob.
     */

    public isMob(): this is Mob {
        return this.type === Modules.EntityType.Mob;
    }

    /**
     * Checks whether the entity's type is a NPC.
     * @returns Whether the type is equal to the EntityType NPC.
     */

    public isNPC(): this is NPC {
        return this.type === Modules.EntityType.NPC;
    }

    /**
     * Checks whether the entity's type is a item.
     * @returns Whether the type is equal to the EntityType item.
     */

    public isItem(): this is Item {
        return this.type === Modules.EntityType.Item;
    }

    /**
     * Checks whether the entity's type is a chest.
     * @returns Whether the type is equal to the EntityType chest.
     */

    public isChest(): this is Item {
        return this.type === Modules.EntityType.Chest;
    }

    /**
     * Checks whether the entity's type is a player.
     * @returns Whether the type is equal to the EntityType player.
     */

    public isPlayer(): this is Player {
        return this.type === Modules.EntityType.Player;
    }

    /**
     * Checks whether or not the entity is a projectile.
     * @returns Whether the type is equal to the EntityType projectile.
     */

    public isProjectile(): this is Projectile {
        return this.type === Modules.EntityType.Projectile;
    }

    /**
     * This is entity superclass serialization. It provides
     * the absolute most basic data about the entity. Entities
     * that extend the Entity class will use this to get initial data
     * and add more information on top.
     * @returns Basic data about the entity like its instance, type, and position.
     */

    public serialize(): EntityData {
        let { instance, type, key, name, x, y } = this;

        return {
            instance,
            type,
            name,
            key,
            x,
            y
        };
    }

    /**
     * Callback every time there is a change in the absolute position.
     */

    public onMovement(callback: MovementCallback): void {
        this.movementCallback = callback;
    }
}

export default Entity;
