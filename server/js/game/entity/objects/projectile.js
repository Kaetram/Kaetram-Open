/* global module */

const Entity = require('../entity');

class Projectile extends Entity {
    constructor(id, instance) {
        super(id, 'projectile', instance);

        const self = this;

        self.startX = -1;
        self.startY = -1;

        self.destX = -1;
        self.destY = -1;

        self.target = null;

        self.damage = -1;

        self.hitType = null;

        self.owner = null;
    }

    setStart(x, y) {
        const self = this;

        self.x = x;
        self.y = y;
    }

    /**
     * TODO - Merge setTarget() && setStaticTarget into one function.
     */

    setTarget(target) {
        const self = this;

        self.target = target;

        self.destX = target.x;
        self.destY = target.y;
    }

    setStaticTarget(x, y) {
        const self = this;

        self.static = true;

        self.destX = x;
        self.destY = y;
    }

    getData() {
        const self = this;

        /**
         * Refrain from creating a projectile unless
         * an owner and a target are available.
         */

        if (!self.owner || !self.target)
            return;

        return {
            id: self.instance,
            name: self.owner.projectileName,
            characterId: self.owner.instance,
            targetId: self.target.instance,
            damage: self.damage,
            special: self.special,
            hitType: self.hitType,
            type: self.type
        };
    }
}

module.exports = Projectile;
