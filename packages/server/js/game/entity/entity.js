/* global module */

let Mobs = require('../../util/mobs'),
    Items = require('../../util/items'),
    NPCs = require('../../util/npcs');

class Entity {

    constructor(id, type, instance, x, y) {
        this.id = id;
        this.type = type;
        this.instance = instance;

        this.x = x;
        this.y = y;

        this.oldX = x;
        this.oldY = y;

        this.combat = null;

        this.dead = false;
        this.recentRegions = [];

        this.invisibles = {}; // For Entity Instances
        this.invisiblesIds = []; // For Entity IDs
    }

    talk() {
        return null;
    }

    getCombat() {
        return null;
    }

    getDistance(entity) {
        let x = Math.abs(this.x - entity.x),
            y = Math.abs(this.y - entity.y);

        return x > y ? x : y;
    }

    getCoordDistance(toX, toY) {
        let x = Math.abs(this.x - toX),
            y = Math.abs(this.y - toY);

        return x > y ? x : y;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;

        if (this.setPositionCallback)
            this.setPositionCallback();
    }

    updatePosition() {
        this.oldX = this.x;
        this.oldY = this.y;
    }

    /**
     * Used for determining whether an entity is
     * within a given range to another entity.
     * Especially useful for ranged attacks and whatnot.
     */

    isNear(entity, distance) {
        let dx = Math.abs(this.x - entity.x),
            dy = Math.abs(this.y - entity.y);

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
        let index = this.invisiblesIds.indexOf(entityId);

        if (index > -1)
            this.invisiblesIds.splice(index, 1);
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
        let string = this.isMob() ? Mobs.idToString(this.id) : (this.isNPC() ? NPCs.idToString(this.id) : Items.idToString(this.id)),
            name = this.isMob() ? Mobs.idToName(this.id) : (this.isNPC() ? NPCs.idToName(this.id) : Items.idToName(this.id)),
            data = {
                type: this.type,
                id: this.instance,
                string: string,
                name: name,
                x: this.x,
                y: this.y
            };

        if (this.specialState)
            data.nameColour = this.getNameColour();

        if (this.customScale)
            data.customScale = this.customScale;

        return data;
    }

    getNameColour() {
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

module.exports = Entity;
