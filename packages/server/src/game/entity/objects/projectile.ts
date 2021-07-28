import Entity from '../entity';
import * as Modules from '@kaetram/common/src/modules';
import Character from '../character/character';

export interface ProjectileData {
    id: string;
    name: string;
    characterId: string;
    targetId: string;
    damage: number;
    special: never;
    hitType: Modules.Hits | null;
    type: string;
}

export default class Projectile extends Entity {
    startX: number;
    startY: number;

    destX: number;
    destY: number;

    target: Entity | null;

    damage: number;

    hitType: Modules.Hits | null; // TODO
    owner?: Character; // TODO

    static = false;
    special: never;

    constructor(id: Modules.Projectiles, instance: string) {
        super(id, 'projectile', instance);

        this.startX = -1;
        this.startY = -1;

        this.destX = -1;
        this.destY = -1;

        this.target = null;

        this.damage = -1;

        this.hitType = null;
    }

    setStart(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * TODO - Merge setTarget() && setStaticTarget into one function.
     */

    setTarget(target: Entity): void {
        this.target = target;

        this.destX = target.x;
        this.destY = target.y;
    }

    setStaticTarget(x: number, y: number): void {
        this.static = true;

        this.destX = x;
        this.destY = y;
    }

    getData(): ProjectileData | undefined {
        /**
         * Refrain from creating a projectile unless
         * an owner and a target are available.
         */

        if (!this.owner || !this.target) return;

        return {
            id: this.instance,
            name: this.owner.projectileName,
            characterId: this.owner.instance,
            targetId: this.target.instance,
            damage: this.damage,
            special: this.special,
            hitType: this.hitType,
            type: this.type
        };
    }
}
