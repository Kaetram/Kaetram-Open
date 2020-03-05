class CombatQueue {
    public hitQueue: any;

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
        if (this.hitQueue.length < 1) return;

        return this.hitQueue.shift().getData();
    }
}

export default CombatQueue;
