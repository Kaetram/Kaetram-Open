import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface TeleportPacketData {
    instance: string; // Main entity involved in the teleportation.
    x: number; // x coordinate of the teleportation.
    y: number; // y coordinate of the teleportation.
    withAnimation?: boolean;
}

export type TeleportPacketCallback = (info: TeleportPacketData) => void;

export default class TeleportPacket extends Packet {
    public constructor(data: TeleportPacketData) {
        super(Packets.Teleport, undefined, data);
    }
}
