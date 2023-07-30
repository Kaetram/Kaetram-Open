import Quest from '../quest';

import type { RawQuest } from '@kaetram/common/network/impl/quest';

export default class ScientistsPotion extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);
    }
}
