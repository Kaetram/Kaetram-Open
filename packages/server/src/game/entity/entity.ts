import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';
import Items from '../../info/items';
import Mobs from '../../info/mobs';
import NPCs from '../../info/npcs';

import type Combat from './character/combat/combat';
import type Mob from './character/mob/mob';
import type Player from './character/player/player';
import type NPC from './npc/npc';
import type Item from './objects/item';

/**
 * Entity data is referenced by the subclasses whenever
 * extra data needs to be included. Optional variables
 * listed below are used by the subclasses to include
 * additional information to transmit to the client.
 */

export interface EntityData {
    // Entity data
    instance: string;
    type: number;
    x: number;
    y: number;

    // Universal elements
    key?: string; // The key is the entity's identification
    name?: string; // Entity's name

    // Character data
    movementSpeed?: number;
    hitPoints?: number;
    maxHitPoints?: number;
    attackRange?: number;
    level?: number;
    hiddenName?: boolean;

    // Item data
    count?: number;
    ability?: number;
    abilityLevel?: number;

    // Player data
    // TODO
}

type MovementCallback = (x: number, y: number) => void;
type RegionCallback = (region: number) => void;

abstract class Entity {
    private type: number;

    public x = -1;
    public y = -1;

    public oldX = -1;
    public oldY = -1;

    public combat!: Combat;

    public dead = false;
    public recentRegions: string[] = [];

    public username!: string;
    public instanced = false;
    public region = -1;

    public oldRegions: number[] = [];

    public specialState!: 'boss' | 'miniboss' | 'achievementNpc' | 'area' | 'questNpc' | 'questMob';
    public customScale!: number;
    public roaming = false;

    public movementCallback?: MovementCallback;
    public regionCallback?: RegionCallback;

    protected constructor(public instance: string, x: number, y: number) {
        this.type = Utils.getEntityType(this.instance);

        this.x = x!;
        this.y = y!;

        this.oldX = x!;
        this.oldY = y!;
    }

    public getDistance(entity: Entity): number {
        let x = Math.abs(this.x - entity.x),
            y = Math.abs(this.y - entity.y);

        return x > y ? x : y;
    }

    private getNameColour(): string {
        switch (this.specialState) {
            case 'boss':
                return '#F60404';

            case 'miniboss':
                return '#ffbf00';

            case 'achievementNpc':
                return '#33cc33';

            case 'area':
                return '#00aa00';

            case 'questNpc':
                return '#6699ff';

            case 'questMob':
                return '#0099cc';
        }
    }

    /**
     * Updates the entity's position in the grid. We also store
     * the previous position for the entity prior to updating.
     * @param x The new x grid position.
     * @param y The new y grid position.
     */

    public setPosition(x: number, y: number): void {
        this.oldX = this.x;
        this.oldY = this.y;

        this.x = x;
        this.y = y;

        this.movementCallback?.(x, y);
    }

    /**
     * Update the entity's position.
     * @param region The new region we are setting.
     */

    public setRegion(region: number): void {
        this.region = region;
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

    public isAdjacent(entity: Entity): boolean {
        return this.getDistance(entity) < 2;
    }

    public isNonDiagonal(entity: Entity): boolean {
        return this.isAdjacent(entity) && !(entity.x !== this.x && entity.y !== this.y);
    }

    /**
     * Checks whether the entity's type is a mob.
     * @returns Whether the type is equal to the EntityType mob.
     */

    public isMob(): boolean {
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

    protected hasSpecialAttack(): boolean {
        return false;
    }

    /**
     * This is entity superclass serialization. It provides
     * the absolute most basic data about the entity. Entities
     * that extend the Entity class will use this to get initial data
     * and add more information on top.
     * @returns Basic data about the entity like its instance, type, and position.
     */

    public serialize(): EntityData {
        let { instance, type, x, y } = this;

        return {
            instance,
            type,
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

    /**
     * Callback whenever the entity's region changes.
     */

    public onRegion(callback: RegionCallback): void {
        this.regionCallback = callback;
    }
}

export default Entity;
