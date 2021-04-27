import Utils from '../../../../util/utils';
import Messages from '../../../../network/messages';
import Mobs from '../../../../util/mobs';
import Packets from '../../../../network/packets';
import Combat from '../combat/combat';
import World from '../../../world';
import Mob from './mob';
import Map from '../../../../map/map';
import Character from '../character';

class MobHandler {
    mob: Mob;
    combat: Combat;
    map: Map;

    roamingInterval: any;
    spawnLocation: any;
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

    load() {
        if (!this.mob.roaming) return;

        this.roamingInterval = setInterval(() => {
            this.mob.roamingCallback();
        }, 5000);
    }

    loadCallbacks() {
        // Combat plugin has its own set of callbacks.
        if (Mobs.hasCombatPlugin(this.mob.id)) return;

        this.mob.onLoad(() => {
            if (this.mob.miniboss) this.mob.setMinibossData();
        });

        this.mob.onDeath(() => {
            if (!this.mob.miniboss || !this.combat) return;

            this.combat.forEachAttacker((attacker: Character) => {
                if (attacker) attacker.finishAchievement(this.mob.achievementId);
            });
        });

        //TODO - Implement posion on Mobs
    }

    forceTalk(message: string) {
        this.mob.forceTalkCallback(message);
    }
}

export default MobHandler;
