import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Strength extends Skill {
    public constructor() {
        super(Modules.Skills.Strength);
    }
}
