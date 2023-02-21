import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

export default class WeaponSkin extends Equipment {
    public constructor(key = '', count = -1) {
        super(Modules.Equipment.WeaponSkin, key, count);
    }
}
