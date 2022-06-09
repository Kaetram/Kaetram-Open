import type Mob from './mob';

import Utils from '@kaetram/common/util/utils';
import Map from '../../../map/map';
import World from '../../../world';
import Character from '../character';
import log from '@kaetram/common/util/log';

/**
 * The handler class file for the Mob object. We use this to better
 * organize callbacks and events instead of clumping them all.
 */

export default class Handler {
    private world: World;
    private map: Map;

    private plateauLevel: number;

    public constructor(private mob: Mob) {
        this.world = this.mob.world;
        this.map = this.world.map;

        // Store the original plateau level.
        this.plateauLevel = this.map.getPlateauLevel(this.mob.spawnX, this.mob.spawnY);

        this.mob.onMovement(this.handleMovement.bind(this));
        this.mob.onHit(this.handleHit.bind(this));
        this.mob.onDeath(this.handleDeath.bind(this));
        this.mob.onRespawn(this.handleRespawn.bind(this));
        this.mob.onRoaming(this.handleRoaming.bind(this));
        this.mob.onForceTalk(this.handleForceTalk.bind(this));
    }

    /**
     * Callback handler for every time the mob's position is changed.
     */

    private handleMovement(): void {
        if (!this.mob.hasTarget() && this.mob.outsideRoaming()) return this.mob.sendToSpawn();

        /**
         * We check if the user's target is outside the roaming area and
         * pick a new one if that is the case.
         */

        if (this.mob.outsideRoaming(this.mob.target))
            if (this.mob.getAttackerCount() > 1) this.mob.setTarget(this.mob.findNearestTarget());
            else this.mob.sendToSpawn();
    }

    /**
     * Callback for whenever a mob gets hit.
     */

    private handleHit(damage: number, attacker?: Character): void {
        if (this.mob.dead || !attacker) return;

        if (!this.mob.hasAttacker(attacker)) this.mob.addAttacker(attacker);

        if (!this.mob.combat.started) this.mob.combat.attack(this.mob.findNearestTarget());
    }

    /**
     * Callback for when a death occurs and who the last attacker was.
     */

    private handleDeath(attacker?: Character): void {
        // Stops the attacker's combat if the character is dead.
        if (attacker) attacker.combat.stop();

        // Spawn item drops.
        let drop = this.mob.getDrop();

        if (drop) this.world.entities.spawnItem(drop.key, this.mob.x, this.mob.y, true, drop.count);

        if (attacker?.isPlayer()) {
            attacker.addExperience(this.mob.experience);
            attacker.killCallback?.(this.mob);
        }

        this.world.entities.remove(this.mob);
        this.world.cleanCombat(this.mob);

        this.mob.destroy();
    }

    /**
     * Callback handler for when the mob respawn is triggered.
     */

    private handleRespawn(): void {
        this.mob.dead = false;
        this.mob.hitPoints.reset();

        this.world.entities.addMob(this.mob);
    }

    /**
     * This is the function handling the mob roaming. We essentially pick a position
     * about the starting point and have the mob walk there if it's valid. This new position
     * must not be colliding, be an empty tile, be a door, must not be outside the roaming distance,
     * must not be the same as the mob's current position, and the mob must have not started
     * a combat session.
     * The plateau is another level of checking, this is used to make sure that certain
     * mobs do not walk outside a predefined boundary of theirs.
     */

    private handleRoaming(): void {
        // Ensure the mob isn't dead first.
        if (this.mob.dead) return;

        let { x, y, spawnX, spawnY, roamDistance, combat } = this.mob,
            newX = spawnX + Utils.randomInt(-roamDistance, roamDistance),
            newY = spawnY + Utils.randomInt(-roamDistance, roamDistance),
            distance = Utils.getDistance(spawnX, spawnY, newX, newY);

        // Do not roam while in combat.
        if (combat.started) return;

        // Prevent mobs from going outside of their roaming radius.
        if (distance < roamDistance) return;

        // No need to move if the new position is the same as the current.
        if (newX === x && newY === y) return;

        /**
         * A plateau defines an imaginary z-axis in a 2D space. A mob is essentially
         * bound to its current plateau level and cannot walk outside of it. Imagine
         * the starting area with the rats in the 'cave', we do not want them to walk
         * outside of the cave onto the ladder since that does not make sense. We
         * create a plateau level for that cave, and since the mobs can only roam
         * on their own plateau level they are bound to that cave.
         */

        if (this.plateauLevel !== this.map.getPlateauLevel(newX, newY)) return;

        // Check if the new position is a collision.
        if (this.map.isColliding(newX, newY)) return;

        // Don't have mobs block a door.
        if (this.map.isDoor(newX, newY)) return;

        this.mob.move(newX, newY);
    }

    /**
     * Forces a mob to display a text bubble above them.
     * @param message The message we are sending to the region.
     */

    private handleForceTalk(message: string): void {
        log.debug('this is a force talk action happening lolll');
    }
}
