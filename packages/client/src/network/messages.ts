import _ from 'lodash';

import { Packets } from '@kaetram/common/network';

import type { Opcodes } from '@kaetram/common/network';
import type {
    AnimationData,
    BubbleData,
    ChatData,
    CombatData,
    CombatHitData,
    CombatSyncData,
    CommandData,
    ContainerAddData,
    ContainerBatchData,
    ContainerRemoveData,
    EnchantData,
    EquipmentBatchData,
    EquipmentEquipData,
    EquipmentUnequipData,
    ExperienceCombatData,
    ExperienceProfessionData,
    HandshakeData,
    HealData,
    MinigameData,
    MovementFollowData,
    MovementMoveData,
    MovementOrientateData,
    MovementStateData,
    MovementStopData,
    NotificationData,
    NPCBankData,
    NPCCountdownData,
    NPCEnchantData,
    NPCStoreData,
    NPCTalkData,
    OverlayDarknessData,
    OverlayLampData,
    OverlaySetData,
    PointerButtonData,
    PointerData,
    PointerLocationData,
    PointerRelativeData,
    PointerRemoveData,
    PointsData,
    ProfessionBatchData,
    ProfessionUpdateData,
    ProjectileData,
    QuestAchievementBatchData,
    QuestBatchData,
    QuestFinishData,
    QuestProgressData,
    ShopBuyData,
    ShopOpenData,
    ShopRefreshData,
    ShopRemoveData,
    ShopSelectData,
    ShopSellData,
    SpawnData,
    SyncData,
    TeleportData,
    WelcomeData
} from '@kaetram/common/types/messages';
import type App from '../app';
import type { AudioName } from '../controllers/audio';

type HandshakeCallback = (data: HandshakeData) => void;
type WelcomeCallback = (playerData: WelcomeData) => void;
type SpawnCallback = (entities: SpawnData) => void;
interface EquipmentCallback {
    (opcode: Opcodes.Equipment.Batch, info: EquipmentBatchData): void;
    (opcode: Opcodes.Equipment.Equip, info: EquipmentEquipData): void;
    (opcode: Opcodes.Equipment.Unequip, info: EquipmentUnequipData): void;
}
type EntityListCallback = (ids: string[]) => void;
type SyncCallback = (data: SyncData) => void;
interface MovementCallback {
    (opcode: Opcodes.Movement.Move, info: MovementMoveData): void;
    (opcode: Opcodes.Movement.Follow, info: MovementFollowData): void;
    (opcode: Opcodes.Movement.Stop, info: MovementStopData): void;
    (opcode: Opcodes.Movement.Freeze | Opcodes.Movement.Stunned, info: MovementStateData): void;
    (opcode: Opcodes.Movement.Orientate, info: MovementOrientateData): void;
}
type TeleportCallback = (data: TeleportData) => void;
type DespawnCallback = (id: string) => void;
interface CombatCallback {
    (opcode: Opcodes.Combat, data: CombatData): void;
    (opcode: Opcodes.Combat.Hit, data: CombatHitData): void;
    (opcode: Opcodes.Combat.Sync, data: CombatSyncData): void;
}
type AnimationCallback = (id: string, data: AnimationData) => void;
interface ProjectileCallback {
    (opcode: Opcodes.Projectile, data: ProjectileData): void;
}
type PopulationCallback = (population: number) => void;
type PointsCallback = (data: PointsData) => void;
type NetworkCallback = () => void;
type ChatCallback = (data: ChatData) => void;
type CommandCallback = (data: CommandData) => void;
interface InventoryCallback {
    (opcode: Opcodes.Inventory.Batch, info: ContainerBatchData): void;
    (opcode: Opcodes.Inventory.Add, info: ContainerAddData): void;
    (opcode: Opcodes.Inventory.Remove, info: ContainerRemoveData): void;
}
interface BankCallback {
    (opcode: Opcodes.Bank.Batch, info: ContainerBatchData): void;
    (opcode: Opcodes.Bank.Add, info: ContainerAddData): void;
    (opcode: Opcodes.Bank.Remove, info: ContainerRemoveData): void;
}
type AbilityCallback = (data: unknown) => void;
interface QuestCallback {
    (opcode: Opcodes.Quest.AchievementBatch, info: QuestAchievementBatchData): void;
    (opcode: Opcodes.Quest.QuestBatch, info: QuestBatchData): void;
    (opcode: Opcodes.Quest.Progress, info: QuestProgressData): void;
    (opcode: Opcodes.Quest.Finish, info: QuestFinishData): void;
}
type NotificationCallback = (opcode: Opcodes.Notification, info: NotificationData) => void;
type BlinkCallback = (instance: string) => void;
type HealCallback = (data: HealData) => void;
interface ExperienceCallback {
    (Opcodes: Opcodes.Experience.Combat, data: ExperienceCombatData): void;
    (Opcodes: Opcodes.Experience.Profession, data: ExperienceProfessionData): void;
}
type DeathCallback = (id: string) => void;
type AudioCallback = (song: AudioName) => void;
interface NPCCallback {
    (opcode: Opcodes.NPC.Talk, data: NPCTalkData): void;
    (opcode: Opcodes.NPC.Store, data: NPCStoreData): void;
    (opcode: Opcodes.NPC.Bank, data: NPCBankData): void;
    (opcode: Opcodes.NPC.Enchant, data: NPCEnchantData): void;
    (opcode: Opcodes.NPC.Countdown, data: NPCCountdownData): void;
}
type RespawnCallback = (id: string, x: number, y: number) => void;
type EnchantCallback = (opcode: Opcodes.Enchant, data: EnchantData) => void;
type GuildCallback = (opcode: Opcodes.Guild, data: unknown) => void;
interface PointerCallback {
    (opcode: Opcodes.Pointer, data: PointerData): void;
    (opcode: Opcodes.Pointer.Location, data: PointerLocationData): void;
    (opcode: Opcodes.Pointer.Relative, data: PointerRelativeData): void;
    (opcode: Opcodes.Pointer.Remove, data: PointerRemoveData): void;
    (opcode: Opcodes.Pointer.Button, data: PointerButtonData): void;
}
type PVPCallback = (id: string, pvp: boolean) => void;
interface ShopCallback {
    (opcode: Opcodes.Shop.Open, data: ShopOpenData): void;
    (opcode: Opcodes.Shop.Buy, data: ShopBuyData): void;
    (opcode: Opcodes.Shop.Sell, data: ShopSellData): void;
    (opcode: Opcodes.Shop.Refresh, data: ShopRefreshData): void;
    (opcode: Opcodes.Shop.Select, data: ShopSelectData): void;
    (opcode: Opcodes.Shop.Remove, data: ShopRemoveData): void;
}
type MinigameCallback = (opcode: Opcodes.Minigame, data: MinigameData) => void;
type RegionCallback = (opcode: Opcodes.Region, bufferSize: number, data: string) => void;
interface OverlayCallback {
    (opcode: Opcodes.Overlay, data: undefined): void;
    (opcode: Opcodes.Overlay.Set, data: OverlaySetData): void;
    (opcode: Opcodes.Overlay.Lamp, data: OverlayLampData): void;
    (opcode: Opcodes.Overlay.Darkness, data: OverlayDarknessData): void;
}
type CameraCallback = (opcode: Opcodes.Camera) => void;
type BubbleCallback = (data: BubbleData) => void;
interface ProfessionCallback {
    (opcode: Opcodes.Profession.Batch, data: ProfessionBatchData): void;
    (opcode: Opcodes.Profession.Update, data: ProfessionUpdateData): void;
}

export default class Messages {
    private messages;

    private handshakeCallback?: HandshakeCallback;
    private welcomeCallback?: WelcomeCallback;
    private spawnCallback?: SpawnCallback;
    private equipmentCallback?: EquipmentCallback;
    private entityListCallback?: EntityListCallback;
    private syncCallback?: SyncCallback;
    private movementCallback?: MovementCallback;
    private teleportCallback?: TeleportCallback;
    private despawnCallback?: DespawnCallback;
    private combatCallback?: CombatCallback;
    private animationCallback?: AnimationCallback;
    private projectileCallback?: ProjectileCallback;
    private populationCallback?: PopulationCallback;
    private pointsCallback?: PointsCallback;
    private networkCallback?: NetworkCallback;
    private chatCallback?: ChatCallback;
    private commandCallback?: CommandCallback;
    private inventoryCallback?: InventoryCallback;
    private bankCallback?: BankCallback;
    private abilityCallback?: AbilityCallback;
    private questCallback?: QuestCallback;
    private notificationCallback?: NotificationCallback;
    private blinkCallback?: BlinkCallback;
    private healCallback?: HealCallback;
    private experienceCallback?: ExperienceCallback;
    private deathCallback?: DeathCallback;
    private audioCallback?: AudioCallback;
    private npcCallback?: NPCCallback;
    private respawnCallback?: RespawnCallback;
    private enchantCallback?: EnchantCallback;
    private guildCallback?: GuildCallback;
    private pointerCallback?: PointerCallback;
    private pvpCallback?: PVPCallback;
    private shopCallback?: ShopCallback;
    private minigameCallback?: MinigameCallback;
    private regionCallback?: RegionCallback;
    private overlayCallback?: OverlayCallback;
    private cameraCallback?: CameraCallback;
    private bubbleCallback?: BubbleCallback;
    private professionCallback?: ProfessionCallback;

    /**
     * Do not clutter up the Socket class with callbacks,
     * have this class here until a better method arises in my head.
     *
     * This class should not have any complex functionality, its main
     * role is to provide organization for packets and increase readability
     *
     * Please respect the order of the Packets Enum and arrange functions
     * accordingly.
     */
    public constructor(private app: App) {
        let messages: (() => ((...data: never[]) => void) | undefined)[] = [];

        messages[Packets.Handshake] = () => this.handshakeCallback;
        messages[Packets.Welcome] = () => this.welcomeCallback;
        messages[Packets.Spawn] = () => this.spawnCallback;
        messages[Packets.Equipment] = () => this.equipmentCallback;
        messages[Packets.List] = () => this.entityListCallback;
        messages[Packets.Sync] = () => this.syncCallback;
        messages[Packets.Movement] = () => this.movementCallback;
        messages[Packets.Teleport] = () => this.teleportCallback;
        messages[Packets.Despawn] = () => this.despawnCallback;
        messages[Packets.Combat] = () => this.combatCallback;
        messages[Packets.Animation] = () => this.animationCallback;
        messages[Packets.Projectile] = () => this.projectileCallback;
        messages[Packets.Population] = () => this.populationCallback;
        messages[Packets.Points] = () => this.pointsCallback;
        messages[Packets.Network] = () => this.networkCallback;
        messages[Packets.Chat] = () => this.chatCallback;
        messages[Packets.Command] = () => this.commandCallback;
        messages[Packets.Inventory] = () => this.inventoryCallback;
        messages[Packets.Bank] = () => this.bankCallback;
        messages[Packets.Ability] = () => this.abilityCallback;
        messages[Packets.Quest] = () => this.questCallback;
        messages[Packets.Notification] = () => this.notificationCallback;
        messages[Packets.Blink] = () => this.blinkCallback;
        messages[Packets.Heal] = () => this.healCallback;
        messages[Packets.Experience] = () => this.experienceCallback;
        messages[Packets.Death] = () => this.deathCallback;
        messages[Packets.Audio] = () => this.audioCallback;
        messages[Packets.NPC] = () => this.npcCallback;
        messages[Packets.Respawn] = () => this.respawnCallback;
        messages[Packets.Enchant] = () => this.enchantCallback;
        messages[Packets.Guild] = () => this.guildCallback;
        messages[Packets.Pointer] = () => this.pointerCallback;
        messages[Packets.PVP] = () => this.pvpCallback;
        messages[Packets.Shop] = () => this.shopCallback;
        messages[Packets.Minigame] = () => this.minigameCallback;
        messages[Packets.Region] = () => this.regionCallback;
        messages[Packets.Overlay] = () => this.overlayCallback;
        messages[Packets.Camera] = () => this.cameraCallback;
        messages[Packets.Bubble] = () => this.bubbleCallback;
        messages[Packets.Profession] = () => this.professionCallback;

        this.messages = messages;
    }

    public handleData(data: [Packets, ...never[]]): void {
        let packet = data.shift()!,
            message = this.messages[packet]();

        if (message && _.isFunction(message)) message.call(this, ...data);
    }

    public handleBulkData(data: never[]): void {
        _.each(data, (message) => this.handleData(message));
    }

    public handleUTF8(message: string): void {
        this.app.toggleLogin(false);

        switch (message) {
            case 'full':
                this.app.sendError(null, 'The servers are currently full!');
                break;

            case 'error':
                this.app.sendError(null, 'The server has responded with an error!');
                break;

            case 'development':
                this.app.sendError(null, 'The game is currently in development mode.');
                break;

            case 'disallowed':
                this.app.sendError(null, 'The server is currently not accepting connections!');
                break;

            case 'maintenance':
                this.app.sendError(null, 'Kaetram is currently under maintenance.');
                break;

            case 'userexists':
                this.app.sendError(null, 'The username you have chosen already exists.');
                break;

            case 'emailexists':
                this.app.sendError(null, 'The email you have chosen is not available.');
                break;

            case 'loggedin':
                this.app.sendError(null, 'The player is already logged in!');
                break;

            case 'invalidlogin':
                this.app.sendError(null, 'You have entered the wrong username or password.');
                break;

            case 'toofast':
                this.app.sendError(
                    null,
                    'You are trying to log in too fast from the same connection.'
                );
                break;

            case 'malform':
                this.app.game.handleDisconnection(true);
                this.app.sendError(null, 'Client has experienced a malfunction.');

                break;

            case 'timeout':
                this.app.sendError(
                    null,
                    'You have been disconnected for being inactive for too long.'
                );

                break;

            default:
                this.app.sendError(
                    null,
                    'An unknown error has occurred, please submit a bug report.'
                );
                break;
        }
    }

    /**
     * Universal Callbacks
     */

    public onHandshake(callback: HandshakeCallback): void {
        this.handshakeCallback = callback;
    }

    public onWelcome(callback: WelcomeCallback): void {
        this.welcomeCallback = callback;
    }

    public onSpawn(callback: SpawnCallback): void {
        this.spawnCallback = callback;
    }

    public onEquipment(callback: EquipmentCallback): void {
        this.equipmentCallback = callback;
    }

    public onEntityList(callback: EntityListCallback): void {
        this.entityListCallback = callback;
    }

    public onSync(callback: SyncCallback): void {
        this.syncCallback = callback;
    }

    public onMovement(callback: MovementCallback): void {
        this.movementCallback = callback;
    }

    public onTeleport(callback: TeleportCallback): void {
        this.teleportCallback = callback;
    }

    public onDespawn(callback: DespawnCallback): void {
        this.despawnCallback = callback;
    }

    public onCombat(callback: CombatCallback): void {
        this.combatCallback = callback;
    }

    public onAnimation(callback: AnimationCallback): void {
        this.animationCallback = callback;
    }

    public onProjectile(callback: ProjectileCallback): void {
        this.projectileCallback = callback;
    }

    public onPopulation(callback: PopulationCallback): void {
        this.populationCallback = callback;
    }

    public onPoints(callback: PointsCallback): void {
        this.pointsCallback = callback;
    }

    public onNetwork(callback: NetworkCallback): void {
        this.networkCallback = callback;
    }

    public onChat(callback: ChatCallback): void {
        this.chatCallback = callback;
    }

    public onCommand(callback: CommandCallback): void {
        this.commandCallback = callback;
    }

    public onInventory(callback: InventoryCallback): void {
        this.inventoryCallback = callback;
    }

    public onBank(callback: BankCallback): void {
        this.bankCallback = callback;
    }

    public onAbility(callback: AbilityCallback): void {
        this.abilityCallback = callback;
    }

    public onQuest(callback: QuestCallback): void {
        this.questCallback = callback;
    }

    public onNotification(callback: NotificationCallback): void {
        this.notificationCallback = callback;
    }

    public onBlink(callback: BlinkCallback): void {
        this.blinkCallback = callback;
    }

    public onHeal(callback: HealCallback): void {
        this.healCallback = callback;
    }

    public onExperience(callback: ExperienceCallback): void {
        this.experienceCallback = callback;
    }

    public onDeath(callback: DeathCallback): void {
        this.deathCallback = callback;
    }

    public onAudio(callback: AudioCallback): void {
        this.audioCallback = callback;
    }

    public onNPC(callback: NPCCallback): void {
        this.npcCallback = callback;
    }

    public onRespawn(callback: RespawnCallback): void {
        this.respawnCallback = callback;
    }

    public onEnchant(callback: EnchantCallback): void {
        this.enchantCallback = callback;
    }

    public onGuild(callback: GuildCallback): void {
        this.guildCallback = callback;
    }

    public onPointer(callback: PointerCallback): void {
        this.pointerCallback = callback;
    }

    public onPVP(callback: PVPCallback): void {
        this.pvpCallback = callback;
    }

    public onShop(callback: ShopCallback): void {
        this.shopCallback = callback;
    }

    public onMinigame(callback: MinigameCallback): void {
        this.minigameCallback = callback;
    }

    public onRegion(callback: RegionCallback): void {
        this.regionCallback = callback;
    }

    public onOverlay(callback: OverlayCallback): void {
        this.overlayCallback = callback;
    }

    public onCamera(callback: CameraCallback): void {
        this.cameraCallback = callback;
    }

    public onBubble(callback: BubbleCallback): void {
        this.bubbleCallback = callback;
    }

    public onProfession(callback: ProfessionCallback): void {
        this.professionCallback = callback;
    }
}
