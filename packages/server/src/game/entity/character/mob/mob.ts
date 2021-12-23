import Utils from '@kaetram/common/util/utils';

import Items from '../../../../info/items';
import Character from '../character';
import MobHandler from './mobhandler';

import type Area from '../../../map/areas/area';
import type Areas from '../../../map/areas/areas';
import type Player from '../player/player';

import { Modules } from '@kaetram/common/network';
import { EntityData } from '../../entity';
import { MobData } from '@kaetram/common/types/mob';

import rawData from '../../../../../data/mobs.json';
import log from '@kaetram/common/util/log';

type RawData = {
    [key: string]: MobData;
};

export default class Mob extends Character {
    // TODO - Make private after moving callbacks into the mob file.
    public spawnX: number;
    public spawnY: number;

    // Mob data
    private data: MobData;

    public experience = Modules.MobDefaults.EXPERIENCE; // Use default experience if not specified.
    private drops: { [itemKey: string]: number } = {}; // Empty if not specified.
    private defenseLevel = Modules.MobDefaults.DEFENSE_LEVEL;
    private attackLevel = Modules.MobDefaults.ATTACK_LEVEL;
    private spawnDelay = Modules.MobDefaults.SPAWN_DELAY; // Use default spawn delay if not specified.
    public aggroRange = Modules.MobDefaults.AGGRO_RANGE;
    public aggressive = false;
    private poisonous = false;
    private combatPlugin = '';
    // TODO - Specify this in the mob data
    private roamDistance = Modules.MobDefaults.ROAM_DISTANCE;

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

    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.Mob), key, x, y);

        this.spawnX = x;
        this.spawnY = y;

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`Could not find data for ${key}.`);
            return;
        }

        this.experience = this.data.experience || this.experience;

        // TODO - Use points system for entities as well.
        this.hitPoints = this.data.hitPoints || this.hitPoints;
        this.maxHitPoints = this.hitPoints;

        this.drops = this.data.drops || this.drops;
        this.level = this.data.level || this.level;
        this.attackLevel = this.data.attackLevel || this.attackLevel;
        this.defenseLevel = this.data.defenseLevel || this.defenseLevel;
        this.attackRange = this.data.attackRange || this.attackRange;
        this.aggroRange = this.data.aggroRange || this.aggroRange;
        this.aggressive = this.data.aggressive!;
        this.attackRate = this.data.attackRate || this.attackRate;
        this.spawnDelay = this.data.spawnDelay || this.spawnDelay;
        this.movementSpeed = this.data.movementSpeed || this.movementSpeed;
        this.poisonous = this.data.poisonous!;
        this.hiddenName = this.data.hiddenName!;
        // TODO - After refactoring projectile system
        this.projectileName = this.data.projectileName || this.projectileName;
        this.combatPlugin = this.data.combatPlugin!;
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
        return this.distanceToSpawn() > this.roamDistance;
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
