import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules } from '@kaetram/common/network';

export type ResourcePacketData = {
    instance: string;
    state: Modules.ResourceState;
};

export type ResourcePacketCallback = (data: ResourcePacketData) => void;

export default class ResourcePacket extends Packet {
    public constructor(data: ResourcePacketData) {
        super(Packets.Resource, undefined, data);
    }
}
