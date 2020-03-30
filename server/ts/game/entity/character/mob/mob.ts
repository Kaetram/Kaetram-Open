import * as _ from 'underscore';
import Character from '../character';
import Mobs from '../../../../util/mobs';
import Utils from '../../../../util/utils';
import Items from '../../../../util/items';
import Constants from '../../../../util/constants';
import MobHandler from './mobhandler';
import Area from '../../../../map/area';

/**
 *
 */
class Mob extends Character {
    public data: any;

    public attackRange: any;

    public getCoordDistance: any;

    public spawnLocation: any;

    public x: any;

    public y: any;

    public spawnDistance: any;

    public world: any;

    public loadCallback: any;

    public respawnCallback: any;

    public returnCallback: any;

    public refreshCallback: any;

    public deathCallback: any;

    public handler: any;

    public hitPoints: any;

    public maxHitPoints: any;

    public drops: any;

    public level: any;

    public hasTarget: any;

    public aggressive: any;

    public alwaysAggressive: any;

    public isNear: any;

    public aggroRange: any;

    public dead: any;

    public clearTarget: any;

    public area: any;

    public setPosition: any;

    public static: any;

    public respawnDelay: any;

    public hiddenName: any;

    public roaming: boolean;

    public miniboss: any;

    public boss: any;

    public lastAttacker: any;

    public armourLevel: any;

    public weaponLevel: any;

    public attackRate: any;

    public maxRoamingDistance: number;

    constructor(id, instance, x, y, world?) {
        super(id, 'mob', instance, x, y);

        if (!Mobs.exists(id)) return;

        this.world = world;

        this.data = Mobs.Ids[this.id];
        this.hitPoints = this.data.hitPoints;
        this.maxHitPoints = this.data.hitPoints;
        this.drops = this.data.drops;

        this.respawnDelay = this.data.spawnDelay;

        this.level = this.data.level;

        this.armourLevel = this.data.armour;
        this.weaponLevel = this.data.weapon;
        this.attackRange = this.data.attackRange;
        this.aggroRange = this.data.aggroRange;
        this.aggressive = this.data.aggressive;
        this.attackRate = this.data.attackRate;

        this.spawnLocation = [x, y];

        this.dead = false;
        this.boss = false;
        this.static = false;
        this.hiddenName = false;

        this.roaming = false;
        this.maxRoamingDistance = 3;

        this.projectileName = this.getProjectileName();
    }

    load() {
        this.handler = new MobHandler(this, this.world);

        if (this.loadCallback) this.loadCallback();
    }

    refresh() {
        this.hitPoints = this.data.hitPoints;
        this.maxHitPoints = this.data.hitPoints;

        if (this.refreshCallback) this.refreshCallback();
    }

    getDrop() {
        if (!this.drops) return null;

        const random = Utils.randomInt(0, Constants.DROP_PROBABILITY);
        const dropObjects = Object.keys(this.drops);
        const item = dropObjects[Utils.randomInt(0, dropObjects.length - 1)];

        if (random > this.drops[item]) return null;

        const count = item === 'gold' ? this.level * 5 : 1;

        return {
            id: Items.stringToId(item),
            count
        };
    }

    getProjectileName() {
        return this.data.projectileName
            ? this.data.projectileName
            : 'projectile-pinearrow';
    }

    canAggro(player) {
        if (this.hasTarget()) return false;

        if (!this.aggressive) return false;

        if (
            Math.floor(this.level * 1.5) < player.level &&
            !this.alwaysAggressive
        )
            return false;

        if (!player.hasAggressionTimer()) return false;

        return this.isNear(player, this.aggroRange);
    }

    destroy() {
        this.dead = true;
        this.clearTarget();
        this.resetPosition();
        this.respawn();

        if (this.area) this.area.removeEntity(this);
    }

    return() {
        this.clearTarget();
        this.resetPosition();
        this.setPosition(this.x, this.y);
    }

    isRanged() {
        return this.attackRange > 1;
    }

    distanceToSpawn() {
        return this.getCoordDistance(
            this.spawnLocation[0],
            this.spawnLocation[1]
        );
    }

    isAtSpawn() {
        return (
            this.x === this.spawnLocation[0] && this.y === this.spawnLocation[1]
        );
    }

    isOutsideSpawn() {
        return this.distanceToSpawn() > this.spawnDistance;
    }

    addToChestArea(chestAreas) {
        const area = _.find(chestAreas, (area: Area) => {
            return area.contains(this.x, this.y);
        });

        if (area) area.addEntity(this);
    }

    respawn() {
        /**
         * Some entities are static (only spawned once during an event)
         * Meanwhile, other entities act as an illusion to another entity,
         * so the resawning script is handled elsewhere.
         */

        if (!this.static || this.respawnDelay === -1) return;

        setTimeout(() => {
            if (this.respawnCallback) this.respawnCallback();
        }, this.respawnDelay);
    }

    getState() {
        const base = super.getState();

        base.hitPoints = this.hitPoints;
        base.maxHitPoints = this.maxHitPoints;
        base.attackRange = this.attackRange;
        base.level = this.level;
        base.hiddenName = this.hiddenName; // TODO: Just don't send name when hiddenName present.

        return base;
    }

    // We take the plateau level of where the entity spawns.
    getPlateauLevel() {
        return this.world.map.getPlateauLevel(
            this.spawnLocation[0],
            this.spawnLocation[1]
        );
    }

    resetPosition() {
        this.setPosition(this.spawnLocation[0], this.spawnLocation[1]);
    }

    onLoad(callback) {
        this.loadCallback = callback;
    }

    onRespawn(callback) {
        this.respawnCallback = callback;
    }

    onReturn(callback) {
        this.returnCallback = callback;
    }

    onRefresh(callback) {
        this.refreshCallback = callback;
    }

    onDeath(callback) {
        this.deathCallback = callback;
    }
}

export default Mob;
