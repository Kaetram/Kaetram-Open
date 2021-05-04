import _ from 'lodash';
import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Messages from '../../src/network/messages';
import Packets from '../../src/network/packets';
import Utils from '../../src/util/utils';

class Tenebris extends Combat {
    illusions: Array<any>;
    firstIllusionKilled: boolean;
    lastIllusion: number;
    respawnDelay: number;

    constructor(character: Mob) {
        character.spawnDistance = 24;
        super(character);

        this.illusions = [];
        this.firstIllusionKilled = false;

        this.lastIllusion = new Date().getTime();
        this.respawnDelay = 95000;

        character.onDeath(() => {
            if (this.isIllusion())
                if (!this.firstIllusionKilled) this.spawnTenbris();
                else {
                    this.removeIllusions();

                    this.reset();
                }
        });

        if (!this.isIllusion()) this.forceTalk(null, 'Who dares summon Tenebris!');
    }

    reset() {
        this.illusions = [];
        this.firstIllusionKilled = false;

        setTimeout(() => {
            const offset = Utils.positionOffset(4);

            this.entities.spawnMob(105, 48 + offset.x, 338 + offset.y);
        }, this.respawnDelay);
    }

    hit(attacker: Character, target: Character, hitInfo: any) {
        if (this.isAttacked()) this.beginIllusionAttack();

        if (this.canSpawn()) this.spawnIllusions();

        super.hit(attacker, target, hitInfo);
    }

    spawnTenbris() {
        this.entities.spawnMob(104, this.character.x, this.character.y);
    }

    spawnIllusions() {
        this.illusions.push(this.entities.spawnMob(105, this.character.x + 1, this.character.y + 1));
        this.illusions.push(this.entities.spawnMob(105, this.character.x - 1, this.character.y + 1));

        _.each(this.illusions, (illusion: Mob) => {
            illusion.onDeath(() => {
                if (this.isLast()) this.lastIllusion = new Date().getTime();

                this.illusions.splice(this.illusions.indexOf(illusion), 1);
            });

            if (this.isAttacked()) this.beginIllusionAttack();
        });

        this.character.setPosition(62, 343);

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Teleport({
                id: this.character.instance,
                x: this.character.x,
                y: this.character.y,
                withAnimation: true
            })
        });
    }

    removeIllusions() {
        this.lastIllusion = 0;

        const listCopy = this.illusions.slice();

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
    }

    beginIllusionAttack() {
        if (!this.hasIllusions()) return;

        _.each(this.illusions, (illusion: Mob) => {
            const target = this.getRandomTarget();

            if (!illusion.hasTarget && target) illusion.combat.begin(target);
        });
    }

    getRandomTarget() {
        if (this.isAttacked()) {
            const keys = Object.keys(this.attackers),
                randomAttacker = this.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (this.character.hasTarget()) return this.character.target;

        return null;
    }

    forceTalk(instance: string, message: any) {
        if (!this.world) return;

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: instance,
                text: message,
                nonNPC: true
            })
        });
    }

    isLast() {
        return this.illusions.length === 1;
    }

    canSpawn() {
        return (
            !this.isIllusion() &&
            !this.hasIllusions &&
            new Date().getTime() - this.lastIllusion === 45000 &&
            Utils.randomInt(0, 4) === 2
        );
    }

    isIllusion() {
        return this.character.id === 105;
    }

    hasIllusions() {
        return this.illusions.length > 0;
    }
}

export default Tenebris;
