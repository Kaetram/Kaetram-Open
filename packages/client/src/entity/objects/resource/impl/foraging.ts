import Resource from '../resource';

import { Modules } from '@kaetram/common/network';

export default class Foraging extends Resource {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.Foraging);
    }
}
