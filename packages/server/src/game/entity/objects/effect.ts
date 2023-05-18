import Entity from '../entity';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

export default class Effect extends Entity {
    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.Effect), key, x, y);
    }
}
