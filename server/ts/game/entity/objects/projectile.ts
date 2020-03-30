import Entity from '../entity';

/**
 *
 */
class Projectile extends Entity {
    public x: any;

    public y: any;

    public target: any;

    public destX: any;

    public destY: any;

    public static: any;

    public owner: any;

    public instance: any;

    public damage: any;

    public special: any;

    public hitType: any;

    public type: any;

    startX: number;

    startY: number;

    constructor(id, instance) {
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

    setStart(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * TODO: Merge setTarget() && setStaticTarget into one function.
     */

    setTarget(target) {
        this.target = target;

        this.destX = target.x;
        this.destY = target.y;
    }

    setStaticTarget(x, y) {
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
