import _ from 'lodash';
import Modules from '../utils/modules';
import Queue from '../utils/queue';
import Splat from '../renderer/infos/splat';
import Countdown from '../renderer/infos/countdown';
import { isInt } from '../utils/util';
import Game from '../game';

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

    create(type: number, data: any[], x: number, y: number): void {
        switch (type) {
            case Modules.Hits.Damage:
            case Modules.Hits.Stun:
            case Modules.Hits.Critical: {
                let damage = data.shift();
                const isTarget: boolean = data.shift();
                const dId = this.generateId(this.game.time, damage, x, y);

                if (damage < 1 || !isInt(damage)) damage = 'MISS';

                const hitSplat = new Splat(dId, type, damage, x, y, false);
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
                const amount: number = data.shift();
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

                const time: number = data.shift(),
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
