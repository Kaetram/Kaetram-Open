import Quest from '../quest';

import type { RawQuest } from '@kaetram/common/types/quest';

export default class DesertQuest extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);
    }
}
