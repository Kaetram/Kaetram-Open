import { HitData } from '../info';
import { SerializedStoreItem } from '../stores';

import type { Modules, Opcodes } from '../../network';

/**
 * Packet interfaces of data being sent from the server to the client.
 */

export interface MovementPacket {
    instance: string; // Main entity involved in the movement.
    x?: number; // X coordinate of the movement.
    y?: number; // Y coordinate of the movement.
    forced?: boolean; // Whether or not the movement is forced.
    target?: string; // Entity instance we are trying to follow if specified.
    orientation?: Modules.Orientation;
    state?: boolean; // State about stun/freeze.
}

export type MovementCallback = (opcode: Opcodes.Movement, info: MovementPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface CombatPacket {
    instance: string; // The entity the combat packet revolves around.
    target: string; // Instance of the targeted entity.
    hit: HitData;
}

export type CombatCallback = (opcode: Opcodes.Combat, info: CombatPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface AnimationPacket {
    instance: string;
    action: Modules.Actions;
}

export type AnimationCallback = (info: AnimationPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface RespawnPacket {
    instance: string;
    x: number; // Spawn x coordinate
    y: number; // Spawn y coordinate
}

export type RespawnCallback = (opcode: Opcodes.Respawn, info: RespawnPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface StorePacket {
    opcode: Opcodes.Store;
    key: string;
    currency?: string;
    item?: SerializedStoreItem; // Used for selecting items.
    items?: SerializedStoreItem[]; // Used for batch data.
}

export type StoreCallback = (opcode: Opcodes.Store, info: StorePacket) => void;

////////////////////////////////////////////////////////////////////////////////
