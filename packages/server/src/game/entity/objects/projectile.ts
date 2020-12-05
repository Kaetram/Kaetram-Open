/* global module */

import Entity from '../entity';

class Projectile extends Entity {
    startX: number;
    startY: number;

    destX: number;
    destY: number;

    target: Entity;

    damage: number;

    hitType: any; // TODO
    owner: any; // TODO

    static: boolean;
    special: any;

    constructor(id: number, instance: string) {
        super(id, 'projectile', instance);

        this.startX = -1;
        this.startY = -1;

        this.destX = -1;
        this.destY = -1;

        this.target = null;

        this.damage = -1;

        this.hitType = null;

        this.owner = null;
    }

    setStart(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * TODO - Merge setTarget() && setStaticTarget into one function.
     */

    setTarget(target: Entity) {
        this.target = target;

        this.destX = target.x;
        this.destY = target.y;
    }

    setStaticTarget(x: number, y: number) {
        this.static = true;

        this.destX = x;
        this.destY = y;
    }

    getData() {
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

export default Projectile;
