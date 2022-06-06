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

export interface EquipmentPacket {
    opcode: Opcodes.Equipment;
    type: Modules.Equipment;
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

export interface ProjectilePacket {
    opcode: Opcodes.Projectile;
    instance: string;
    target: string;
}

export interface ContainerPacket {
    opcode: Opcodes.Container; // The action we're performing.
    type: Modules.ContainerType; // Container the action is taking place in.
    subType: Modules.ContainerType; // Used by the bank to determine container actions.
    index?: number;
    tIndex?: number;
    count?: number;
}

export interface WarpPacket {
    id: number;
}

export interface StorePacket {
    opcode: Opcodes.Store;
    key: string; // The shop's key.
    index: number; // Index of the item we are working with.
    count?: number; // How many of the item we are trying to buy/sell
}
