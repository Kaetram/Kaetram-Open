import _ from 'lodash';

import { Opcodes } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import Combat from '../../src/game/entity/character/combat/combat';
import Messages from '../../src/network/messages';

import type { HitData } from '@kaetram/common/types/info';
import type Character from '../../src/game/entity/character/character';
import type Mob from '../../src/game/entity/character/mob/mob';

export default class Tenebris extends Combat {
    private illusions: Mob[];
    private firstIllusionKilled: boolean;
    private lastIllusion: number;
    private respawnDelay: number;

    public constructor(character: Character) {
        character.spawnDistance = 24;
        super(character);

        this.illusions = [];
        this.firstIllusionKilled = false;

        this.lastIllusion = Date.now();
        this.respawnDelay = 95_000;

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

    private reset(): void {
        this.illusions = [];
        this.firstIllusionKilled = false;

        setTimeout(() => {
            let offset = Utils.positionOffset(4);

            this.entities.spawnMob(105, 48 + offset.x, 338 + offset.y);
        }, this.respawnDelay);
    }

    public override hit(attacker: Character, target: Character, hitInfo: HitData): void {
        if (this.isAttacked()) this.beginIllusionAttack();

        if (this.canSpawn()) this.spawnIllusions();

        super.hit(attacker, target, hitInfo);
    }

    private spawnTenbris(): void {
        this.entities.spawnMob(104, this.character.x, this.character.y);
    }

    private spawnIllusions(): void {
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

        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.Teleport({
                id: this.character.instance,
                x: this.character.x,
                y: this.character.y,
                withAnimation: true
            })
        });
    }

    private removeIllusions(): void {
        this.lastIllusion = 0;

        let listCopy = [...this.illusions];

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);
    }

    private beginIllusionAttack(): void {
        if (!this.hasIllusions()) return;

        _.each(this.illusions, (illusion: Mob) => {
            let target = this.getRandomTarget();

            if (!illusion.target && target) illusion.combat.begin(target);
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

    private forceTalk(instance: string | null, message: string): void {
        if (!this.world) return;

        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Opcodes.NPC.Talk, {
                id: instance,
                text: message,
                nonNPC: true
            })
        });
    }

    private isLast(): boolean {
        return this.illusions.length === 1;
    }

    private canSpawn(): boolean {
        return (
            !this.isIllusion() &&
            !this.hasIllusions &&
            Date.now() - this.lastIllusion === 45_000 &&
            Utils.randomInt(0, 4) === 2
        );
    }

    private isIllusion(): boolean {
        return this.character.id === 105;
    }

    private hasIllusions(): boolean {
        return this.illusions.length > 0;
    }
}
