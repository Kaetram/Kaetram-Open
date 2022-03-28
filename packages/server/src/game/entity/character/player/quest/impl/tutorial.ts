import Quest from '../quest';

import { RawQuest } from '@kaetram/common/types/quest';

export default class Tutorial extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);
    }

    /**
     * This override calls the `setStage()` in the
     * quest superclass in order to trigger the pointer
     * data.
     */

    public override loaded(): void {
        this.setStage(0, 0, false);
    }
}
