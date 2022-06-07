import { Modules } from '@kaetram/common/network';
import Character from '../character';

export default class NPC extends Character {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.NPC);
    }
}
