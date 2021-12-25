import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import Entity from '../../game/entity/entity';

export default class Spawn extends Packet {
    public constructor(entity: Entity) {
        super(Packets.Spawn, undefined, entity.serialize());
    }
}
