import { Modules } from '@kaetram/common/network';
import Character from '../character';

export default class NPC extends Character {
    public override readonly type = Modules.EntityType.NPC;
}
