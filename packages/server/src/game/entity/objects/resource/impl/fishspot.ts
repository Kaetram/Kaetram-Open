import Resource from '../resource';
import fishSpots from '../../../../../../data/fishing.json';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

export default class FishSpot extends Resource {
    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.FishSpot), key, x, y);

        this.setData(fishSpots[key as keyof typeof fishSpots]);
    }
}
