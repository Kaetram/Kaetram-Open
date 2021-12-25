import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import Entity from '../../game/entity/entity';

export default class Respawn extends Packet {
    public constructor(entity: Entity) {
        super(Packets.Respawn, undefined, [entity.instance, entity.x, entity.y]);
    }
}
