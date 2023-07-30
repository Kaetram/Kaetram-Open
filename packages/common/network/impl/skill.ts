import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes, Modules } from '@kaetram/common/network';

export interface SkillData {
    type: Modules.Skills;
    experience: number;
    level?: number;
    percentage?: number;
    nextExperience?: number;
    combat?: boolean;
}

export interface SerializedSkills {
    skills: SkillData[];
    cheater: boolean;
}

export type SkillPacketData = SerializedSkills | SkillData;

export type SkillPacketCallback = (opcode: Opcodes.Skill, info: SkillPacketData) => void;

export default class SkillPacket extends Packet {
    public constructor(opcode: Opcodes.Skill, data?: SkillPacketData) {
        super(Packets.Skill, opcode, data);
    }
}
