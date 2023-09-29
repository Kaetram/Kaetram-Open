import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules } from '@kaetram/common/network';

export type RankPacketCallback = (rank: Modules.Ranks) => void;

export default class RankPacket extends Packet {
    public constructor(rank: Modules.Ranks) {
        super(Packets.Rank, undefined, rank);
    }
}
