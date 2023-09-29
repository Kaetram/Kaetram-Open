import Quest from '../quest';
import Data from '../../../../../../../data/quests/tutorial.json';

import config from '@kaetram/common/config';

export default class Tutorial extends Quest {
    protected override noPrompts = true;

    public constructor(key: string) {
        super(key, Data);

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
