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

export interface ProjectilePacket {
    opcode: Opcodes.Projectile;
    instance: string;
    target: string;
}

export interface ContainerPacket {
    opcode: Opcodes.Container;
    type: Modules.ContainerType;
    index?: number;
    tIndex?: number;
    count?: number;
}

export interface StorePacket {
    opcode: Opcodes.Store;
    storeKey: string; // The shop's key.
    itemKey: string; // Item key we are trying to buy/sell
    count?: number; // How many of the item we are trying to buy/sell
    index?: number; // The index of the slot in the inventory.
}
