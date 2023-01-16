import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Health extends Skill {
    public override combat = true;

    public constructor() {
        super(Modules.Skills.Health);
    }
}
