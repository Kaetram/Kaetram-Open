/* global module */

const Mobs = require('../../util/mobs');
const Items = require('../../util/items');
const NPCs = require('../../util/npcs');

class Entity {
    constructor(id, type, instance, x, y) {
        const self = this;

        self.id = id;
        self.type = type;
        self.instance = instance;

        self.x = x;
        self.y = y;

        self.oldX = x;
        self.oldY = y;

        self.combat = null;

        self.dead = false;
        self.recentRegions = [];

        self.invisibles = {}; // For Entity Instances
        self.invisiblesIds = []; // For Entity IDs
    }

    talk() {
        return null;
    }

    getCombat() {
        return null;
    }

    getDistance(entity) {
        const self = this;
        const x = Math.abs(self.x - entity.x);
        const y = Math.abs(self.y - entity.y);

        return x > y ? x : y;
    }

    getCoordDistance(toX, toY) {
        const self = this;
        const x = Math.abs(self.x - toX);
        const y = Math.abs(self.y - toY);

        return x > y ? x : y;
    }

    setPosition(x, y) {
        const self = this;

        self.x = x;
        self.y = y;

        if (self.setPositionCallback)
            self.setPositionCallback();
    }

    updatePosition() {
        const self = this;

        self.oldX = self.x;
        self.oldY = self.y;
    }

    /**
     * Used for determining whether an entity is
     * within a given range to another entity.
     * Especially useful for ranged attacks and whatnot.
     */

    isNear(entity, distance) {
        const self = this;
        const dx = Math.abs(self.x - entity.x);
        const dy = Math.abs(self.y - entity.y);

        return dx <= distance && dy <= distance;
    }

    isAdjacent(entity) {
        return entity && this.getDistance(entity) < 2;
    }

    isNonDiagonal(entity) {
        return this.isAdjacent(entity) && !(entity.x !== this.x && entity.y !== this.y);
    }

    hasSpecialAttack() {
        return false;
    }

    isMob() {
        return this.type === 'mob';
    }

    isNPC() {
        return this.type === 'npc';
    }

    isItem() {
        return this.type === 'item';
    }

    isPlayer() {
        return this.type === 'player';
    }

    onSetPosition(callback) {
        this.setPositionCallback = callback;
    }

    addInvisible(entity) {
        this.invisibles[entity.instance] = entity;
    }

    addInvisibleId(entityId) {
        this.invisiblesIds.push(entityId);
    }

    removeInvisible(entity) {
        delete this.invisibles[entity.instance];
    }

    removeInvisibleId(entityId) {
        const self = this;
        const index = self.invisiblesIds.indexOf(entityId);

        if (index > -1)
            self.invisiblesIds.splice(index, 1);
    }

    hasInvisible(entity) {
        return entity.instance in this.invisibles;
    }

    hasInvisibleId(entityId) {
        return this.invisiblesIds.indexOf(entityId) > -1;
    }

    hasInvisibleInstance(instance) {
        return instance in this.invisibles;
    }

    getState() {
        const self = this;
        const string = self.isMob() ? Mobs.idToString(self.id) : (self.isNPC() ? NPCs.idToString(self.id) : Items.idToString(self.id));
        const name = self.isMob() ? Mobs.idToName(self.id) : (self.isNPC() ? NPCs.idToName(self.id) : Items.idToName(self.id));

        return {
            type: self.type,
            id: self.instance,
            string: string,
            name: name,
            x: self.x,
            y: self.y
        };
    }
}

module.exports = Entity;
