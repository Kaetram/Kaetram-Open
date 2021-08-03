import _ from 'lodash';

import { Modules } from '@kaetram/common/network';

import Countdown from '../renderer/infos/countdown';
import Splat from '../renderer/infos/splat';
import Queue from '../utils/queue';
import { isInt } from '../utils/util';

import type Game from '../game';

type Info = Splat | Countdown;

export default class InfoController {
    private infos: { [info: string]: Info } = {};
    private destroyQueue = new Queue();

    public constructor(private game: Game) {}

    public create(
        type: Modules.Hits | Modules.Infos,
        data: [number, boolean?] | null,
        x: number,
        y: number
    ): void {
        let { time } = this.game;

        switch (type) {
            case Modules.Hits.Damage:
            case Modules.Hits.Stun:
            case Modules.Hits.Critical: {
                let [damage, isTarget] = data!,
                    dId = this.generateId(time, damage, x, y),
                    text = damage.toString();

                if (damage < 1 || !isInt(damage)) text = 'MISS';

                let hitSplat = new Splat(dId, type, text, x, y, false),
                    dColour = isTarget
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
                let [amount] = data!,
                    id: string = this.generateId(time, amount, x, y),
                    prefix = '+',
                    suffix = '',
                    colour: Modules.Colours | null = null;

                if (amount < 1 || !isInt(amount)) return;

                if (type !== Modules.Hits.Experience && type !== Modules.Hits.Profession)
                    prefix = '++';
                else suffix = ' EXP';

                if (type === Modules.Hits.Poison) prefix = '--';

                let splat = new Splat(id, type, prefix + amount + suffix, x, y, false);

                switch (type) {
                    case Modules.Hits.Heal:
                        colour = Modules.DamageColours.healed;
                        break;
                    case Modules.Hits.Mana:
                        colour = Modules.DamageColours.mana;
                        break;
                    case Modules.Hits.Experience:
                        colour = Modules.DamageColours.exp;
                        break;
                    case Modules.Hits.Poison:
                        colour = Modules.DamageColours.poison;
                        break;
                    case Modules.Hits.Profession:
                        colour = Modules.DamageColours.profession;
                        break;
                }

                if (colour) splat.setColours(colour.fill, colour.stroke);

                this.addInfo(splat);

                break;
            }

            case Modules.Hits.LevelUp: {
                let lId = this.generateId(time, -1, x, y),
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

                if (this.countdownExists()) return;

                let [time] = data!,
                    countdown = new Countdown('countdown', time);

                this.addInfo(countdown);

                break;
            }
        }
    }

    public getCount(): number {
        return Object.keys(this.infos).length;
    }

    private addInfo(info: Info): void {
        this.infos[info.id] = info;

        info.onDestroy((id) => this.destroyQueue.add(id));
    }

    public update(time: number): void {
        this.forEachInfo((info) => info.update(time));

        this.destroyQueue.forEachQueue((id) => delete this.infos[id]);

        this.destroyQueue.reset();
    }

    private countdownExists(): boolean {
        return 'countdown' in this.infos;
    }

    public forEachInfo(callback: (info: Info) => void): void {
        _.each(this.infos, callback);
    }

    private generateId(time: number, info: number, x: number, y: number): string {
        return `${time}${Math.abs(info)}${x}${y}`;
    }
}
