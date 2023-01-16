import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

export default class PirateCaptain extends Default {
    public constructor(mob: Mob) {
        super(mob);
    }
}
