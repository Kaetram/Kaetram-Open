import Minigame from '../minigame';

import { Opcodes } from '@kaetram/common/network';

import type World from '../../world';

/**
 * Temporary name for this minigame. This minigame consists of a hunter
 * and a prey. The hunter has a certain amount of time to kill the prey,
 * at which point they will receive a reward. The prey must survive
 * for a certain amount of time, at which point they will receive a reward.
 */

export default class Coursing extends Minigame {
    public constructor(world: World) {
        super(world, Opcodes.Minigame.Coursing);
    }
}
