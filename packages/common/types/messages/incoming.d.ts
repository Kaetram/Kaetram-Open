import type { Modules, Opcodes } from '../network';

/**
 * Packet interfaces of data being sent from the client to the server.
 */

export interface LoginPacket {
    opcode: Opcodes.Login;
    username?: string;
    password?: string;
    email?: string;
}

export interface ReadyPacket {
    hasMapData: string;
    userAgent: string;
}

export interface MovementPacket {
    opcode: Opcodes.Movement;
    requestX?: number;
    requestY?: number;
    playerX?: number;
    playerY?: number;
    movementSpeed?: number;
    hasTarget?: boolean;
    targetInstance?: string;
    orientation?: Modules.Orientation;
    frozen?: boolean;
    direction?: Modules.Orientation;
}
