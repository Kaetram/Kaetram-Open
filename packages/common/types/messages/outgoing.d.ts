import { HitData } from '../info';
import { EntityData } from '../entity';
import { PlayerData } from '../player';
import { SerializedStoreItem } from '../stores';

import type { Modules, Opcodes } from '../../network';
import { EquipmentData, SerializedEquipment } from '../equipment';

/**
 * Packet interfaces of data being sent from the server to the client.
 */

////////////////////////////////////////////////////////////////////////////////

export type HandshakeCallback = () => void;

////////////////////////////////////////////////////////////////////////////////

export type WelcomeCallback = (data: PlayerData) => void;

////////////////////////////////////////////////////////////////////////////////

export interface EquipmentPacket {
    data?: SerializedEquipment | EquipmentData;
    type?: Modules.Equipment; // Specified when equipping a specific item
}

export type EquipmentCallback = (opcode: Opcodes.Equipment, info: EquipmentPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type EntityListCallback = (entities: string[]) => void;

////////////////////////////////////////////////////////////////////////////////

export type SyncCallback = (data: PlayerData) => void;

////////////////////////////////////////////////////////////////////////////////

export type SpawnCallback = (data: EntityData) => void;

////////////////////////////////////////////////////////////////////////////////

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

export interface TeleportPacket {
    instance: string; // Main entity involved in the teleportation.
    x: number; // x coordinate of the teleportation.
    y: number; // y coordinate of the teleportation.
    withAnimation?: boolean;
}

export type TeleportCallback = (info: TeleportPacket) => void;

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

export interface ChatPacket {
    instance?: string; // Entity that the chat packet belongs to.
    message: string; // Message contents of the packet.
    withBubble?: boolean; // If the message should have a bubble.
    global?: boolean; // Whether to prefix `[Global]` to the message.
    colour?: string; // Colour of the message.
    source?: string;
}

export type ChatCallback = (info: ChatPacket) => void;

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
