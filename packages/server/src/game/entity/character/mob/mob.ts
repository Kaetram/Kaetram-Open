import Utils from '@kaetram/common/util/utils';

import Constants from '../../../../util/constants';
import Items from '../../../../util/items';
import Mobs, { MobData, MobDrops } from '../../../../util/mobs';
import Character, { CharacterState } from '../character';
import MobHandler from './mobhandler';

import type Area from '../../../../map/areas/area';
import type Areas from '../../../../map/areas/areas';
import type Player from '../player/player';

interface MobState extends CharacterState {
    hitPoints: number;
    maxHitPoints: number;
    attackRange: number;
    level: number;
    hiddenName: boolean;
}

export default class Mob extends Character {
    private data!: MobData;
    private drops!: MobDrops;

    public respawnDelay!: number;

    public boss = false;
    public static = false;
    public hiddenName = false;
    public miniboss = false;

    public achievementId!: number;

    public maxRoamingDistance = 3;

    // private handler!: MobHandler;

    public area!: Area;

    private loadCallback?(): void;
    private refreshCallback?(): void;
    private respawnCallback?(): void;

    public forceTalkCallback?: (message: string) => void;
    public roamingCallback?(): void;

    public constructor(id: number, instance: string, x: number, y: number) {
        super(id, 'mob', instance, x, y);

        if (!Mobs.exists(id)) return;

        let data = Mobs.Ids[id];

        this.data = data;
        this.hitPoints = data.hitPoints;
        this.maxHitPoints = data.hitPoints;
        this.drops = data.drops;

        this.respawnDelay = data.spawnDelay;

        this.level = data.level;

        this.armourLevel = data.armour;
        this.weaponLevel = data.weapon;
        this.attackRange = data.attackRange;
        this.aggroRange = this.data.aggroRange;
        this.aggressive = data.aggressive;
        this.attackRate = data.attackRate;
        this.movementSpeed = data.movementSpeed;

        this.spawnLocation = [x, y];

        this.projectileName = this.getProjectileName();
    }

    public load(): void {
        // this.handler =
        new MobHandler(this);

        this.loadCallback?.();
    }

    public refresh(): void {
        this.hitPoints = this.data.hitPoints;
        this.maxHitPoints = this.data.hitPoints;

        this.refreshCallback?.();
    }

    public getDrop(): { id: number; count: number } | null {
        if (!this.drops) return null;

        let random = Utils.randomInt(0, Constants.DROP_PROBABILITY),
            dropObjects = Object.keys(this.drops),
            item = dropObjects[Utils.randomInt(0, dropObjects.length - 1)];

        if (random > this.drops[item]) return null;

        let count = item === 'gold' ? Utils.randomInt(this.level, this.level * 5) : 1;

        return {
            id: Items.stringToId(item)!,
            count
        };
    }

    public override getProjectileName(): string {
        return this.data.projectileName || 'projectile-pinearrow';
    }

    public canAggro(player: Player): boolean {
        if (this.target) return false;

        if (!this.aggressive) return false;

        if (Math.floor(this.level * 1.5) < player.level && !this.alwaysAggressive) return false;

        if (!player.hasAggressionTimer()) return false;

        return this.isNear(player, this.aggroRange);
    }

    public destroy(): void {
        this.dead = true;
        this.clearTarget();
        this.resetPosition();
        this.respawn();

        this.area?.removeEntity(this);
    }

    public return(): void {
        this.clearTarget();
        this.resetPosition();
        this.setPosition(this.x, this.y);
    }

    public override isRanged(): boolean {
        return this.attackRange > 1;
    }

    private distanceToSpawn(): number {
        return this.getCoordDistance(this.spawnLocation[0], this.spawnLocation[1]);
    }

    public isAtSpawn(): boolean {
        return this.x === this.spawnLocation[0] && this.y === this.spawnLocation[1];
    }

    public isOutsideSpawn(): boolean {
        return this.distanceToSpawn() > this.spawnDistance;
    }

    public addToChestArea(chestAreas: Areas): void {
        let area = chestAreas.inArea(this.x, this.y);

        area?.addEntity(this);
    }

    /**
     * Some entities are static (only spawned once during an event)
     * Meanwhile, other entities act as an illusion to another entity,
     * so the respawning script is handled elsewhere.
     */
    private respawn(): void {
        if (!this.static || this.respawnDelay === -1) return;

        setTimeout(() => {
            this.respawnCallback?.();
        }, this.respawnDelay);
    }

    public override getState(): MobState {
        let base = super.getState() as MobState;

        base.hitPoints = this.hitPoints;
        base.maxHitPoints = this.maxHitPoints;
        base.attackRange = this.attackRange;
        base.level = this.level;
        base.hiddenName = this.hiddenName; // TODO - Just don't send name when hiddenName present.

        return base;
    }

    private resetPosition(): void {
        this.setPosition(this.spawnLocation[0], this.spawnLocation[1]);
    }

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    public onRefresh(callback: () => void): void {
        this.refreshCallback = callback;
    }

    public onForceTalk(callback: (message: string) => void): void {
        this.forceTalkCallback = callback;
    }

    public onRoaming(callback: () => void): void {
        this.roamingCallback = callback;
    }
}
