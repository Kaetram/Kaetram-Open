import healthFlask from './healthflask';

import type Player from '../../src/game/entity/character/player/player';

export interface Plugin {
    onUse(player: Player): void;
}

export default { healthFlask };
