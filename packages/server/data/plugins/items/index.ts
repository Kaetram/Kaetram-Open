import healthflask from './healthflask';
import poisoncure from './poisoncure';
import blackpotion from './blackpotion';

import type Player from '@kaetram/server/src/game/entity/character/player/player';

export interface Plugin {
    onUse(player: Player): boolean;
}

export default {
    healthflask,
    poisoncure,
    blackpotion
};
