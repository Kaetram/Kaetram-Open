import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import Combat from '../../src/game/entity/character/combat/combat';
import Messages from '../../src/network/messages';

import type { HitData } from '@kaetram/common/types/info';
import type Character from '../../src/game/entity/character/character';
import type Mob from '../../src/game/entity/character/mob/mob';

export default class OgreLord extends Combat {
    private dialogues: string[];
    private minions: Mob[];
    private lastSpawn: number;
    private loaded: boolean;

    private talkingInterval!: NodeJS.Timeout | null;
    private updateInterval!: NodeJS.Timeout | null;

    public constructor(character: Character) {
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

    private load(): void {
        this.talkingInterval = setInterval(() => {
            if (this.character.target) this.forceTalk(this.getMessage());
        }, 9000);

        this.updateInterval = setInterval(() => {
            this.character.armourLevel = 50 + this.minions.length * 15;
        }, 2000);

        this.loaded = true;
    }

    public override hit(character: Character, target: Character, hitInfo: HitData): void {
        if (this.isAttacked()) this.beginMinionAttack();

        if (!character.isNonDiagonal(target)) {
            let distance = character.getDistance(target);

            if (distance < 7) {
                hitInfo.isRanged = true;
                character.attackRange = 7;
            }
        }

        if (this.canSpawn()) this.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    private forceTalk(message: string): void {
        if (!this.world) return;

        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.NPC(Opcodes.NPC.Talk, {
                id: this.character.instance,
                text: message,
                nonNPC: true
            })
        });
    }

    private getMessage(): string {
        return this.dialogues[Utils.randomInt(0, this.dialogues.length - 1)];
    }

    private spawnMinions(): void {
        let xs = [414, 430, 415, 420, 429],
            ys = [172, 173, 183, 185, 180];

        this.lastSpawn = Date.now();

        this.forceTalk('Now you shall see my true power!');

        for (let i = 0; i < xs.length; i++)
            this.minions.push(this.entities.spawnMob(12, xs[i], ys[i]));

        _.each(this.minions, (minion: Mob) => {
            minion.onDeath(() => {
                if (this.isLast()) this.lastSpawn = Date.now();

                this.minions.splice(this.minions.indexOf(minion), 1);
            });

            if (this.isAttacked()) this.beginMinionAttack();
        });

        if (!this.loaded) this.load();
    }

    private beginMinionAttack(): void {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion: Mob) => {
            let randomTarget = this.getRandomTarget();

            if (!minion.target && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    private reset(): void {
        this.lastSpawn = 0;

        let listCopy = [...this.minions];

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);

        if (this.talkingInterval) clearInterval(this.talkingInterval);
        if (this.updateInterval) clearInterval(this.updateInterval);

        this.talkingInterval = null;
        this.updateInterval = null;

        this.loaded = false;
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
        return Date.now() - this.lastSpawn > 50_000 && !this.hasMinions() && this.isAttacked();
    }
}
