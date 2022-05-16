import _ from 'lodash';

import Utils from '../utils/util';

import Splat from '../renderer/infos/splat';

import { Modules } from '@kaetram/common/network';

export default class InfoController {
    private infos: { [info: string]: Splat } = {};

    public create(
        type: Modules.Hits,
        amount: number,
        x: number,
        y: number,
        isTarget = false
    ): void {
        let id = Utils.createId(Date.now(), x, y);

        this.addInfo(new Splat(id, type, amount, x, y, isTarget));
    }

    /**
     * Adds an info and creates a callback for when
     * the info is destroyed. When that happens, we
     * delete the info from our dictionary of infos.
     * @param info The info we are adding.
     */

    private addInfo(info: Splat): void {
        this.infos[info.id] = info;

        info.onDestroy((id) => delete this.infos[id]);
    }

    /**
     * @returns True if the number of keys in infos is 0.
     */

    public isEmpty(): boolean {
        return _.size(this.infos) === 0;
    }

    /**
     * Sends an update to each info object with the current time.
     * @param time The current game time.
     */

    public update(time: number): void {
        this.forEachInfo((info) => info.update(time));
    }

    /**
     * Iterates through all the infos in the dictionary.
     * @param callback Contains the current info being iterated.
     */

    public forEachInfo(callback: (info: Splat) => void): void {
        _.each(this.infos, callback);
    }
}
