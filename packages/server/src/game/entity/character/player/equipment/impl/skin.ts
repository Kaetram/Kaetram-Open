import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

export default class Skin extends Equipment {
    public constructor(key = '', count = -1) {
        super(Modules.Equipment.Skin, key, count);
    }
}
