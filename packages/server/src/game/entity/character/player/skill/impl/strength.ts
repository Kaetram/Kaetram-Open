import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Strength extends Skill {
    public override combat = true;

    public constructor() {
        super(Modules.Skills.Strength);
    }
}
