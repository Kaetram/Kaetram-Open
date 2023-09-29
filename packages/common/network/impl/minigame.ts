import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';

export interface MinigamePacketData {
    action: number;
    countdown?: number;
    score?: number;
    redTeamKills?: number;
    blueTeamKills?: number;
    started?: boolean;
}

export type MinigamePacketCallback = (opcode: Opcodes.Minigame, info: MinigamePacketData) => void;

export default class MinigamePacket extends Packet {
    public constructor(opcode: Opcodes.Minigame, data?: MinigamePacketData) {
        super(Packets.Minigame, opcode, data);
    }
}
