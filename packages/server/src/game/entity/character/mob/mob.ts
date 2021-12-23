import Utils from '@kaetram/common/util/utils';

import Items from '../../../../info/items';
import Character from '../character';
import MobHandler from './mobhandler';

import type Area from '../../../map/areas/area';
import type Areas from '../../../map/areas/areas';
import type Player from '../player/player';

import data from '../../../../../data/mobs.json';

import { Modules } from '@kaetram/common/network';
import { EntityData } from '../../entity';

export default class Mob extends Character {
    private spawnX: number;
    private spawnY: number;

    public experience = Modules.MobDefaults.Experience; // Use default experience if not specified.
    private drops?: { [itemKey: string]: number };
    private spawnDelay = Modules.MobDefaults.SpawnDelay; // Use default spawn delay if not specified.

    // Mob data

    // private data!: MobData;
    // private drops!: MobDrops;

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
    private respawnCallback?(): void;

    public forceTalkCallback?: (message: string) => void;
    public roamingCallback?(): void;

    public constructor(id: number, x: number, y: number) {
        super(id, 'mob', Utils.createInstance(Modules.EntityType.Mob), x, y);

        this.spawnX = x;
        this.spawnY = y;

        // if (!Mobs.exists(id)) return;

        // let data = Mobs.Ids[id];

        // this.data = data;
        // this.hitPoints = data.hitPoints;
        // this.maxHitPoints = data.hitPoints;
        // this.drops = data.drops;

        // this.respawnDelay = data.spawnDelay;

        // this.level = data.level;

        // this.armourLevel = data.armour;
        // this.weaponLevel = data.weapon;
        // this.attackRange = data.attackRange;
        // this.aggroRange = this.data.aggroRange;
        // this.aggressive = data.aggressive;
        // this.attackRate = data.attackRate;
        // this.movementSpeed = data.movementSpeed;

        // this.projectileName = this.getProjectileName();
    }

    public load(): void {
        // this.handler =
        new MobHandler(this);

        this.loadCallback?.();
    }

    public getDrop(): { id: number; count: number } | null {
        if (!this.drops) return null;

        let random = Utils.randomInt(0, Modules.Constants.DROP_PROBABILITY),
            dropObjects = Object.keys(this.drops),
            item = dropObjects[Utils.randomInt(0, dropObjects.length - 1)];

        if (random > this.drops[item]) return null;

        let count = item === 'gold' ? Utils.randomInt(this.level, this.level * 5) : 1;

        return {
            id: Items.stringToId(item)!,
            count
        };
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
        return Utils.getDistance(this.x, this.y, this.spawnX, this.spawnY);
    }

    public isAtSpawn(): boolean {
        return this.x === this.spawnX && this.y === this.spawnY;
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

    public override serialize(): EntityData {
        let data = super.serialize();

        data.hitPoints = this.hitPoints;
        data.maxHitPoints = this.maxHitPoints;
        data.attackRange = this.attackRange;
        data.level = this.level;
        data.hiddenName = this.hiddenName; // TODO - Just don't send name when hiddenName present.

        return data;
    }

    private resetPosition(): void {
        this.setPosition(this.spawnX, this.spawnY);
    }

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    public onForceTalk(callback: (message: string) => void): void {
        this.forceTalkCallback = callback;
    }

    public onRoaming(callback: () => void): void {
        this.roamingCallback = callback;
    }
}
