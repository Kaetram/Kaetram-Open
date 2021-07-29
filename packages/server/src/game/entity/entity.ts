import Items from '../../util/items';
import Mobs from '../../util/mobs';
import NPCs from '../../util/npcs';

import type Combat from './character/combat/combat';
import type Mob from './character/mob/mob';
import type Player from './character/player/player';
import type NPC from './npc/npc';
import type Item from './objects/item';

export interface EntityState {
    string?: string | null;
    type: string;
    id: string;
    name: string | null;
    x: number;
    y: number;
    nameColour?: string;
    customScale?: number;
}

abstract class Entity {
    public x;
    public y;

    public oldX;
    public oldY;

    public combat!: Combat;

    public dead = false;
    public recentRegions: string[] = [];
    /** Entity Instances */
    private invisibles: { [instance: string]: Entity } = {};
    /** Entity IDs */
    protected invisiblesIds: number[] = [];

    public username!: string;
    public instanced = false;
    public region!: string | null;

    private setPositionCallback?(): void;

    public specialState!: 'boss' | 'miniboss' | 'achievementNpc' | 'area' | 'questNpc' | 'questMob';
    public customScale!: number;
    public roaming = false;

    protected constructor(
        public id: number,
        public type: string,
        public instance: string,
        x?: number,
        y?: number
    ) {
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

    public getCoordDistance(toX: number, toY: number): number {
        let x = Math.abs(this.x - toX),
            y = Math.abs(this.y - toY);

        return x > y ? x : y;
    }

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;

        this.setPositionCallback?.();
    }

    public updatePosition(): void {
        this.oldX = this.x;
        this.oldY = this.y;
    }

    /**
     * Used for determining whether an entity is
     * within a given range to another entity.
     * Especially useful for ranged attacks and whatnot.
     */
    protected isNear(entity: Entity, distance: number): boolean {
        let dx = Math.abs(this.x - entity.x),
            dy = Math.abs(this.y - entity.y);

        return dx <= distance && dy <= distance;
    }

    public isAdjacent(entity: Entity): boolean {
        return entity && this.getDistance(entity) < 2;
    }

    public isNonDiagonal(entity: Entity): boolean {
        return this.isAdjacent(entity) && !(entity.x !== this.x && entity.y !== this.y);
    }

    protected hasSpecialAttack(): boolean {
        return false;
    }

    public isMob(): this is Mob {
        return this.type === 'mob';
    }

    private isNPC(): this is NPC {
        return this.type === 'npc';
    }

    private isItem(): this is Item {
        return this.type === 'item';
    }

    public isPlayer(): this is Player {
        return this.type === 'player';
    }

    public onSetPosition(callback: () => void): void {
        this.setPositionCallback = callback;
    }

    private addInvisible(entity: Entity): void {
        this.invisibles[entity.instance] = entity;
    }

    private addInvisibleId(entityId: number): void {
        this.invisiblesIds.push(entityId);
    }

    private removeInvisible(entity: Entity): void {
        delete this.invisibles[entity.instance];
    }

    private removeInvisibleId(entityId: number): void {
        let index = this.invisiblesIds.indexOf(entityId);

        if (index > -1) this.invisiblesIds.splice(index, 1);
    }

    public hasInvisible(entity: Entity): boolean {
        return entity.instance in this.invisibles;
    }

    public hasInvisibleId(entityId: number): boolean {
        return this.invisiblesIds.includes(entityId);
    }

    private hasInvisibleInstance(instance: string): boolean {
        return instance in this.invisibles;
    }

    public getState(): EntityState {
        let string = this.isMob()
                ? Mobs.idToString(this.id)
                : this.isNPC()
                ? NPCs.idToString(this.id)
                : Items.idToString(this.id),
            name = this.isMob()
                ? Mobs.idToName(this.id)
                : this.isNPC()
                ? NPCs.idToName(this.id)
                : Items.idToName(this.id),
            data: EntityState = {
                type: this.type,
                id: this.instance,
                string,
                name,
                x: this.x,
                y: this.y
            };

        if (this.specialState) data.nameColour = this.getNameColour();

        if (this.customScale) data.customScale = this.customScale;

        return data;
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
}

export default Entity;
