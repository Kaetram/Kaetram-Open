import _ from 'underscore';
import Modules from '../utils/modules';
import Queue from '../utils/queue';
import Splat from '../renderer/infos/splat';
import Countdown from '../renderer/infos/countdown';
import isInt from '../utils/util';

export default class InfoController {
    constructor(game) {
        var self = this;

        self.game = game;

        self.infos = {};
        self.destroyQueue = new Queue();
    }

    create(type, data, x, y) {
        var self = this;

        switch (type) {
            case Modules.Hits.Damage:
            case Modules.Hits.Stun:
            case Modules.Hits.Critical:
                var damage = data.shift(),
                    isTarget = data.shift(),
                    dId = self.generateId(self.game.time, damage, x, y);

                if (damage < 1 || !isInt(damage)) damage = 'MISS';

                var hitSplat = new Splat(dId, type, damage, x, y, false),
                    dColour = isTarget
                        ? Modules.DamageColours.received
                        : Modules.DamageColours.inflicted;

                hitSplat.setColours(dColour.fill, dColour.stroke);

                self.addInfo(hitSplat);

                break;

            case Modules.Hits.Heal:
            case Modules.Hits.Mana:
            case Modules.Hits.Experience:
            case Modules.Hits.Profession:
            case Modules.Hits.Poison:
                var amount = data.shift(),
                    id = self.generateId(self.game.time, amount, x, y),
                    prefix = '+',
                    colour,
                    suffix = '';

                if (amount < 1 || !isInt(amount)) return;

                if (
                    type !== Modules.Hits.Experience &&
                    type !== Modules.Hits.Profession
                )
                    prefix = '++';
                else suffix = ' EXP';

                if (type === Modules.Hits.Poison) prefix = '--';

                var splat = new Splat(
                    id,
                    type,
                    prefix + amount + suffix,
                    x,
                    y,
                    false
                );

                if (type === Modules.Hits.Heal)
                    colour = Modules.DamageColours.healed;
                else if (type === Modules.Hits.Mana)
                    colour = Modules.DamageColours.mana;
                else if (type === Modules.Hits.Experience)
                    colour = Modules.DamageColours.exp;
                else if (type === Modules.Hits.Poison)
                    colour = Modules.DamageColours.poison;
                else if (type === Modules.Hits.Profession)
                    colour = Modules.DamageColours.profession;

                splat.setColours(colour.fill, colour.stroke);

                self.addInfo(splat);

                break;

            case Modules.Hits.LevelUp:
                var lId = self.generateId(self.game.time, '-1', x, y),
                    levelSplat = new Splat(lId, type, 'Level Up!', x, y, false),
                    lColour = Modules.DamageColours.exp;

                levelSplat.setColours(lColour.fill, lColour.stroke);

                self.addInfo(levelSplat);

                break;

            case Modules.Info.Countdown:
                /**
                 * We only allow the creation of one countdown timer.
                 */

                if (self.countdownExists) return;

                var time = data.shift(),
                    countdown = new Countdown('countdown', time);

                self.addInfo(countdown);

                break;
        }
    }

    getCount() {
        return Object.keys(this.infos).length;
    }

    getCountdown() {
        return this.infos['countdown'];
    }

    addInfo(info) {
        var self = this;

        self.infos[info.id] = info;

        info.onDestroy(function (id) {
            self.destroyQueue.add(id);
        });
    }

    update(time) {
        var self = this;

        self.forEachInfo(function (info) {
            info.update(time);
        });

        self.destroyQueue.forEachQueue(function (id) {
            delete self.infos[id];
        });

        self.destroyQueue.reset();
    }

    countdownExists() {
        return 'countdown' in this.infos;
    }

    clearCountdown() {
        delete this.infos['countdown'];
    }

    forEachInfo(callback) {
        _.each(this.infos, function (info) {
            callback(info);
        });
    }

    generateId(time, info, x, y) {
        return time + '' + Math.abs(info) + '' + x + '' + y;
    }
}
