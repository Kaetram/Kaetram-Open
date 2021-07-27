import HealthFlask from './healthflask';

import type Player from '../../src/game/entity/character/player/player';

export interface Item {
    onUse(player: Player): void;
}

export default { HealthFlask };
