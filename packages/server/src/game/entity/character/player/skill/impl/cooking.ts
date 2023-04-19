import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Cooking extends Skill {
    public constructor() {
        super(Modules.Skills.Cooking);
    }
}
