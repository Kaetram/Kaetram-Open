import Quest from '../quest';

import type { RawQuest } from '@kaetram/common/types/quest';

export default class RoyalDrama extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);
    }
}
