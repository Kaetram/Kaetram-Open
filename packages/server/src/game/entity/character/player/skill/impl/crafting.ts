import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Crafting extends Skill {
    public constructor() {
        super(Modules.Skills.Crafting);
    }
}
