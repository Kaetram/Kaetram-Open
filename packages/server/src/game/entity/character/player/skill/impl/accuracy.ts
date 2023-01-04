import { Modules } from '@kaetram/common/network';

import Skill from '../skill';

export default class Accuracy extends Skill {
    public override combat = true;

    public constructor() {
        super(Modules.Skills.Accuracy);
    }
}
