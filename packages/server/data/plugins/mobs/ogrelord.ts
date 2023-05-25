import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Character from '@kaetram/server/src/game/entity/character/character';
import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

export default class OgreLord extends Default {
    private dialogues: string[] = [
        'The great ogre lord will trample over you!',
        'No, do not touch my onions!',
        'Me smash you!'
    ];

    private positions: Position[] = [
        { x: 240, y: 65 },
        { x: 248, y: 65 },
        { x: 240, y: 70 },
        { x: 248, y: 70 }
    ];

    // Waves of minions the boss spawns.
    private firstWaveMinions = false;
    private secondWaveMinions = false;

    // Minion keys for waves
    private minionKeys = ['ogre', 'ironogre'];

    public constructor(mob: Mob) {
        super(mob);

        // Start the random dialogue interval and run it every 15 seconds.
        setInterval(() => this.randomDialogue(), 15_000);
    }

    /**
     * Override for the hit callback. When the Ogre Lord falls beneath
     * 50% and 25% health, he will spawn minions.
     * @param damage Damage being dealt to the mob.
     * @param attacker (Optional) The attacker who is dealing the damage.
     */

    protected override handleHit(damage: number, attacker?: Character): void {
        super.handleHit(damage, attacker);

        this.handleMinions();
    }

    /**
     * Override for the respawn function. We reset the boss back
     * to default status and remove all the minion wave checks.
     */

    protected override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        // Removes all the minions from the list.
        for (let minion of Object.values(this.minions)) minion.deathCallback?.();

        // Clear all boss properties.
        this.firstWaveMinions = false;
        this.secondWaveMinions = false;
    }

    /**
     * Handles the logic checking for minion spawning and creates them.
     */

    private handleMinions(): void {
        if (this.isHalfHealth() && !this.firstWaveMinions) this.spawnMinions(0);
        else if (this.isQuarterHealth() && !this.secondWaveMinions) this.spawnMinions(1);
    }

    /**
     * Spawn a minion at each of the respective positions specified. We pick the
     * minion key depending on the wave we're currently on.
     * @param wave The wave of minions to spawn.
     */

    private spawnMinions(wave: number): void {
        let key = this.minionKeys[wave];

        // Iterate through the positions and spawn a mob at each one.
        for (let position of this.positions) {
            let minion = super.spawn(key, position.x, position.y),
                target = super.getTarget();

            // Have the minions attack one of the boss' attackers.
            if (target) minion.combat.attack(target);
        }

        // Prevent the boss from spawning more minions afterwards.
        if (wave === 0) this.firstWaveMinions = true;
        else if (wave === 1) this.secondWaveMinions = true;

        // Spawn minions text message.
        this.mob.talkCallback?.('My minions will surely help defeat you!');
    }

    /**
     * Picks a random dialogue text from the list and creates a talk
     * callback for the mob.
     */

    private randomDialogue(): void {
        if (!this.mob.combat.started) return;

        let dialogue = this.dialogues[Utils.randomInt(0, this.dialogues.length - 1)];

        this.mob.talkCallback?.(dialogue);
    }
}
