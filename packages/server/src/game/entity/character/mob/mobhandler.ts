import Mobs from '../../../../util/mobs';

import type Player from '../player/player';
import type Mob from './mob';

export default class MobHandler {
    combat;
    // map: Map;

    spawnLocation;
    maxRoamingDistance;

    roamingInterval: NodeJS.Timeout | null = null;

    constructor(private mob: Mob) {
        this.combat = mob.combat;

        this.spawnLocation = mob.spawnLocation;
        this.maxRoamingDistance = mob.maxRoamingDistance;

        this.load();
        this.loadCallbacks();
    }

    load(): void {
        if (!this.mob.roaming) return;

        this.roamingInterval = setInterval(() => {
            this.mob.roamingCallback?.();
        }, 5000);
    }

    loadCallbacks(): void {
        // Combat plugin has its own set of callbacks.
        if (Mobs.hasCombatPlugin(this.mob.id)) return;

        this.mob.onLoad(() => {
            if (this.mob.miniboss) this.mob.setMinibossData();
        });

        this.mob.onDeath(() => {
            if (!this.mob.miniboss || !this.combat) return;

            this.combat.forEachAttacker((attacker) => {
                const player = attacker as Player;

                player?.finishAchievement(this.mob.achievementId);
            });
        });

        // TODO - Implement posion on Mobs
    }

    forceTalk(message: string): void {
        this.mob.forceTalkCallback?.(message);
    }
}
