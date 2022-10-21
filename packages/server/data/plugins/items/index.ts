import healthflask from './healthflask';

import type Player from '@kaetram/server/src/game/entity/character/player/player';

export interface Plugin {
    onUse(player: Player): boolean;
}

export default { healthflask };
