import _ from 'lodash';

import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';

import { Modules } from '@kaetram/common/network';

export default class QueenAnt extends Default {
    public constructor(mob: Mob) {
        super(mob);
    }
}
