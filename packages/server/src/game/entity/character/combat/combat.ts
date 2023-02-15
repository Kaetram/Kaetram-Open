import Hit from './hit';

import Formulas from '../../../../info/formulas';
import { Combat as CombatPacket, Spawn } from '../../../../network/packets';

import log from '@kaetram/common/util/log';
import { Modules, Opcodes } from '@kaetram/common/network';

import type Character from '../character';

export default class Combat {
    public started = false;

    private lastAttack = 0;

    // The combat loop
    private loop?: NodeJS.Timeout | undefined;

    private startCallback?: () => void;
    private stopCallback?: () => void;
    private attackCallback?: () => void;
    private loopCallback?: () => void;

    public constructor(private character: Character) {}

    /**
     * Starts the attack loop. Prevent duplicate loops from being started.
     */

    public start(): void {
        if (this.started) return;

        this.started = true;

        this.startCallback?.();

        /**
         * Start the loop at a third the attack rate with a 15 millisecond offset. This is
         * so we can condense the entire combat loop into one interval.
         */

        if (this.loop) return;

        this.loop = setInterval(this.handleLoop.bind(this), this.character.getAttackRate() / 2);
    }

    /**
     * Stops the combat loop and removes targets/attackers.
     */

    public stop(): void {
        // Clean up the combat loop.
        if (this.loop) clearInterval(this.loop);

        this.loop = undefined;

        // Clear target and attackers.
        this.character.clearTarget();
        this.character.clearAttackers();

        this.stopCallback?.();

        // Mark the combat as stopped.
        this.started = false;
    }

    /**
     * Function is used by a character when their attack rate undergoes a change. We do not
     * want to stop the combat, but we do want to update the loop.
     */

    public updateLoop(): void {
        if (!this.loop) return;

        clearInterval(this.loop);

        this.loop = setInterval(this.handleLoop.bind(this), this.character.getAttackRate() / 2);
    }

    /**
     * Starts a combat session if not started and attacks
     * the target if possible.
     * @param target The target we are going to attack.
     */

    public attack(target: Character): void {
        // Cannot attack non-character targets. This is for extra safety.
        if (!target.isCharacter()) return log.warning(`Invalid target for ${this.character.key}`);

        // Already started, let the loop handle it.
        this.character.setTarget(target);

        if (this.started) return;

        this.start();

        /**
         * Initiates an attack right away prior to letting the first interval
         * kick in. Essential when a player starts a combat. The timeout is added
         * in order to give the player a small delay effect, otherwise the
         * combat is perceived as 'too snappy.'
         */

        if (this.canAttack()) setTimeout(() => this.handleLoop(), 450);
    }

    /**
     * Callback loop handler for when the character should attempt to perform an attack.
     * The attack loop consists of checking viable targets
     * by looking at the attackers (if it's a non-player character)
     * and then checking if the character is in range of the target.
     */

    private handleLoop(): void {
        if (!this.character.hasTarget()) return this.stop();

        // Do not attack while teleporting.
        if (this.character.teleporting) return;

        this.loopCallback?.();

        this.checkTargetPosition();

        if (this.character.isNearTarget()) {
            if (!this.canAttack()) return;

            let hit = this.createHit();

            this.sendAttack(hit);

            this.lastAttack = Date.now();

            this.attackCallback?.();
        } else this.character.follow();
    }

    /**
     * Ensures that the target is adjacent to the player and not on top.
     */

    private checkTargetPosition(): void {
        if (!this.character.isOnSameTile()) return;

        this.character.target!.findAdjacentTile();
    }

    /**
     * Relays to the nearby regions that the character
     * is attacking their target.
     */

    private sendAttack(hit: Hit): void {
        // Ranged combat depends on when the projectile connects with the target.
        if (this.character.isRanged()) return this.sendRangedAttack(hit);

        this.character.sendToRegions(
            new CombatPacket(Opcodes.Combat.Hit, {
                instance: this.character.instance,
                target: this.character.target!.instance,
                hit: hit.serialize()
            })
        );

        // Handle combat damage here since melee is instant.
        this.character.target?.hit(hit.getDamage(), this.character, hit.aoe);
    }

    /**
     * A ranged attack creates a projectile and relays that information to
     * the nearby regions. The projectile collision is what handles
     * the damage
     * @param hit Information about the projectile.
     */

    private sendRangedAttack(hit: Hit): void {
        // Only archery based weapons check for arrows.
        if (!this.character.isMagic() && !this.character.hasArrows()) return this.stop();

        let projectile = this.character.world.entities.spawnProjectile(
            this.character,
            this.character.target!,
            hit
        );

        // Spawn the projectile in the game client.
        this.character.sendToRegions(new Spawn(projectile));
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
            this.character.isRanged(),
            this.character.getAoE()
        );
    }

    /**
     * Checks if a character can attack. This is used more-so for
     * players exiting and re-entering combat loops.
     * @returns If the difference in time from now to the last attack is greater than the attack rate.
     */

    private canAttack(): boolean {
        return Date.now() - this.lastAttack >= this.character.getAttackRate();
    }

    /**
     * @returns Whether or not 10 seconds from last attack has passed.
     */

    public expired(): boolean {
        return Date.now() - this.lastAttack > 10_000;
    }

    /**
     * Callback for when the combat starts.
     */

    public onStart(callback: () => void): void {
        this.startCallback = callback;
    }

    /**
     * Callback for when the combat stops.
     */

    public onStop(callback: () => void): void {
        this.stopCallback = callback;
    }

    /**
     * Callback for whenever the character performs an attack.
     */

    public onAttack(callback: () => void): void {
        this.attackCallback = callback;
    }

    /**
     * Callback for every time the combat loop is called.
     */

    public onLoop(callback: () => void): void {
        this.loopCallback = callback;
    }
}
