import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import { BubblePacket } from '@kaetram/common/network/impl';

import type Mob from './mob';
import type Map from '../../../map/map';
import type World from '../../../world';
import type Character from '../character';
import type Player from '../player/player';

/**
 * The handler class file for the Mob object. We use this to better
 * organize callbacks and events instead of clumping them all.
 */

export default class Handler {
    protected world: World;
    protected map: Map;

    public constructor(protected mob: Mob) {
        this.world = this.mob.world;
        this.map = this.world.map;

        this.mob.onMovement(this.handleMovement.bind(this));
        this.mob.onHit(this.handleHit.bind(this));
        this.mob.onDeath(this.handleDeath.bind(this));
        this.mob.onRespawn(this.handleRespawn.bind(this));
        this.mob.onRoaming(this.handleRoaming.bind(this));
        this.mob.onTalk(this.handleTalk.bind(this));

        // Combat callbacks
        this.mob.combat.onStart(this.handleCombatStart.bind(this));
        this.mob.combat.onStop(this.handleCombatStop.bind(this));
        this.mob.combat.onAttack(this.handleAttack.bind(this));
        this.mob.combat.onLoop(this.handleCombatLoop.bind(this));
    }

    /**
     * Callback handler for every time the mob's position is changed.
     */

    protected handleMovement(): void {
        // Mob is randomly roaming and exits the roaming area.
        if (!this.mob.hasTarget() && this.mob.outsideRoaming()) return this.mob.sendToSpawn();

        /**
         * We check if the user's target is outside the roaming area and
         * pick a new one if that is the case.
         */

        // We double the roaming distance for the sake of combat.
        if (
            this.mob.outsideRoaming(
                this.mob.target?.x,
                this.mob.target?.y,
                this.mob.roamDistance * 2
            )
        )
            if (this.mob.getAttackerCount() > 1) this.mob.setTarget(this.mob.findNearestTarget());
            else this.mob.sendToSpawn();
    }

    /**
     * Callback for whenever a mob gets hit.
     */

    protected handleHit(damage: number, attacker?: Character): void {
        if (!attacker) return;

        if (attacker.isPlayer()) attacker.handleExperience(damage);

        // This may get called simulatneously with the death callback, so we check here.
        if (this.mob.isDead()) return;

        this.mob.addAttacker(attacker);

        if (!this.mob.combat.started) this.mob.combat.attack(this.mob.findNearestTarget());
    }

    /**
     * Callback for when a death occurs and who the last attacker was.
     */

    protected handleDeath(attacker?: Character): void {
        // The damage table is used to calculate who should receive priority over the mob's drop.
        let damageTable = this.mob.getDamageTable();

        for (let index in damageTable) {
            let element = damageTable[index],
                [instance] = element,
                entity = this.world.entities.get(instance);

            /**
             * Ensure that the entity exists and that it's a player. Drops do not occur
             * if the entity that kills the mob is non-existent (i.e. if killed via command.)
             */

            if (!entity?.isPlayer()) continue;

            // Kill callback is sent to the player who dealt most amount of damage.
            if (parseInt(index) === 0) {
                // Register the kill as belonging to the player who dealt most amount of damage.
                entity.killCallback?.(this.mob);

                // Drop the mob's loot and pass the owner's username.
                this.mob.drop(entity as Player);
            }
        }

        // Stop the combat.
        this.mob.combat.stop();

        // Clear status effects.
        this.mob.status.clear();

        // Remove entity from chest area.
        this.mob.area?.removeEntity(this.mob, attacker);

        // Respawn the chest associated with the mob.
        this.mob.chest?.respawn();

        // Call the secondary death callback.
        this.mob.deathICallback?.(attacker);

        // Despawn entity from the world.
        this.world.entities.remove(this.mob);
        this.world.cleanCombat(this.mob);

        this.mob.destroy();
    }

    /**
     * Callback handler for when the mob respawn is triggered.
     */

    protected handleRespawn(): void {
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

    protected handleRoaming(): void {
        // Prevent roaming.
        if (!this.mob.roaming) return;

        // Ensure the mob isn't dead first.
        if (this.mob.dead) return;

        let { x, y, spawnX, spawnY, roamDistance, plateauLevel, combat } = this.mob,
            newX = spawnX + Utils.randomInt(-roamDistance, roamDistance),
            newY = spawnY + Utils.randomInt(-roamDistance, roamDistance),
            distance = Utils.getDistance(spawnX, spawnY, newX, newY);

        // Do not roam while in combat.
        if (combat.started) return;

        // Prevent mobs from going outside of their roaming radius.
        if (distance > roamDistance) return;

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

        if (plateauLevel !== this.map.getPlateauLevel(newX, newY)) return;

        // Check if the new position is a collision.
        if (this.map.isColliding(newX, newY)) return;

        // Don't have mobs block a door.
        if (this.map.isDoor(newX, newY)) return;

        // Don't have mobs walk on top of other entities.
        if (this.world.getGrids().hasEntityAt(x, y)) return;

        this.mob.setPosition(newX, newY);
    }

    /**
     * Forces a mob to display a text bubble above them.
     * @param text The message we are sending to the region.
     */

    protected handleTalk(text: string): void {
        this.mob.sendToRegions(
            new BubblePacket({
                instance: this.mob.instance,
                text
            })
        );
    }

    /**
     * Callback handler for when a mob starts combat.
     */

    protected handleCombatStart(): void {
        //
    }

    /**
     * Callback handler for when a mob stops combat.
     */

    protected handleCombatStop(): void {
        //
    }

    /**
     * Callback for when the mob attacks a character.
     */

    protected handleAttack(): void {
        //
    }

    /**
     * Callback for every time the mob's combat loop called.
     */

    protected handleCombatLoop(): void {
        if (this.mob.instance === this.mob.target?.instance) {
            log.general(`Mob ${this.mob.key} is attacking itself.`);

            return this.mob.combat.stop();
        }

        // Parses through the attackers and removes them if they are too far away.
        this.mob.forEachAttacker((attacker: Character) => {
            /**
             * If an attacker goes too far away from the mob then we remove him as
             * an attacker. If he has not attacked the mob for a certain amount of
             * time and he is not within the mob's attack range, then we remove him
             * as an attacker.
             */

            if (
                this.mob.getDistance(attacker) > this.mob.roamDistance * 2 ||
                (!this.mob.isNearTarget() &&
                    attacker.getLastAttack() > Modules.Constants.ATTACKER_TIMEOUT)
            )
                this.mob.removeAttacker(attacker);
        });

        // Ignore if we have only one attacker.
        if (this.mob.getAttackerCount() < 2 || !this.mob.canChangeTarget()) return;

        // Alternate targets if another one is nearby.
        let newTarget = this.mob.getRandomAttacker();

        // New target is too far away, so we ignore it.
        if (this.mob.getDistance(newTarget) >= this.mob.attackRange) return;

        // We have a new target, so we attack it.
        this.mob.combat.attack(newTarget);
    }
}
