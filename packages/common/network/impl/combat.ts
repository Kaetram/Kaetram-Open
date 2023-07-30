import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { HitData } from '@kaetram/common/types/info';
import type { Opcodes } from '@kaetram/common/network';

export interface CombatPacketData {
    instance: string; // The entity the combat packet revolves around.
    target: string; // Instance of the targeted entity.
    hit: HitData;
}

export type CombatPacketCallback = (opcode: Opcodes.Combat, info: CombatPacketData) => void;

export default class CombatPacket extends Packet {
    public constructor(opcode: Opcodes.Combat, data: CombatPacketData) {
        super(Packets.Combat, opcode, data);
    }
}
