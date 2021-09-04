import _ from 'lodash';

import { Opcodes } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import Combat from '../../src/game/entity/character/combat/combat';
import Messages from '../../src/network/messages';

import type { HitData } from '@kaetram/common/types/info';
import type Character from '../../src/game/entity/character/character';
import type Mob from '../../src/game/entity/character/mob/mob';

/**
 * The queen ant is a little more complex as it uses
 * AoE attacks and has a stun timer.
 */
export default class QueenAnt extends Combat {
    private aoeTimeout: NodeJS.Timeout | null;
    private aoeCountdown: number;
    private aoeRadius: number;
    private lastAoE: number;
    private minionCount: number;
    private lastSpawn: number;
    private minions: Mob[];
    private frozen: boolean;

    public constructor(character: Character) {
        character.spawnDistance = 18;
        super(character);

        this.character = character;

        this.lastActionThreshold = 10_000; // AoE Attack Threshold.

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

            let listCopy = [...this.minions];

            for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
        });

        this.character.onReturn(() => {
            if (this.aoeTimeout) clearTimeout(this.aoeTimeout);
            this.aoeTimeout = null;
        });
    }

    public override begin(attacker: Character): void {
        this.resetAoE();

        super.begin(attacker);
    }

    public override hit(attacker: Character, target: Character, hitInfo: HitData): void {
        if (this.frozen) return;

        if (this.canCastAoE()) {
            this.doAoE();
            return;
        }

        if (this.canSpawn()) this.spawnMinions();

        if (this.isAttacked()) this.beginMinionAttack();

        super.hit(attacker, target, hitInfo);
    }

    private doAoE(): void {
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

    private spawnMinions(): void {
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

    private beginMinionAttack(): void {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion: Mob) => {
            let randomTarget = this.getRandomTarget();

            if (!minion.target && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    private resetAoE(): void {
        this.lastAoE = Date.now();
    }

    private getRandomTarget(): Character | null {
        if (this.isAttacked()) {
            let keys = Object.keys(this.attackers),
                randomAttacker = this.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (this.character.target) return this.character.target;

        return null;
    }

    private pushFreeze(state: boolean): void {
        this.character.frozen = state;
        this.character.stunned = state;
    }

    private pushCountdown(count: number): void {
        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Opcodes.NPC.Countdown, {
                id: this.character.instance,
                countdown: count
            })
        });
    }

    // TODO
    private getMinions(): void {
        // let self = this,
        //     grids = this.world.getGrids();
    }

    private isLast(): boolean {
        return this.minions.length === 1;
    }

    private hasMinions(): boolean {
        return this.minions.length > 0;
    }

    private canCastAoE(): boolean {
        return Date.now() - this.lastAoE > 30_000;
    }

    private canSpawn(): boolean {
        return Date.now() - this.lastSpawn > 45_000 && !this.hasMinions() && this.isAttacked();
    }
}
