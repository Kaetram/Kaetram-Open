/* global module */

class CombatQueue {

    constructor() {
        this.hitQueue = [];
    }

    add(hit) {
        this.hitQueue.push(hit);
    }

    hasQueue() {
        return this.hitQueue.length > 0;
    }

    clear() {
        this.hitQueue = [];
    }

    getHit() {
        let self = this;

        if (self.hitQueue.length < 1)
            return;

        return self.hitQueue.shift().getData();
    }

}

module.exports = CombatQueue;