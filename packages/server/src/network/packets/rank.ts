import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules } from '@kaetram/common/network';

export default class Rank extends Packet {
    public constructor(rank: Modules.Ranks) {
        super(Packets.Rank, undefined, rank);
    }
}
