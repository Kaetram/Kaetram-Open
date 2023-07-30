import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export interface SerializedLight {
    instance: string;
    x: number;
    y: number;
    colour: string;
    diffuse: number;
    distance: number;
    flickerSpeed: number;
    flickerIntensity: number;

    entity?: string;
}

export interface OverlayPacketData {
    image?: string;
    colour?: string;
    light?: SerializedLight;
}

export type OverlayPacketCallback = (opcode: Opcodes.Overlay, info: OverlayPacketData) => void;

export default class OverlayPacket extends Packet {
    public constructor(opcode: Opcodes.Overlay, data?: OverlayPacketData) {
        super(Packets.Overlay, opcode, data);
    }
}
