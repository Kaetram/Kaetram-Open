import * as _ from 'underscore';
import Combat from '../../ts/game/entity/character/combat/combat';
import Packets from '../../ts/network/packets';
import Messages from '../../ts/network/messages';
import Utils from '../../ts/util/utils';
import Mob from '../../ts/game/entity/character/mob/mob';

/**
 *
 */
class QueenAnt extends Combat {
    public lastAoE: any;

    public minions: Mob[];

    public lastSpawn: any;

    public isAttacked: any;

    public frozen: any;

    public lastHit: any;

    public getTime: any;

    public aoeCountdown: any;

    public aoeTimeout: any;

    public dealAoE: any;

    public aoeRadius: any;

    public minionCount: any;

    public world: any;

    public character: any;

    public attackers: any;
    /*
     * The queen ant is a little more complex as it uses
     * AoE attacks and has a stun timer.
     */

    constructor(character) {
        character.spawnDistance = 18;
        super(character);

        this.character = character;

        this.lastActionThreshold = 10000; // AoE Attack Threshold.

        this.aoeTimeout = null;

        this.aoeCountdown = 5;
        this.aoeRadius = 2;
        this.lastAoE = 0;

        this.minionCount = 7;
        this.lastSpawn = 0;
        this.minions = [];

        this.frozen = false;

        this.character.onDeath(() => {
            /**
             * This is to prevent the boss from dealing
             * any powerful AoE attack after dying.
             */

            this.lastSpawn = 0;

            if (this.aoeTimeout) {
                clearTimeout(this.aoeTimeout);
                this.aoeTimeout = null;
            }

            const listCopy = this.minions.slice();

            for (let i = 0; i < listCopy.length; i++)
                this.world.kill(listCopy[i]);
        });

        this.character.onReturn(() => {
            clearTimeout(this.aoeTimeout);
            this.aoeTimeout = null;
        });
    }

    begin(attacker) {
        this.resetAoE();

        super.begin(attacker);
    }

    hit(attacker, target, hitInfo) {
        if (this.frozen) return;

        if (this.canCastAoE()) {
            this.doAoE();

            return;
        }

        if (this.canSpawn()) this.spawnMinions();

        if (this.isAttacked()) this.beginMinionAttack();

        super.hit(attacker, target, hitInfo);
    }

    doAoE() {
        this.resetAoE();

        this.lastHit = this.getTime();

        this.pushFreeze(true);

        this.pushCountdown(this.aoeCountdown);

        this.aoeTimeout = setTimeout(() => {
            this.dealAoE(this.aoeRadius, true);

            this.pushFreeze(false);
        }, 5000);
    }

    spawnMinions() {
        this.lastSpawn = new Date().getTime();

        for (let i = 0; i < this.minionCount; i++)
            this.minions.push(
                this.world.spawnMob(13, this.character.x, this.character.y)
            );

        _.each(this.minions, (minion) => {
            minion.aggressive = true;
            minion.spawnDistance = 12;

            minion.onDeath(() => {
                if (this.isLast()) this.lastSpawn = new Date().getTime();

                this.minions.splice(this.minions.indexOf(minion), 1);
            });

            if (this.isAttacked()) this.beginMinionAttack();
        });
    }

    beginMinionAttack() {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion) => {
            const randomTarget = this.getRandomTarget();

            if (!minion.hasTarget() && randomTarget)
                minion.combat.begin(randomTarget);
        });
    }

    resetAoE() {
        this.lastAoE = new Date().getTime();
    }

    getRandomTarget() {
        if (this.isAttacked()) {
            const keys = Object.keys(this.attackers);
            const randomAttacker = this.attackers[
                keys[Utils.randomInt(0, keys.length)]
            ];

            if (randomAttacker) return randomAttacker;
        }

        if (this.character.hasTarget()) return this.character.target;

        return null;
    }

    pushFreeze(state) {
        this.character.frozen = state;
        this.character.stunned = state;
    }

    pushCountdown(count) {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Packets.NPCOpcode.Countdown, {
                id: this.character.instance,
                countdown: count
            })
        });
    }

    getMinions() {
        const grids = this.world.getGrids();
    }

    isLast() {
        return this.minions.length === 1;
    }

    hasMinions() {
        return this.minions.length > 0;
    }

    canCastAoE() {
        return new Date().getTime() - this.lastAoE > 30000;
    }

    canSpawn() {
        return (
            new Date().getTime() - this.lastSpawn > 45000 &&
            !this.hasMinions() &&
            this.isAttacked()
        );
    }
}

export default QueenAnt;
