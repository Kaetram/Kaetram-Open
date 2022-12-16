import { Modules } from '@kaetram/common/network';

import Skill from '../skill';

export default class Health extends Skill {
    public override combat = true;

    public constructor() {
        super(Modules.Skills.Health);
    }
}
