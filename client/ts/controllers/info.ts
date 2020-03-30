/* global _, Modules */

import Queue from '../utils/queue';
import Splat from '../renderer/infos/splat';
import Countdown from '../renderer/infos/countdown';
import Modules from '../utils/modules';
import _ from 'underscore';
import { isInt } from '../utils/util';

export default class Info {
    game: any;
    infos: { [key: string]: any };
    destroyQueue: Queue;
    constructor(game) {
        this.game = game;

        this.infos = {};
        this.destroyQueue = new Queue();
    }

    create(type, data, x, y) {
        switch (type) {
            case Modules.Hits.Damage:
            case Modules.Hits.Stun:
            case Modules.Hits.Critical:
                let damage = data.shift();
                const isTarget = data.shift();
                const dId = this.generateId(this.game.time, damage, x, y);

                if (damage < 1 || !isInt(damage)) damage = 'MISS';

                const hitSplat = new Splat(dId, type, damage, x, y, false);
                const dColour = isTarget
                    ? Modules.DamageColours.received
                    : Modules.DamageColours.inflicted;

                hitSplat.setColours(dColour.fill, dColour.stroke);

                this.addInfo(hitSplat);

                break;

            case Modules.Hits.Heal:
            case Modules.Hits.Mana:
            case Modules.Hits.Experience:
            case Modules.Hits.Poison:
                const amount = data.shift();
                const id = this.generateId(this.game.time, amount, x, y);
                let text = '+';
                let colour;

                if (amount < 1 || !isInt(amount)) return;

                if (type !== Modules.Hits.Experience) text = '++';

                if (type === Modules.Hits.Poison) text = '--';

                const splat = new Splat(id, type, text + amount, x, y, false);

                if (type === Modules.Hits.Heal)
                    colour = Modules.DamageColours.healed;
                else if (type === Modules.Hits.Mana)
                    colour = Modules.DamageColours.mana;
                else if (type === Modules.Hits.Experience)
                    colour = Modules.DamageColours.exp;
                else if (type === Modules.Hits.Poison)
                    colour = Modules.DamageColours.poison;

                splat.setColours(colour.fill, colour.stroke);

                this.addInfo(splat);

                break;

            case Modules.Hits.LevelUp:
                const lId = this.generateId(this.game.time, '-1', x, y);
                const levelSplat = new Splat(
                    lId,
                    type,
                    'Level Up!',
                    x,
                    y,
                    false
                );
                const lColour = Modules.DamageColours.exp;

                levelSplat.setColours(lColour.fill, lColour.stroke);

                this.addInfo(levelSplat);

                break;

            case Modules.Info.Countdown:
                /**
                 * We only allow the creation of one countdown timer.
                 */

                if (this.countdownExists) return;

                const time = data.shift();
                const countdown = new Countdown('countdown', time);

                this.addInfo(countdown);

                break;
        }
    }

    getCount() {
        return Object.keys(this.infos).length;
    }

    getCountdown() {
        return this.infos.countdown;
    }

    addInfo(info) {
        this.infos[info.id] = info;

        info.onDestroy(function(id) {
            this.destroyQueue.add(id);
        });
    }

    update(time) {
        this.forEachInfo(function(info) {
            info.update(time);
        });

        this.destroyQueue.forEachQueue(function(id) {
            delete this.infos[id];
        });

        this.destroyQueue.reset();
    }

    countdownExists() {
        return 'countdown' in this.infos;
    }

    clearCountdown() {
        delete this.infos.countdown;
    }

    forEachInfo(callback) {
        _.each(this.infos, function(info) {
            callback(info);
        });
    }

    generateId(time, info, x, y) {
        return time + '' + Math.abs(info) + '' + x + '' + y;
    }
}
