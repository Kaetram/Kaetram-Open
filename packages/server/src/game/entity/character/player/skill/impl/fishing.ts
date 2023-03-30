import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Fishing extends Skill {
    public constructor() {
        super(Modules.Skills.Fishing);
    }
}
