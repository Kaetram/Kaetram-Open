import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import Entity from '../../game/entity/entity';

export default class Respawn extends Packet {
    public constructor(entity: Entity) {
        super(Packets.Respawn, undefined, {
            instance: entity.instance,
            x: entity.x,
            y: entity.y
        });
    }
}
