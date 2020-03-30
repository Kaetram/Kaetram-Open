import * as _ from 'underscore';
import Combat from '../../ts/game/entity/character/combat/combat';
import Utils from '../../ts/util/utils';
import Mob from '../../ts/game/entity/character/mob/mob';

/**
 *
 */
class SkeletonKing extends Combat {
    public minions: Mob[];

    public lastSpawn: any;

    public isAttacked: any;

    public world: any;

    public character: any;

    public colliding: any;

    public attackers: any;

    /**
     * First of its kind, the Skeleton King will spawn 4 minions.
     * Two sorcerers on (x + 1, y + 1) & (x - 1, y + 1)
     *
     * And two death knights on (x + 1, y - 1) & (x - 1, y - 1)
     */

    constructor(character) {
        character.spawnDistance = 10;
        super(character);

        this.lastSpawn = 0;

        this.minions = [];

        character.onDeath(() => {
            this.reset();
        });
    }

    reset() {
        this.lastSpawn = 0;

        const listCopy = this.minions.slice();

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
    }

    hit(character, target, hitInfo) {
        if (this.isAttacked()) this.beginMinionAttack();

        if (this.canSpawn()) this.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    spawnMinions() {
        const { x } = this.character;
        const { y } = this.character;

        this.lastSpawn = new Date().getTime();

        if (!this.colliding(x + 2, y - 2))
            this.minions.push(this.world.spawnMob(17, x + 2, y + 2));

        if (!this.colliding(x - 2, y - 2))
            this.minions.push(this.world.spawnMob(17, x - 2, y + 2));

        if (!this.colliding(x + 1, y + 1))
            this.minions.push(this.world.spawnMob(11, x + 1, y - 1));

        if (!this.colliding(x - 1, y + 1))
            this.minions.push(this.world.spawnMob(11, x - 1, y - 1));

        _.each(this.minions, (minion) => {
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

    hasMinions() {
        return this.minions.length > 0;
    }

    isLast() {
        return this.minions.length === 1;
    }

    canSpawn() {
        return (
            new Date().getTime() - this.lastSpawn > 25000 &&
            !this.hasMinions() &&
            this.isAttacked()
        );
    }
}

export default SkeletonKing;
