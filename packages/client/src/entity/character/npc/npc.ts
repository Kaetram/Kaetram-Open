import Character from '../character';

import { Modules } from '@kaetram/common/network';

export default class NPC extends Character {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.NPC);
    }
}
