import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Formulas from '../../../../info/formulas';
import Queue from './queue';
import Hit from './hit';

import type { HitData } from '@kaetram/common/types/info';
import type Entities from '../../../../controllers/entities';
import type World from '../../../world';
import type Character from '../character';
import type Mob from '../mob/mob';
import type Player from '../player/player';
import { Movement, Combat as CombatPacket, Projectile } from '@kaetram/server/src/network/packets';

export default class Combat {
    public started = false;

    private lastAttack = Date.now();

    // Create the combat queue.
    private queue: Queue = new Queue();

    private attackLoop?: NodeJS.Timeout | undefined;

    public constructor(private character: Character) {}

    /**
     * Starts the attack loop.
     */

    public start(): void {
        this.started = true;

        this.attackLoop = setInterval(this.handleAttackLoop.bind(this), this.character.attackRate);
    }

    /**
     * Stops the combat loops and clears the queue.
     */

    public stop(): void {
        // Clear the loops.
        if (this.attackLoop) clearInterval(this.attackLoop);

        this.attackLoop = undefined;

        // Clear target and attackers.
        this.character.clearTarget();
        this.character.clearAttackers();

        // Clear the queue.
        this.queue.clear();

        // Mark the combat as stopped.
        this.started = false;
    }

    /**
     * Starts a combat session if not started and attacks
     * the target if possible.
     * @param target The target we are going to attack.
     */

    public attack(target: Character): void {
        // Already started, let the loop handle it.
        if (this.started) return;

        this.character.setTarget(target);

        this.start();

        /**
         * Initiates an attack right away prior to letting the first interval
         * kick in. Essential when a player starts a combat. The timeout is added
         * in order to give the player a small delay effect, otherwise the
         * combat is perceived as 'too snappy.'
         */

        if (this.canAttack()) setTimeout(() => this.handleAttackLoop(), 250);
    }

    /**
     * Callback loop handler for when the character should attempt to perform an attack.
     * The attack loop consists of checking viable targets
     * by looking at the attackers (if it's a non-player character)
     * and then checking if the character is in range of the target.
     */

    private handleAttackLoop(): void {
        if (!this.character.hasTarget()) return;

        if (this.character.isNearTarget()) {
            let hit = this.createHit();

            this.character.target?.hit(hit.getDamage(), this.character);

            this.sendAttack(hit);
        } else this.sendFollow();
    }

    /**
     * Relays to the nearby regions that the character
     * is attacking their target.
     */

    private sendAttack(hit: Hit): void {
        this.character.sendToRegions(
            new CombatPacket(Opcodes.Combat.Hit, {
                instance: this.character.instance,
                target: this.character.target!.instance,
                hit: hit.serialize()
            })
        );
    }

    /**
     * Sends a follow request to the nearby regions. This
     * notifies all the players that this current character
     * is following their target.
     */

    private sendFollow(): void {
        if (this.character.isMob()) console.log('Mob is following');
        this.character.sendToRegions(
            new Movement(Opcodes.Movement.Follow, {
                instance: this.character.instance,
                target: this.character.target!.instance
            })
        );
    }

    /**
     * Creates a Hit object with the data from the current
     * character and its target.
     * @returns A new hit object with the damage.
     */

    private createHit(): Hit {
        return new Hit(
            Modules.Hits.Damage,
            Formulas.getDamage(this.character, this.character.target!),
            this.character.isRanged()
        );
    }

    /**
     * Checks if a character can attack. This is used more-so for
     * players exiting and re-entering combat loops.
     * @returns If the difference in time from now to the last attack is greater than the attack rate.
     */

    private canAttack(): boolean {
        return Date.now() - this.lastAttack >= this.character.attackRate;
    }
}
