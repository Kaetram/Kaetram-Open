import * as _ from 'underscore';
import Combat from '../../ts/game/entity/character/combat/combat';
import Messages from '../../ts/network/messages';
import Packets from '../../ts/network/packets';
import Modules from '../../ts/util/modules';
import Utils from '../../ts/util/utils';
import Mob from '../../ts/game/entity/character/mob/mob';

/**
 *
 */
class OgreLord extends Combat {
    public dialogues: any;

    public minions: Mob[];

    public lastSpawn: any;

    public isAttacked: any;

    public talkingInterval: any;

    public character: any;

    public updateInterval: any;

    public loaded: any;

    public world: any;

    public attackers: any;

    constructor(character) {
        super(character);

        this.character = character;

        this.dialogues = [
            'Get outta my swamp',
            'No, not the onion.',
            'My minions give me strength! You stand no chance!'
        ];

        this.minions = [];

        this.lastSpawn = 0;

        this.loaded = false;

        character.projectile = Modules.Projectiles.Boulder;
        character.projectileName = 'projectile-boulder';

        character.onDeath(() => {
            this.reset();
        });
    }

    load() {
        this.talkingInterval = setInterval(() => {
            if (this.character.hasTarget()) this.forceTalk(this.getMessage());
        }, 9000);

        this.updateInterval = setInterval(() => {
            this.character.armourLevel = 50 + this.minions.length * 15;
        }, 2000);

        this.loaded = true;
    }

    hit(character, target, hitInfo) {
        if (this.isAttacked()) this.beginMinionAttack();

        if (!character.isNonDiagonal(target)) {
            const distance = character.getDistance(target);

            if (distance < 7) {
                hitInfo.isRanged = true;
                character.attackRange = 7;
            }
        }

        if (this.canSpawn()) this.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    forceTalk(message) {
        if (!this.world) return;

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: this.character.instance,
                text: message,
                nonNPC: true
            })
        });
    }

    getMessage() {
        return this.dialogues[Utils.randomInt(0, this.dialogues.length - 1)];
    }

    spawnMinions() {
        const xs = [414, 430, 415, 420, 429];
        const ys = [172, 173, 183, 185, 180];

        this.lastSpawn = new Date().getTime();

        this.forceTalk('Now you shall see my true power!');

        for (let i = 0; i < xs.length; i++)
            this.minions.push(this.world.spawnMob(12, xs[i], ys[i]));

        _.each(this.minions, (minion) => {
            minion.onDeath(() => {
                if (this.isLast()) this.lastSpawn = new Date().getTime();

                this.minions.splice(this.minions.indexOf(minion), 1);
            });

            if (this.isAttacked()) this.beginMinionAttack();
        });

        if (!this.loaded) this.load();
    }

    beginMinionAttack() {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion) => {
            const randomTarget = this.getRandomTarget();

            if (!minion.hasTarget() && randomTarget)
                minion.combat.begin(randomTarget);
        });
    }

    reset() {
        this.lastSpawn = 0;

        const listCopy = this.minions.slice();

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);

        clearInterval(this.talkingInterval);
        clearInterval(this.updateInterval);

        this.talkingInterval = null;
        this.updateInterval = null;

        this.loaded = false;
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
            new Date().getTime() - this.lastSpawn > 50000 &&
            !this.hasMinions() &&
            this.isAttacked()
        );
    }
}

export default OgreLord;
