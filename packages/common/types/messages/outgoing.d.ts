import { SerializedContainer, SlotData } from '@kaetram/common/types/slot';
import { HitData } from '../info';
import { EntityData } from '../entity';
import { PlayerData } from '../player';
import { SerializedQuest } from '../quest';
import { SerializedStoreItem } from '../stores';
import { EquipmentData, SerializedEquipment } from '../equipment';

import type { Modules, Opcodes } from '../../network';

/**
 * Packet interfaces of data being sent from the server to the client.
 */

////////////////////////////////////////////////////////////////////////////////

export type HandshakeCallback = () => void;

////////////////////////////////////////////////////////////////////////////////

export type WelcomeCallback = (data: PlayerData) => void;

////////////////////////////////////////////////////////////////////////////////

export type MapCallback = (data: string) => void;

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

export type DespawnCallback = (instance: string) => void;

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

export interface PointsPacket {
    instance: string;
    hitPoints?: number;
    mana?: number;
}

export type PointsCallback = (info: PointsPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type NetworkCallback = (opcode?: Opcodes.Network) => void;

////////////////////////////////////////////////////////////////////////////////

export interface ChatPacket {
    instance?: string; // Entity that the chat packet belongs to.
    message: string; // Message contents of the packet.
    withBubble?: boolean; // If the message should have a bubble.
    colour?: string; // Colour of the message.
    source?: string;
}

export type ChatCallback = (info: ChatPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface CommandPacket {
    command: string;
}

export type CommandCallback = (info: CommandPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface ContainerPacket {
    type: Modules.ContainerType;
    data?: SerializedContainer;
    slot?: SlotData;
}

export type ContainerCallback = (opcode: Opcodes.Container, info: ContainerPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type AbilityCallback = () => void;

////////////////////////////////////////////////////////////////////////////////

export interface QuestPacket {
    key?: string;
    stage?: number;
    stageCount?: number;
    data?: SerializedQuest; // Batch of quests
}

export type QuestCallback = (opcode: Opcodes.Quest, info: QuestPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type AchievementCallback = () => void;

////////////////////////////////////////////////////////////////////////////////

export interface NotificationPacket {
    title?: string; // Title when displaying a popup.
    message: string; // String message to display.
    colour?: string; // Colour of the message.
}

export type NotificationCallback = (opcode: Opcodes.Notification, info: NotificationPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type BlinkCallback = (instance: string) => void;

////////////////////////////////////////////////////////////////////////////////

export interface HealPacket {
    instance: string;
    type: Modules.HealType;
    amount: number;
}

export type HealCallback = (info: HealPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface ExperiencePacket {
    instance: string;
    amount: number;
    level?: number;
    experience?: number;
    nextExperience?: number;
    prevExperience?: number;
}

export type ExperienceCallback = (opcode: Opcodes.Experience, info: ExperiencePacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type DeathCallback = () => void;

////////////////////////////////////////////////////////////////////////////////

export type AudioCallback = (newSong: string) => void;

////////////////////////////////////////////////////////////////////////////////

export interface NPCPacket {
    instance?: string; // Used when an NPC sends a text message.
    text?: string; // Message to display in a bubble.
    bank?: SerializedContainer; // When opening a bank NPC.
}

export type NPCCallback = (opcode: Opcodes.NPC, info: NPCPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface RespawnPacket {
    x: number; // Spawn x coordinate
    y: number; // Spawn y coordinate
}

export type RespawnCallback = (opcode: Opcodes.Respawn, info: RespawnPacket) => void;

////////////////////////////////////////////////////////////////////////////////

// TODO
export interface EnchantPacket {
    index: number;
    type: string;
}

export type EnchantCallback = (opcode: Opcodes.Enchant, info: EnchantPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type GuildCallback = (opcode: Opcodes.Guild) => void;

////////////////////////////////////////////////////////////////////////////////

export interface PointerPacket {
    instance: string;
    x?: number;
    y?: number;
    button?: string;
}

export type PointerCallback = (opcode: Opcodes.Pointer, info: PointerPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type PVPCallback = (instance: string, state: boolean) => void;

////////////////////////////////////////////////////////////////////////////////

export interface StorePacket {
    key?: string;
    currency?: string;
    item?: SerializedStoreItem; // Used for selecting items.
    items?: SerializedStoreItem[]; // Used for batch data.
}

export type StoreCallback = (opcode: Opcodes.Store, info: StorePacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface OverlayPacket {
    image?: string;
    colour?: string;
}

export type OverlayCallback = (opcode: Opcodes.Overlay, info: OverlayPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type CameraCallback = (opcode: Opcodes.Camera) => void;

////////////////////////////////////////////////////////////////////////////////

export interface BubblePacket {
    instance: string;
    text: string;
    duration?: number;
    x?: number;
    y?: number;
}

export type BubbleCallback = (info: BubblePacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface SkillPacket {
    key: string;
}
