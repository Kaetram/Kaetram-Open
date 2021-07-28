import _ from 'lodash';
import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Utils from '../../src/util/utils';
import { HitData } from '@kaetram/server/src/game/entity/character/combat/hit';

export default class SkeletonKing extends Combat {
    /**
     * First of its kind, the Skeleton King will spawn 4 minions.
     * Two sorcerers on (x + 1, y + 1) & (x - 1, y + 1)
     *
     * And two death knights on (x + 1, y - 1) & (x - 1, y - 1)
     */

    lastSpawn: number;
    minions: Mob[];

    constructor(character: Character) {
        character.spawnDistance = 10;
        super(character);

        this.lastSpawn = 0;

        this.minions = [];

        character.onDeath(() => {
            this.reset();
        });
    }

    reset(): void {
        this.lastSpawn = 0;

        const listCopy = [...this.minions];

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
    }

    override hit(character: Character, target: Character, hitInfo: HitData): void {
        if (this.isAttacked()) this.beginMinionAttack();

        if (this.canSpawn()) this.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    spawnMinions(): void {
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

    beginMinionAttack(): void {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion: Mob) => {
            const randomTarget = this.getRandomTarget();

            if (!minion.target && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    getRandomTarget(): Character | null {
        if (this.isAttacked()) {
            const keys = Object.keys(this.attackers),
                randomAttacker = this.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (this.character.target) return this.character.target;

        return null;
    }

    hasMinions(): boolean {
        return this.minions.length > 0;
    }

    isLast(): boolean {
        return this.minions.length === 1;
    }

    canSpawn(): boolean {
        return Date.now() - this.lastSpawn > 25000 && !this.hasMinions() && this.isAttacked();
    }
}
