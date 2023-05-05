import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { SlotData } from '@kaetram/common/types/slot';

export default class LootBag extends Packet {
    public constructor(slots: SlotData[]) {
        super(Packets.LootBag, undefined, slots);
    }
}
