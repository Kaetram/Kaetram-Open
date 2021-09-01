import type { Modules, Opcodes } from '../network';
import type {
    AchievementData,
    BubbleInfo,
    EquipmentData,
    EquipmentType,
    HitData,
    ProfessionsInfo,
    QuestInfo,
    ShopData,
    SlotData,
    TilesetData
} from './info';
import type { ProcessedArea } from './map';

export interface HandshakeData {
    id: string;
}

export interface WelcomeData {
    instance: string;
    username: string;
    x: number;
    y: number;
    rights: number;
    hitPoints: number[];
    mana: number[];
    experience: number;
    nextExperience: number | undefined;
    prevExperience: number;
    level: number;
    lastLogin: number;
    pvpKills: number;
    pvpDeaths: number;
    orientation: number;
    movementSpeed: number;
}

export interface SpawnData {
    string?: string | null;
    type: string;
    id: string;
    name: string | null;
    x: number;
    y: number;
    nameColour?: string;
    customScale?: number;
}

export interface SyncData {
    id: string;
    orientation?: Modules.Orientation;
    attackRange?: number;
    hitPoints?: number;
    maxHitPoints?: number;
    mana?: number;
    maxMana?: number;
    experience?: number;
    level?: number;
    armour?: string;
    weapon?: EquipmentData;
    poison?: boolean;
    movementSpeed?: number;
}

export interface EquipmentBatchData {
    armour: EquipmentData;
    weapon: EquipmentData;
    pendant: EquipmentData;
    ring: EquipmentData;
    boots: EquipmentData;
}
export type EquipmentEquipData = EquipmentData;
export type EquipmentUnequipData = EquipmentType;

export interface MovementMoveData {
    id: string;
    x: number;
    y: number;
    forced?: boolean;
    teleport?: boolean;
}
export interface MovementFollowData {
    attackerId: string;
    targetId: string;
    isRanged?: boolean;
    attackRange?: number;
}
export interface MovementStopData {
    instance: string;
    force: boolean;
}
export interface MovementStateData {
    id: string;
    state: boolean;
}
export type MovementOrientateData = [instance: string, orientation: number];

export interface TeleportData {
    id: string;
    x: number;
    y: number;
    withAnimation: boolean | undefined;
}

export interface CombatData {
    attackerId: string | null;
    targetId: string | null;
}
export interface CombatHitData extends CombatData {
    hitInfo?: HitData;
}
export interface CombatSyncData extends CombatData {
    x: number;
    y: number;
}

export interface AnimationData {
    action: Modules.Actions;
}

export interface ProjectileData {
    type: string; // 'projectile'
    id: string;
    name: string;
    characterId: string;
    targetId: string;
    damage: number;
    special: never;
    hitType: Modules.Hits | null;
}

export interface PointsData {
    id: string;
    hitPoints: number;
    mana: number | null;
}

export interface ChatData {
    id?: string;
    name: string;
    text: string;
    colour?: string | undefined;
    duration?: number;
    isGlobal?: boolean;
    withBubble: boolean;
}

export interface CommandData {
    command: string;
}

export type ContainerBatchData = [size: number, slots: Slot[]];
export type ContainerAddData = SlotData;
export type ContainerRemoveData = Pick<SlotData, 'index' | 'count'>;

export interface QuestBatchData {
    quests: QuestInfo[];
}
export interface QuestAchievementBatchData {
    achievements: AchievementData[];
}
export interface QuestProgressData {
    id: number;
    isQuest?: boolean;
    stage?: number;
    name?: string;
    progress?: number;
    count?: number;
}
export interface QuestFinishData {
    id: number;
    name?: string;
    isQuest: boolean;
}

export interface NotificationData {
    title?: string;
    message: string;
    colour?: string | undefined;
}

export interface HealData {
    id: string;
    type: 'health' | 'mana';
    amount: number;
}

export interface ExperienceCombatData {
    id: string;
    level: number;
    amount: number;
    experience: number;
    nextExperience: number | undefined;
    prevExperience: number;
}
export interface ExperienceProfessionData {
    id: string;
    amount: number;
}

export interface NPCTalkData {
    id: string | null;
    text: string | undefined;
    nonNPC?: boolean;
}
export type NPCStoreData = Record<string, never>;
export type NPCBankData = Record<string, never>;
export type NPCEnchantData = Record<string, never>;
export interface NPCCountdownData {
    id: string;
    countdown: number;
}

export interface EnchantData {
    type: string;
    index: number;
}

export interface PointerData {
    id: string;
}
export interface PointerLocationData extends PointerData, Pos {}
export interface PointerRelativeData extends PointerData, Pos {}
export type PointerRemoveData = Record<string, never>;
export interface PointerButtonData extends PointerData {
    button: string;
}

export interface ShopOpenData {
    instance: string;
    npcId: number;
    shopData: ShopData;
}
export type ShopBuyData = [shop: number, id: number, n: number];
export type ShopSellData = [shop: number];
export type ShopRefreshData = ShopData;
export interface ShopSelectData {
    id: number;
    slotId: number;
    currency: string;
    price: number;
}
export interface ShopRemoveData {
    id: number;
    index: number;
}

export interface MinigameData {
    opcode: Opcodes.TeamWar;
    countdown: number;
}

export type RegionRenderData = RegionTileData[];
export interface RegionModifyData {
    index: number;
    data?: number;
    newTile?: number | number[];
}
export interface RegionUpdateData {
    id: string;
    type: 'remove';
}
export type RegionTilesetData = TilesetData;

export type OverlayLampData = ProcessedArea;
export interface OverlaySetData {
    image: string;
    colour: string;
}
export interface OverlayDarknessData {
    colour: string;
}

export interface BubbleData {
    id: string;
    text: string;
    duration: number;
    isObject: boolean;
    info: BubbleInfo;
}

export interface ProfessionBatchData {
    data: ProfessionsInfo[];
}
export interface ProfessionUpdateData {
    id: number;
    level: number;
    percentage: string;
}
