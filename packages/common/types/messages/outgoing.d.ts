import type { SerializedContainer, SlotData } from '@kaetram/common/types/slot';
import type { Modules, Opcodes } from '../../network';
import type { AbilityData, SerializedAbility } from '../ability';
import type { EntityData, EntityDisplayInfo } from '../entity';
import type { EquipmentData, SerializedEquipment } from '../equipment';
import type { Friend } from '../friends';
import type { HitData } from '../info';
import type { SerializedLight } from '../light';
import type { PlayerData } from '../player';
import type { QuestData } from '../quest';
import type { SerializedSkills, SkillData } from '../skills';
import type { SerializedStoreItem } from '../stores';

/**
 * Packet interfaces of data being sent from the server to the client.
 */

////////////////////////////////////////////////////////////////////////////////

export interface HandshakePacket {
    instance: string; // Player's instance.
    serverId: number;
}

export type HandshakeCallback = (data: HandshakePacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type WelcomeCallback = (data: PlayerData) => void;

////////////////////////////////////////////////////////////////////////////////

export type MapCallback = (data: string) => void;

////////////////////////////////////////////////////////////////////////////////

export interface EquipmentPacket {
    data?: SerializedEquipment | EquipmentData;
    type?: Modules.Equipment; // Specified when equipping a specific item
    count?: number;
    attackStyle?: Modules.AttackStyle;
    attackRange?: number; // Passed with attack style to update the player's attack range.
}

export type EquipmentCallback = (opcode: Opcodes.Equipment, info: EquipmentPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface ListPacket {
    entities?: string[]; // List of entity instances to be checked in the client.
    positions?: { [instance: string]: Position }; // List of entity positions to verify.
}

export type EntityListCallback = (opcode: Opcodes.List, info: ListPacket) => void;

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
    movementSpeed?: number; // Movement speed of the entity.
}

export type MovementCallback = (opcode: Opcodes.Movement, info: MovementPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface DespawnPacket {
    instance: string; // The entity we are despawning.
    regions?: number[]; // Region checker for when an entity despawns.
}

export type DespawnCallback = (info: DespawnPacket) => void;

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

export interface PointsPacket {
    instance: string;
    hitPoints?: number;
    maxHitPoints?: number;
    mana?: number;
    maxMana?: number;
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
    data?: SerializedContainer; // Batch data
    slot?: SlotData; // Used for adding or removing an item to the container.
}

export type ContainerCallback = (opcode: Opcodes.Container, info: ContainerPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type AbilityPacket = SerializedAbility | AbilityData;

export type AbilityCallback = (opcode: Opcodes.Ability, info: AbilityPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface QuestPacket {
    key?: string;
    stage?: number;
    subStage?: number;
    quests?: QuestData[]; // Batch of quests
}

export type QuestCallback = (opcode: Opcodes.Quest, info: QuestPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface AchievementPacket {
    key?: string;
    name?: string;
    description?: string;
    stage?: number;
    achievements?: AchievementData[];
}

export type AchievementCallback = (opcode: Opcodes.Achievement, info: AchievementPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface NotificationPacket {
    title?: string; // Title when displaying a popup.
    message: string; // String message to display.
    colour?: string; // Colour of the message.
    source?: string;
}

export type NotificationCallback = (opcode: Opcodes.Notification, info: NotificationPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type BlinkCallback = (instance: string) => void;

////////////////////////////////////////////////////////////////////////////////

export interface HealPacket {
    instance: string;
    type: Modules.HealTypes;
    amount: number;
}

export type HealCallback = (info: HealPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface ExperiencePacket {
    instance: string;
    amount?: number;
    level?: number;
    skill?: Modules.Skills;
}

export type ExperienceCallback = (opcode: Opcodes.Experience, info: ExperiencePacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type DeathCallback = () => void;

////////////////////////////////////////////////////////////////////////////////

export type MusicCallback = (newSong?: string) => void;

////////////////////////////////////////////////////////////////////////////////

export interface NPCPacket {
    instance?: string; // Used when an NPC sends a text message.
    text?: string; // Message to display in a bubble.
    slots?: SlotData[]; // When opening a bank NPC.
}

export type NPCCallback = (opcode: Opcodes.NPC, info: NPCPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface RespawnPacket {
    x: number; // Spawn x coordinate
    y: number; // Spawn y coordinate
}

export type RespawnCallback = (opcode: Opcodes.Respawn, info: RespawnPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface TradePacket {
    instance?: string;
    index?: number;
    count?: number;
    key?: string;
    message?: string;
}

export type TradeCallback = (opcode: Opcodes.Trade, info: TradePacket) => void;

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

export interface PVPPacket {
    state: boolean;
}

export type PVPCallback = (info: PVPPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type PoisonCallback = (type: number) => void;

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
    light?: SerializedLight;
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

export type BubbleCallback = (opcode: Opcodes.Bubble, info: BubblePacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type SkillPacket = SerializedSkills | SkillData;

export type SkillCallback = (opcode: Opcodes.Skill, info: SkillPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type UpdateCallback = (info: EntityDisplayInfo[]) => void;

////////////////////////////////////////////////////////////////////////////////

export interface MinigamePacket {
    action: number;
    countdown?: number;
    redTeamKills?: number;
    blueTeamKills?: number;
    started?: boolean;
}

export type MinigameCallback = (opcode: Opcodes.Minigame, info: MinigamePacket) => void;

//////////////////////////////s//////////////////////////////////////////////////

export interface EffectPacket {
    instance: string;
    movementSpeed?: number;
    state?: boolean;
}

export type EffectCallback = (opcode: Opcodes.Effect, info: EffectPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export interface FriendsPacket {
    list?: Friend;
    username?: string;
    status?: boolean;
    serverId?: number;
}

export type FriendsCallback = (opcode: Opcodes.Friends, info: FriendsPacket) => void;

////////////////////////////////////////////////////////////////////////////////

export type RankCallback = (rank: Modules.Ranks) => void;

//////////////////////////////s//////////////////////////////////////////////////
