import _ from 'lodash';

import Utils from '@kaetram/common/util/utils';

import Combat from '../../src/game/entity/character/combat/combat';

import type { HitData } from '@kaetram/common/types/info';
import type Character from '../../src/game/entity/character/character';
import type Mob from '../../src/game/entity/character/mob/mob';

/**
 * First of its kind, the Skeleton King will spawn 4 minions.
 * Two sorcerers on (x + 1, y + 1) & (x - 1, y + 1)
 *
 * And two death knights on (x + 1, y - 1) & (x - 1, y - 1)
 */
export default class SkeletonKing extends Combat {
    private lastSpawn: number;
    private minions: Mob[];

    public constructor(character: Character) {
        character.spawnDistance = 10;
        super(character);

        this.lastSpawn = 0;

        this.minions = [];

        character.onDeath(() => {
            this.reset();
        });
    }

    private reset(): void {
        this.lastSpawn = 0;

        let listCopy = [...this.minions];

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
    }

    public override hit(character: Character, target: Character, hitInfo: HitData): void {
        if (this.isAttacked()) this.beginMinionAttack();

        if (this.canSpawn()) this.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    private spawnMinions(): void {
        let { x } = this.character,
            { y } = this.character;

        this.lastSpawn = Date.now();

        if (!this.colliding(x + 2, y - 2))
            this.minions.push(this.entities.spawnMob(17, x + 2, y + 2));

        if (!this.colliding(x - 2, y - 2))
            this.minions.push(this.entities.spawnMob(17, x - 2, y + 2));

        if (!this.colliding(x + 1, y + 1))
            this.minions.push(this.entities.spawnMob(11, x + 1, y - 1));

        if (!this.colliding(x - 1, y + 1))
            this.minions.push(this.entities.spawnMob(11, x - 1, y - 1));

        _.each(this.minions, (minion: Mob) => {
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

    private getRandomTarget(): Character | null {
        if (this.isAttacked()) {
            let keys = Object.keys(this.attackers),
                randomAttacker = this.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (this.character.target) return this.character.target;

        return null;
    }

    private hasMinions(): boolean {
        return this.minions.length > 0;
    }

    private isLast(): boolean {
        return this.minions.length === 1;
    }

    private canSpawn(): boolean {
        return Date.now() - this.lastSpawn > 25_000 && !this.hasMinions() && this.isAttacked();
    }
}
