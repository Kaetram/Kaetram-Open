/* global module */

import Mobs from '../../util/mobs';
import Items from '../../util/items';
import NPCs from '../../util/npcs';
import Combat from './character/combat/combat';
import Player from './character/player/player';

class Entity {

    public id: number;
    public type: string;
    public instance: string;

    public x: number;
    public y: number;
    public oldX: number;
    public oldY: number;

    public combat: Combat;

    public dead: boolean;
    public recentRegions: any;
    public invisibles: any;
    public invisiblesIds: any;

    public username: string;
    public instanced: boolean;
    public region: string;

    setPositionCallback: Function;

    specialState: any;
    customScale: any;
    roaming: any;

    constructor(id: number, type: string, instance: string, x?: number, y?: number) {
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

    /** Uninitialized Variables **/

    isOutsideSpawn(): boolean {
        return false;
    }

    removeTarget() {}

    return() {}

    openChest(_player?: Player) {}

    hasTarget(): boolean {
        return false;
    }

    setTarget(_target: any) {}

    /****************************/

    getDistance(entity: Entity) {
        let x = Math.abs(this.x - entity.x),
            y = Math.abs(this.y - entity.y);

        return x > y ? x : y;
    }

    getCoordDistance(toX: number, toY: number) {
        let x = Math.abs(this.x - toX),
            y = Math.abs(this.y - toY);

        return x > y ? x : y;
    }

    setPosition(x: number, y: number) {
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

    isNear(entity: Entity, distance: number) {
        let dx = Math.abs(this.x - entity.x),
            dy = Math.abs(this.y - entity.y);

        return dx <= distance && dy <= distance;
    }

    isAdjacent(entity: Entity) {
        return entity && this.getDistance(entity) < 2;
    }

    isNonDiagonal(entity: Entity) {
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

    onSetPosition(callback: Function) {
        this.setPositionCallback = callback;
    }

    addInvisible(entity: Entity) {
        this.invisibles[entity.instance] = entity;
    }

    addInvisibleId(entityId: number) {
        this.invisiblesIds.push(entityId);
    }

    removeInvisible(entity: Entity) {
        delete this.invisibles[entity.instance];
    }

    removeInvisibleId(entityId: number) {
        let index = this.invisiblesIds.indexOf(entityId);

        if (index > -1)
            this.invisiblesIds.splice(index, 1);
    }

    hasInvisible(entity: Entity) {
        return entity.instance in this.invisibles;
    }

    hasInvisibleId(entityId: number) {
        return this.invisiblesIds.indexOf(entityId) > -1;
    }

    hasInvisibleInstance(instance: string) {
        return instance in this.invisibles;
    }

    getState() {
        let string = this.isMob() ? Mobs.idToString(this.id) : (this.isNPC() ? NPCs.idToString(this.id) : Items.idToString(this.id)),
            name = this.isMob() ? Mobs.idToName(this.id) : (this.isNPC() ? NPCs.idToName(this.id) : Items.idToName(this.id)),
            data: any = {
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

export default Entity;
