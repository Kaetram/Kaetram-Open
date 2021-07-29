import _ from 'lodash';
import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Messages from '../../src/network/messages';
import Packets from '@kaetram/common/src/packets';
import Utils from '../../src/util/utils';
import { HitData } from '../../src/game/entity/character/combat/hit';

export default class Tenebris extends Combat {
    illusions: Mob[];
    firstIllusionKilled: boolean;
    lastIllusion: number;
    respawnDelay: number;

    public constructor(character: Character) {
        character.spawnDistance = 24;
        super(character);

        this.illusions = [];
        this.firstIllusionKilled = false;

        this.lastIllusion = Date.now();
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

    reset(): void {
        this.illusions = [];
        this.firstIllusionKilled = false;

        setTimeout(() => {
            const offset = Utils.positionOffset(4);

            this.entities.spawnMob(105, 48 + offset.x, 338 + offset.y);
        }, this.respawnDelay);
    }

    override hit(attacker: Character, target: Character, hitInfo: HitData): void {
        if (this.isAttacked()) this.beginIllusionAttack();

        if (this.canSpawn()) this.spawnIllusions();

        super.hit(attacker, target, hitInfo);
    }

    spawnTenbris(): void {
        this.entities.spawnMob(104, this.character.x, this.character.y);
    }

    spawnIllusions(): void {
        this.illusions.push(
            this.entities.spawnMob(105, this.character.x + 1, this.character.y + 1),
            this.entities.spawnMob(105, this.character.x - 1, this.character.y + 1)
        );

        _.each(this.illusions, (illusion: Mob) => {
            illusion.onDeath(() => {
                if (this.isLast()) this.lastIllusion = Date.now();

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

    removeIllusions(): void {
        this.lastIllusion = 0;

        const listCopy = [...this.illusions];

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
    }

    beginIllusionAttack(): void {
        if (!this.hasIllusions()) return;

        _.each(this.illusions, (illusion: Mob) => {
            const target = this.getRandomTarget();

            if (!illusion.target && target) illusion.combat.begin(target);
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

    forceTalk(instance: string | null, message: string): void {
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

    isLast(): boolean {
        return this.illusions.length === 1;
    }

    canSpawn(): boolean {
        return (
            !this.isIllusion() &&
            !this.hasIllusions &&
            Date.now() - this.lastIllusion === 45000 &&
            Utils.randomInt(0, 4) === 2
        );
    }

    isIllusion(): boolean {
        return this.character.id === 105;
    }

    hasIllusions(): boolean {
        return this.illusions.length > 0;
    }
}
