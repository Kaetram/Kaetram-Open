import _ from 'lodash';

import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import Character from '../../src/game/entity/character/character';
import Combat from '../../src/game/entity/character/combat/combat';
import Mob from '../../src/game/entity/character/mob/mob';
import Messages from '../../src/network/messages';
import Utils from '../../src/util/utils';
import type { HitData } from '../../src/game/entity/character/combat/hit';

export default class OgreLord extends Combat {
    dialogues: string[];
    minions: Mob[];
    lastSpawn: number;
    loaded: boolean;

    talkingInterval!: NodeJS.Timeout | null;
    updateInterval!: NodeJS.Timeout | null;

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

    load(): void {
        this.talkingInterval = setInterval(() => {
            if (this.character.target) this.forceTalk(this.getMessage());
        }, 9000);

        this.updateInterval = setInterval(() => {
            this.character.armourLevel = 50 + this.minions.length * 15;
        }, 2000);

        this.loaded = true;
    }

    override hit(character: Character, target: Character, hitInfo: HitData): void {
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

    forceTalk(message: string): void {
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

    getMessage(): string {
        return this.dialogues[Utils.randomInt(0, this.dialogues.length - 1)];
    }

    spawnMinions(): void {
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

    beginMinionAttack(): void {
        if (!this.hasMinions()) return;

        _.each(this.minions, (minion: Mob) => {
            const randomTarget = this.getRandomTarget();

            if (!minion.target && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    reset(): void {
        this.lastSpawn = 0;

        const listCopy = [...this.minions];

        for (let i = 0; i < listCopy.length; i++) this.world.kill(listCopy[i]);

        if (this.talkingInterval) clearInterval(this.talkingInterval);
        if (this.updateInterval) clearInterval(this.updateInterval);

        this.talkingInterval = null;
        this.updateInterval = null;

        this.loaded = false;
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
        return Date.now() - this.lastSpawn > 50000 && !this.hasMinions() && this.isAttacked();
    }
}
