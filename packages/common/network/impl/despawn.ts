import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export interface DespawnPacketData {
    instance: string; // The entity we are despawning.
    regions?: number[]; // Region checker for when an entity despawns.
}

export type DespawnPacketCallback = (info: DespawnPacketData) => void;

export default class DespawnPacket extends Packet {
    public constructor(info: DespawnPacketData) {
        super(Packets.Despawn, undefined, info);
    }
}
