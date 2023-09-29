import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { PlayerData } from './player';

export type SyncPacketCallback = (data: PlayerData) => void;

export default class SyncPacket extends Packet {
    public constructor(data: PlayerData) {
        super(Packets.Sync, undefined, data);
    }
}
