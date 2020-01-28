/* global module */

let Mobs = require('../../util/mobs'),
    Items = require('../../util/items'),
    NPCs = require('../../util/npcs');

class Entity {

    constructor(id, type, instance, x, y) {
        let self = this;

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
        let self = this,
            x = Math.abs(self.x - entity.x),
            y = Math.abs(self.y - entity.y);

        return x > y ? x : y;
    }

    getCoordDistance(toX, toY) {
        let self = this,
            x = Math.abs(self.x - toX),
            y = Math.abs(self.y - toY);

        return x > y ? x : y;
    }

    setPosition(x, y) {
        let self = this;

        self.x = x;
        self.y = y;

        if (self.setPositionCallback)
            self.setPositionCallback();
    }

    updatePosition() {
        let self = this;

        self.oldX = self.x;
        self.oldY = self.y;
    }

    /**
     * Used for determining whether an entity is
     * within a given range to another entity.
     * Especially useful for ranged attacks and whatnot.
     */

    isNear(entity, distance) {
        let self = this,
            dx = Math.abs(self.x - entity.x),
            dy = Math.abs(self.y - entity.y);

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
        let self = this,
            index = self.invisiblesIds.indexOf(entityId);

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
        let self = this,
            string = self.isMob() ? Mobs.idToString(self.id) : (self.isNPC() ? NPCs.idToString(self.id) : Items.idToString(self.id)),
            name = self.isMob() ? Mobs.idToName(self.id) : (self.isNPC() ? NPCs.idToName(self.id) : Items.idToName(self.id)),
            data = {
                type: self.type,
                id: self.instance,
                string: string,
                name: name,
                x: self.x,
                y: self.y
            };

        if (self.specialState)
            data.nameColour = self.getNameColour();

        if (self.customScale)
            data.customScale = self.customScale;

        return data;
    }

    getNameColour() {
        let self = this;

        switch (self.specialState) {
            case 'boss':
                return '#660033';

            case 'miniboss':
                return '#cc3300';

            case 'achievementNpc':
                return '#669900';

            case 'area':
                return '#00aa00';

            case 'questNpc':
                return '#6699ff';

            case 'questMob':
                return '#0099cc';
        }
    }

}

module.exports = Entity;
