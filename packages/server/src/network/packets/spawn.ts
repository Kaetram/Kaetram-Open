import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import Entity from '../../game/entity/entity';
import Player from '../../game/entity/character/player/player';

export default class Spawn extends Packet {
    public constructor(entity: Entity) {
        super(
            Packets.Spawn,
            undefined,
            entity.isPlayer() ? (entity as Player).serialize(true) : entity.serialize()
        );
    }
}
