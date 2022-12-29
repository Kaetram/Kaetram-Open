import defaultPlayerInfo from '@kaetram/e2e/cypress/fixtures/playerinfo.default.json';

import type { PlayerInfo } from '@kaetram/e2e/cypress/entities/playerinfo';

export function buildPlayerInfo(
    username: string,
    overwrites: Partial<PlayerInfo> = {},
    defaults: PlayerInfo = defaultPlayerInfo
): PlayerInfo {
    return {
        ...defaults,
        ...overwrites,
        username
    };
}
