import Mobs from '../../../../util/mobs';
import Combat from '../combat/combat';
import Player from '../player/player';
import Mob from './mob';

export default class MobHandler {
    mob: Mob;
    combat: Combat;
    // map: Map;

    roamingInterval: NodeJS.Timeout | null;
    spawnLocation;
    maxRoamingDistance: number;

    constructor(mob: Mob) {
        this.mob = mob;
        this.combat = mob.combat;

        this.roamingInterval = null;
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
