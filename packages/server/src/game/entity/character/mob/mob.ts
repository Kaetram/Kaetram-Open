import Utils from '@kaetram/common/util/utils';

import Character from '../character';
import MobHandler from './handler';

import type Area from '../../../map/areas/area';
import type Areas from '../../../map/areas/areas';
import type Player from '../player/player';

import { Modules, Opcodes } from '@kaetram/common/network';
import { EntityData } from '../../entity';
import { MobData } from '@kaetram/common/types/mob';

import rawData from '../../../../../data/mobs.json';
import log from '@kaetram/common/util/log';
import World from '../../../world';
import { Movement } from '@kaetram/server/src/network/packets';

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
    public respawnDelay = Modules.MobDefaults.RESPAWN_DELAY; // Use default spawn delay if not specified.
    public aggroRange = Modules.MobDefaults.AGGRO_RANGE;
    public aggressive = false;
    public roaming = false;
    private poisonous = false;
    private combatPlugin = '';

    // TODO - Specify this in the mob data
    public roamDistance = Modules.MobDefaults.ROAM_DISTANCE;

    public boss = false;
    public respawnable = true;
    public hiddenName = false;
    public miniboss = false;

    public achievementId!: number;

    // private handler!: MobHandler;

    public area!: Area;

    private respawnCallback?(): void;
    public forceTalkCallback?: (message: string) => void;
    public roamingCallback?(): void;

    public constructor(world: World, key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.Mob), world, key, x, y);

        this.spawnX = x;
        this.spawnY = y;

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[Mob] Could not find data for ${key}.`);
            return;
        }

        this.experience = this.data.experience || this.experience;

        // TODO - Use points system for entities as well.
        if (this.data.hitPoints) this.hitPoints.updateHitPoints([this.data.hitPoints]);

        this.name = this.data.name!;
        this.drops = this.data.drops || this.drops;
        this.level = this.data.level || this.level;
        this.attackLevel = this.data.attackLevel || this.attackLevel;
        this.defenseLevel = this.data.defenseLevel || this.defenseLevel;
        this.attackRange = this.data.attackRange || this.attackRange;
        this.aggroRange = this.data.aggroRange || this.aggroRange;
        this.aggressive = this.data.aggressive!;
        this.attackRate = this.data.attackRate || this.attackRate;
        this.respawnDelay = this.data.respawnDelay || this.respawnDelay;
        this.movementSpeed = this.data.movementSpeed || this.movementSpeed;
        this.poisonous = this.data.poisonous!;
        this.hiddenName = this.data.hiddenName!;

        // TODO - After refactoring projectile system
        this.projectileName = this.data.projectileName || this.projectileName;
        this.combatPlugin = this.data.combatPlugin!;

        // Initialize a mob handler to `handle` our callbacks.
        new MobHandler(this);

        // The roaming interval
        setInterval(this.roamingCallback!, Modules.Constants.ROAMING_FREQUENCY);
    }

    /**
     * Destroys the mob and removes all targets. Begins
     * the respawning process if the mob is respawnable.
     * Sets the mob's position back to the spawn point,
     * and registers the mob's death with the area.
     */

    public destroy(): void {
        this.dead = true;

        this.respawn();
        this.clearTarget();
        this.clearAttackers();

        this.setPosition(this.spawnX, this.spawnY);

        this.area?.removeEntity(this);

        this.combat.stop();
    }

    /**
     * Moves the mob and broadcasts the action
     * to all the adjacent regions.
     * @param x The new x position of the mob.
     * @param y The new y position of the mob.
     */

    public move(x: number, y: number): void {
        this.setPosition(x, y);

        this.world.push(Modules.PacketType.Regions, {
            region: this.region,
            packet: new Movement(Opcodes.Movement.Move, {
                instance: this.instance,
                x,
                y
            })
        });
    }

    /**
     * Primitive function for drop generation. Will be rewritten.
     */

    public getDrop(): { key: string; count: number } | null {
        if (!this.drops) return null;

        let random = Utils.randomInt(0, Modules.Constants.DROP_PROBABILITY),
            dropObjects = Object.keys(this.drops),
            item = dropObjects[Utils.randomInt(0, dropObjects.length - 1)];

        if (random > this.drops[item]) return null;

        let count = item === 'gold' ? Utils.randomInt(this.level, this.level * 5) : 1;

        return {
            key: item,
            count
        };
    }

    /**
     * Checks if the mob can aggro the player depending on information
     * about the mob and player. An always aggressive mob will aggro
     * regardless of the player's level, otherwise, if the player's level
     * is roughly 1.5x greater than the mob's, then the mob does not aggro.
     * @param player Player entity to test aggro conditions against.
     * @returns Whether or not the mob can aggro the player.
     */

    public canAggro(player: Player): boolean {
        if (!this.aggressive) return false;

        if (this.target) return false;

        if (Math.floor(this.level * 1.5) < player.level && !this.alwaysAggressive) return false;

        if (!player.hasAggressionTimer()) return false;

        return this.isNear(player, this.aggroRange);
    }

    /**
     * Extracts the area the mob is currently in and adds it to it.
     * @param chestAreas The areas for chests for us to extract the mob's area.
     */

    public addToChestArea(chestAreas: Areas): void {
        // In case chests area does not exist in the map.
        if (!chestAreas) return;

        let area = chestAreas.inArea(this.x, this.y);

        area?.addEntity(this);
    }

    /**
     * Moves the mob back to the spawn point.
     */

    public sendToSpawn(): void {
        this.combat.stop();

        this.move(this.spawnX, this.spawnY);
    }

    /**
     * Checks if the distance between the mob's current position and the spawn
     * point is greater than the roam distance.
     * @returns Whether or not the mob should return to the spawn.
     */

    public shouldReturnToSpawn(): boolean {
        return Utils.getDistance(this.x, this.y, this.spawnX, this.spawnY) > this.roamDistance;
    }

    /**
     * If the attack range is greater than 1, then the mob
     * is a ranged entity.
     * @returns If the mob is ranged or not.
     */

    public override isRanged(): boolean {
        return this.attackRange > 1;
    }

    /**
     * Some entities are static (only spawned once during an event)
     * Meanwhile, other entities act as an illusion to another entity,
     * so the respawning script is handled elsewhere.
     */
    private respawn(): void {
        if (!this.respawnable) return;

        setTimeout(() => this.respawnCallback?.(), this.respawnDelay);
    }

    /**
     * Takes mob file and serializes it by adding extra
     * variables into the EntityData interface.
     * @returns Entity data with mob elements inserted.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        // TODO - Update this once we get around fixing up the client.
        data.hitPoints = this.hitPoints.getHitPoints();
        data.maxHitPoints = this.hitPoints.getMaxHitPoints();
        data.attackRange = this.attackRange;
        data.level = this.level;
        data.hiddenName = this.hiddenName; // TODO - Just don't send name when hiddenName present.

        return data;
    }

    /**
     * Callback for when the mob respawns.
     */

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }

    /**
     * A callback for when the mob is forced to display a speech bubble.
     * @param callback The message in a string format of what the mob says.
     */

    public onForceTalk(callback: (message: string) => void): void {
        this.forceTalkCallback = callback;
    }

    /**
     * Callback for when roaming occurs.
     */

    public onRoaming(callback: () => void): void {
        this.roamingCallback = callback;
    }
}
