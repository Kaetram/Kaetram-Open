import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules, Opcodes } from '@kaetram/common/network';

export interface ExperiencePacketData {
    instance: string;
    amount?: number;
    level?: number;
    skill?: Modules.Skills;
}

export type ExperiencePacketCallback = (
    opcode: Opcodes.Experience,
    info: ExperiencePacketData
) => void;

export default class ExperiencePacket extends Packet {
    public constructor(opcode: Opcodes.Experience, data: ExperiencePacketData) {
        super(Packets.Experience, opcode, data);
    }
}
