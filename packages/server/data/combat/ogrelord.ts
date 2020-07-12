import _ from 'underscore';
import Combat from '../../ts/game/entity/character/combat/combat';
import Character from '../../ts/game/entity/character/character';
import Mob from '../../ts/game/entity/character/mob/mob';
import Messages from '../../ts/network/messages';
import Packets from '../../ts/network/packets';
import Modules from '../../ts/util/modules';
import Utils from '../../ts/util/utils';

class OgreLord extends Combat {
    dialogues: Array<string>;
    minions: Array<any>;
    lastSpawn: number;
    loaded: boolean;

    talkingInterval: any;
    updateInterval: any;

    constructor(character: Mob) {
        super(character);

        let self = this;

        self.character = character;

        self.dialogues = [
            'Get outta my swamp',
            'No, not the onion.',
            'My minions give me strength! You stand no chance!'
        ];

        self.minions = [];

        self.lastSpawn = 0;

        self.loaded = false;

        character.projectile = Modules.Projectiles.Boulder;
        character.projectileName = 'projectile-boulder';

        character.onDeath(() => {
            self.reset();
        });
    }

    load() {
        var self = this;

        self.talkingInterval = setInterval(() => {
            if (self.character.hasTarget()) self.forceTalk(self.getMessage());
        }, 9000);

        self.updateInterval = setInterval(() => {
            self.character.armourLevel = 50 + self.minions.length * 15;
        }, 2000);

        self.loaded = true;
    }

    hit(character: Character, target: Character, hitInfo: any) {
        var self = this;

        if (self.isAttacked()) self.beginMinionAttack();

        if (!character.isNonDiagonal(target)) {
            var distance = character.getDistance(target);

            if (distance < 7) {
                hitInfo.isRanged = true;
                character.attackRange = 7;
            }
        }

        if (self.canSpawn()) self.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    forceTalk(message: string) {
        var self = this;

        if (!self.world) return;

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.character.region,
            message: new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: self.character.instance,
                text: message,
                nonNPC: true
            })
        });
    }

    getMessage() {
        return this.dialogues[Utils.randomInt(0, this.dialogues.length - 1)];
    }

    spawnMinions() {
        var self = this,
            xs = [414, 430, 415, 420, 429],
            ys = [172, 173, 183, 185, 180];

        self.lastSpawn = new Date().getTime();

        self.forceTalk('Now you shall see my true power!');

        for (var i = 0; i < xs.length; i++)
            self.minions.push(self.world.spawnMob(12, xs[i], ys[i]));

        _.each(self.minions, (minion: Mob) => {
            minion.onDeath(() => {
                if (self.isLast()) self.lastSpawn = new Date().getTime();

                self.minions.splice(self.minions.indexOf(minion), 1);
            });

            if (self.isAttacked()) self.beginMinionAttack();
        });

        if (!self.loaded) self.load();
    }

    beginMinionAttack() {
        var self = this;

        if (!self.hasMinions()) return;

        _.each(self.minions, (minion: Mob) => {
            var randomTarget = self.getRandomTarget();

            if (!minion.hasTarget() && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    reset() {
        var self = this;

        self.lastSpawn = 0;

        var listCopy = self.minions.slice();

        for (var i = 0; i < listCopy.length; i++) self.world.kill(listCopy[i]);

        clearInterval(self.talkingInterval);
        clearInterval(self.updateInterval);

        self.talkingInterval = null;
        self.updateInterval = null;

        self.loaded = false;
    }

    getRandomTarget() {
        var self = this;

        if (self.isAttacked()) {
            var keys = Object.keys(self.attackers),
                randomAttacker = self.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (self.character.hasTarget()) return self.character.target;

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
            new Date().getTime() - this.lastSpawn > 50000 && !this.hasMinions() && this.isAttacked()
        );
    }
}

export default OgreLord;
