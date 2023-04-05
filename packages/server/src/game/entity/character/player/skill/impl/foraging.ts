import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Foraging extends Skill {
    public constructor() {
        super(Modules.Skills.Foraging);
    }
}
