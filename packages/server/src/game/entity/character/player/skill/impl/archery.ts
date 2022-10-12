import Skill from '../skill';

import { Modules } from '@kaetram/common/network';

export default class Archery extends Skill {
    public constructor() {
        super(Modules.Skills.Archery);
    }
}
