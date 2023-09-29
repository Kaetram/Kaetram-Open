import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules } from '@kaetram/common/network';

export interface AnimationPacketData {
    instance: string;
    action: Modules.Actions;
    resourceInstance?: string;
}

export type AnimationPacketCallback = (info: AnimationPacketData) => void;

export default class AnimationPacket extends Packet {
    public constructor(data: AnimationPacketData) {
        super(Packets.Animation, undefined, data);
    }
}
