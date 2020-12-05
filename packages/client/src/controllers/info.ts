import _ from 'lodash';

import Game from '../game';
import Countdown from '../renderer/infos/countdown';
import Splat from '../renderer/infos/splat';
import Modules from '../utils/modules';
import Queue from '../utils/queue';
import { isInt } from '../utils/util';

type Info = Splat | Countdown;

export default class InfoController {
    game: Game;
    infos: { [info: string]: Info };
    destroyQueue: Queue;

    constructor(game: Game) {
        this.game = game;

        this.infos = {};
        this.destroyQueue = new Queue();
    }

    create(type: number, data: unknown[], x: number, y: number): void {
        switch (type) {
            case Modules.Hits.Damage:
            case Modules.Hits.Stun:
            case Modules.Hits.Critical: {
                const damage = data.shift() as number | string;
                const isTarget = data.shift() as boolean;
                const dId = this.generateId(this.game.time, damage as number, x, y);

                if (damage < 1 || !isInt(damage as number)) (damage as string) = 'MISS';

                const hitSplat = new Splat(dId, type, damage.toString(), x, y, false);
                let dColour = isTarget
                    ? Modules.DamageColours.received
                    : Modules.DamageColours.inflicted;

                if (type === Modules.Hits.Critical)
                    dColour = isTarget
                        ? Modules.DamageColours.receivedCritical
                        : Modules.DamageColours.inflictedCritical;

                hitSplat.setColours(dColour.fill, dColour.stroke);

                this.addInfo(hitSplat);

                break;
            }

            case Modules.Hits.Heal:
            case Modules.Hits.Mana:
            case Modules.Hits.Experience:
            case Modules.Hits.Profession:
            case Modules.Hits.Poison: {
                const amount: number = data.shift() as number;
                const id: string = this.generateId(this.game.time, amount, x, y);
                let prefix = '+';
                let colour;
                let suffix = '';

                if (amount < 1 || !isInt(amount)) return;

                if (type !== Modules.Hits.Experience && type !== Modules.Hits.Profession)
                    prefix = '++';
                else suffix = ' EXP';

                if (type === Modules.Hits.Poison) prefix = '--';

                const splat = new Splat(id, type, prefix + amount + suffix, x, y, false);

                if (type === Modules.Hits.Heal) colour = Modules.DamageColours.healed;
                else if (type === Modules.Hits.Mana) colour = Modules.DamageColours.mana;
                else if (type === Modules.Hits.Experience) colour = Modules.DamageColours.exp;
                else if (type === Modules.Hits.Poison) colour = Modules.DamageColours.poison;
                else if (type === Modules.Hits.Profession)
                    colour = Modules.DamageColours.profession;

                splat.setColours(colour.fill, colour.stroke);

                this.addInfo(splat);

                break;
            }

            case Modules.Hits.LevelUp: {
                const lId = this.generateId(this.game.time, -1, x, y),
                    levelSplat = new Splat(lId, type, 'Level Up!', x, y, false),
                    lColour = Modules.DamageColours.exp;

                levelSplat.setColours(lColour.fill, lColour.stroke);

                this.addInfo(levelSplat);

                break;
            }

            case Modules.Infos.Countdown: {
                /**
                 * We only allow the creation of one countdown timer.
                 */

                if (this.countdownExists) return;

                const time = data.shift() as number,
                    countdown = new Countdown('countdown', time);

                this.addInfo(countdown);

                break;
            }
        }
    }

    getCount(): number {
        return Object.keys(this.infos).length;
    }

    getCountdown(): Info {
        return this.infos['countdown'];
    }

    addInfo(info: Info): void {
        this.infos[info.id] = info;

        info.onDestroy((id) => {
            this.destroyQueue.add(id);
        });
    }

    update(time: number): void {
        this.forEachInfo((info) => {
            info.update(time);
        });

        this.destroyQueue.forEachQueue((id) => {
            delete this.infos[id];
        });

        this.destroyQueue.reset();
    }

    countdownExists(): boolean {
        return 'countdown' in this.infos;
    }

    clearCountdown(): void {
        delete this.infos['countdown'];
    }

    forEachInfo(callback: (info: Info) => void): void {
        _.each(this.infos, (info) => {
            callback(info);
        });
    }

    generateId(time: number, info: number, x: number, y: number): string {
        return `${time}${Math.abs(info)}${x}${y}`;
    }
}
