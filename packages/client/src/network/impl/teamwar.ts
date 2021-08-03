import log from '../../lib/log';

import type { MinigameData } from '@kaetram/common/types/messages';

export default class TeamWar {
    public handle(info: MinigameData): void {
        log.info(info);
    }
}
