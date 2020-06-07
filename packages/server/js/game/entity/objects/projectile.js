/* global module */

let Entity = require('../entity');

class Projectile extends Entity {

    constructor(id, instance) {
        super(id, 'projectile', instance);

        let self = this;

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
        let self = this;

        self.x = x;
        self.y = y;
    }

    /**
     * TODO - Merge setTarget() && setStaticTarget into one function.
     */

    setTarget(target) {
        let self = this;

        self.target = target;

        self.destX = target.x;
        self.destY = target.y;
    }

    setStaticTarget(x, y) {
        let self = this;

        self.static = true;

        self.destX = x;
        self.destY = y;
    }

    getData() {
        let self = this;

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
        }
    }
}

module.exports = Projectile;