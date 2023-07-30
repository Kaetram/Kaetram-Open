import Quest from '../quest';

import type { RawQuest } from '@kaetram/common/network/impl/quest';

export default class AncientLands extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);
    }
}
