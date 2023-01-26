import Quest from '../quest';

import config from '@kaetram/common/config';

import type { RawQuest } from '@kaetram/common/types/quest';

export default class Tutorial extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);

        if (!config.tutorialEnabled) this.setStage(this.stageCount, 0, false);
    }

    /**
     * This override calls the `setStage()` in the
     * quest superclass in order to trigger the pointer
     * data.
     */

    public override loaded(): void {
        // Skip if tutorial is not enabled.
        if (!config.tutorialEnabled) return;

        this.setStage(0, 0, false);
    }
}
