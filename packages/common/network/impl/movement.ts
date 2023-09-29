import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Opcodes, Modules } from '@kaetram/common/network';

export interface MovementPacketData {
    instance: string; // Main entity involved in the movement.
    x?: number; // X coordinate of the movement.
    y?: number; // Y coordinate of the movement.
    forced?: boolean; // Whether or not the movement is forced.
    target?: string; // Entity instance we are trying to follow if specified.
    orientation?: Modules.Orientation;
    state?: boolean; // State about stun/freeze.
    movementSpeed?: number; // Movement speed of the entity.
}

export type MovementPacketCallback = (opcode: Opcodes.Movement, info: MovementPacketData) => void;

export default class MovementPacket extends Packet {
    public constructor(opcode: Opcodes.Movement, data?: MovementPacketData) {
        super(Packets.Movement, opcode, data);
    }
}
