import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { EntityDisplayInfo } from '@kaetram/common/types/entity';

export type UpdatePacketCallback = (info: EntityDisplayInfo[]) => void;

export default class UpdatePacket extends Packet {
    public constructor(data?: EntityDisplayInfo[]) {
        super(Packets.Update, undefined, data);
    }
}
