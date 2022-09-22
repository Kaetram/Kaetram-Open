import { PlayerInfo } from '@kaetram/e2e/cypress/entities/playerinfo';
import defaultPlayerInfo from '@kaetram/e2e/cypress/fixtures/playerinfo.default.json';

export function buildPlayerInfo(
    username: string,
    overwrites: Partial<PlayerInfo> = {}
): PlayerInfo {
    return {
        ...defaultPlayerInfo,
        ...overwrites,
        username
    };
}
