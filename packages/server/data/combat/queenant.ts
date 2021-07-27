import _ from 'lodash';
import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Packets from '@kaetram/common/src/packets';
import Messages from '../../src/network/messages';
import Utils from '../../src/util/utils';
import type { HitData } from '../../src/game/entity/character/combat/hit';

export default class QueenAnt extends Combat {
    /*
     * The queen ant is a little more complex as it uses
     * AoE attacks and has a stun timer.
     */

    aoeTimeout: NodeJS.Timeout;
    aoeCountdown: number;
    aoeRadius: number;
    lastAoE: number;
    minionCount: number;
    lastSpawn: number;
    minions: Mob[];
    frozen: boolean;

    constructor(character: Character) {
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

            const listCopy = [...this.minions];

            for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
        });

        this.character.onReturn(() => {
            clearTimeout(this.aoeTimeout);
            this.aoeTimeout = null;
        });
    }

    begin(attacker: Character): void {
        this.resetAoE();

        super.begin(attacker);
    }

    hit(attacker: Character, target: Character, hitInfo: HitData): void {
        if (this.frozen) return;

        if (this.canCastAoE()) {
            this.doAoE();
            return;
        }

        if (this.canSpawn()) this.spawnMinions();

        if (this.isAttacked()) this.beginMinionAttack();

        super.hit(attacker, target, hitInfo);
    }

    doAoE(): void {
        /**
         * The reason this function does not use its superclass
         * representation is because of the setTimeout function
         * which does not allow us to call super().
         */

        this.resetAoE();

        this.lastHit = this.getTime();

        this.pushFreeze(true);

        this.pushCountdown(this.aoeCountdown);

        this.aoeTimeout = setTimeout(() => {
            this.dealAoE(this.aoeRadius, true);

            this.pushFreeze(false);
        }, 5000);
    }

    spawnMinions(): void {
        this.lastSpawn = Date.now();

        for (let i = 0; i < this.minionCount; i++)
            this.minions.push(this.entities.spawnMob(13, this.character.x, this.character.y));

        _.each(this.minions, (minion: Mob) => {
            minion.aggressive = true;
            minion.spawnDistance = 12;

            minion.onDeath(() => {
                if (this.isLast()) this.lastSpawn = Date.now();

                this.minions.splice(this.minions.indexOf(minion), 1);
            });

            if (this.isAttacked()) this.beginMinionAttack();
        });
    }

    beginMinionAttack(): void {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion: Mob) => {
            const randomTarget = this.getRandomTarget();

            if (!minion.hasTarget() && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    resetAoE(): void {
        this.lastAoE = Date.now();
    }

    getRandomTarget(): Character {
        if (this.isAttacked()) {
            const keys = Object.keys(this.attackers),
                randomAttacker = this.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (this.character.hasTarget()) return this.character.target;

        return null;
    }

    pushFreeze(state: boolean): void {
        this.character.frozen = state;
        this.character.stunned = state;
    }

    pushCountdown(count: number): void {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Packets.NPCOpcode.Countdown, {
                id: this.character.instance,
                countdown: count
            })
        });
    }

    // TODO
    getMinions(): void {
        // var self = this,
        //     grids = this.world.getGrids();
    }

    isLast(): boolean {
        return this.minions.length === 1;
    }

    hasMinions(): boolean {
        return this.minions.length > 0;
    }

    canCastAoE(): boolean {
        return Date.now() - this.lastAoE > 30000;
    }

    canSpawn(): boolean {
        return Date.now() - this.lastSpawn > 45000 && !this.hasMinions() && this.isAttacked();
    }
}
