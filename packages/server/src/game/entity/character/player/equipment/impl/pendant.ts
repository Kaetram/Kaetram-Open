import Equipment from '../equipment';

import { Modules } from '@kaetram/common/network';

import type { Enchantments } from '@kaetram/common/types/item';

export default class Pendant extends Equipment {
    public constructor(key = '', count = -1, enchantments: Enchantments = {}) {
        super(Modules.Equipment.Pendant, key, count, enchantments);
    }
}
