import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

import type Entity from '../../game/entity/entity';

export default class Respawn extends Packet {
    public constructor(entity: Entity) {
        super(Packets.Respawn, undefined, {
            x: entity.x,
            y: entity.y
        });
    }
}
