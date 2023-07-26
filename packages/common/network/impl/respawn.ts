import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type Entity from '@kaetram/server/src/game/entity/entity';

export interface RespawnPacketData {
    x: number; // Spawn x coordinate
    y: number; // Spawn y coordinate
}

export type RespawnPacketCallback = (info: RespawnPacketData) => void;

export default class RespawnPacket extends Packet {
    public constructor(entity: Entity) {
        super(Packets.Respawn, undefined, {
            x: entity.x,
            y: entity.y
        });
    }
}
