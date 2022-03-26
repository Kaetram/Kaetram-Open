import type { Opcodes } from '../network';

/**
 * Packet interfaces of data being sent from the client to the server.
 */

export interface LoginPacket {
    opcode: Opcodes.Login;
    username?: string;
    password?: string;
    email?: string;
}
