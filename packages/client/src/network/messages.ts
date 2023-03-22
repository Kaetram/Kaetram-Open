import { Packets } from '@kaetram/common/network';

import type {
    AbilityCallback,
    AchievementCallback,
    AnimationCallback,
    BlinkCallback,
    BubbleCallback,
    CameraCallback,
    ChatCallback,
    CombatCallback,
    CommandCallback,
    ContainerCallback,
    DeathCallback,
    DespawnCallback,
    EffectCallback,
    EnchantCallback,
    EntityListCallback,
    EquipmentCallback,
    ExperienceCallback,
    FriendsCallback,
    GuildCallback,
    HandshakeCallback,
    HealCallback,
    MapCallback,
    MinigameCallback,
    MovementCallback,
    MusicCallback,
    NetworkCallback,
    NotificationCallback,
    NPCCallback,
    OverlayCallback,
    PointerCallback,
    PointsCallback,
    PoisonCallback,
    PVPCallback,
    QuestCallback,
    RankCallback,
    RespawnCallback,
    SkillCallback,
    SpawnCallback,
    StoreCallback,
    SyncCallback,
    TeleportCallback,
    TradeCallback,
    UpdateCallback,
    WelcomeCallback
} from '@kaetram/common/types/messages/outgoing';
import type App from '../app';

export default class Messages {
    private messages: (() => ((...data: never[]) => void) | undefined)[] = [];

    private handshakeCallback?: HandshakeCallback;
    private welcomeCallback?: WelcomeCallback;
    private mapCallback?: MapCallback;
    private spawnCallback?: SpawnCallback;
    private equipmentCallback?: EquipmentCallback;
    private entityListCallback?: EntityListCallback;
    private syncCallback?: SyncCallback;
    private movementCallback?: MovementCallback;
    private teleportCallback?: TeleportCallback;
    private despawnCallback?: DespawnCallback;
    private combatCallback?: CombatCallback;
    private animationCallback?: AnimationCallback;
    private pointsCallback?: PointsCallback;
    private networkCallback?: NetworkCallback;
    private chatCallback?: ChatCallback;
    private commandCallback?: CommandCallback;
    private containerCallback?: ContainerCallback;
    private abilityCallback?: AbilityCallback;
    private questCallback?: QuestCallback;
    private achievementCallback?: AchievementCallback;
    private notificationCallback?: NotificationCallback;
    private blinkCallback?: BlinkCallback;
    private healCallback?: HealCallback;
    private experienceCallback?: ExperienceCallback;
    private deathCallback?: DeathCallback;
    private musicCallback?: MusicCallback;
    private npcCallback?: NPCCallback;
    private respawnCallback?: RespawnCallback;
    private tradeCallback?: TradeCallback;
    private enchantCallback?: EnchantCallback;
    private guildCallback?: GuildCallback;
    private pointerCallback?: PointerCallback;
    private pvpCallback?: PVPCallback;
    private poisonCallback?: PoisonCallback;
    private storeCallback?: StoreCallback;
    private overlayCallback?: OverlayCallback;
    private cameraCallback?: CameraCallback;
    private bubbleCallback?: BubbleCallback;
    private skillCallback?: SkillCallback;
    private updateCallback?: UpdateCallback;
    private minigameCallback?: MinigameCallback;
    private effectCallback?: EffectCallback;
    private friendsCallback?: FriendsCallback;
    private rankCallback?: RankCallback;

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
        this.messages[Packets.Handshake] = () => this.handshakeCallback;
        this.messages[Packets.Welcome] = () => this.welcomeCallback;
        this.messages[Packets.Spawn] = () => this.spawnCallback;
        this.messages[Packets.Equipment] = () => this.equipmentCallback;
        this.messages[Packets.List] = () => this.entityListCallback;
        this.messages[Packets.Sync] = () => this.syncCallback;
        this.messages[Packets.Movement] = () => this.movementCallback;
        this.messages[Packets.Teleport] = () => this.teleportCallback;
        this.messages[Packets.Despawn] = () => this.despawnCallback;
        this.messages[Packets.Combat] = () => this.combatCallback;
        this.messages[Packets.Animation] = () => this.animationCallback;
        this.messages[Packets.Points] = () => this.pointsCallback;
        this.messages[Packets.Network] = () => this.networkCallback;
        this.messages[Packets.Chat] = () => this.chatCallback;
        this.messages[Packets.Command] = () => this.commandCallback;
        this.messages[Packets.Container] = () => this.containerCallback;
        this.messages[Packets.Ability] = () => this.abilityCallback;
        this.messages[Packets.Quest] = () => this.questCallback;
        this.messages[Packets.Achievement] = () => this.achievementCallback;
        this.messages[Packets.Notification] = () => this.notificationCallback;
        this.messages[Packets.Blink] = () => this.blinkCallback;
        this.messages[Packets.Heal] = () => this.healCallback;
        this.messages[Packets.Experience] = () => this.experienceCallback;
        this.messages[Packets.Death] = () => this.deathCallback;
        this.messages[Packets.Music] = () => this.musicCallback;
        this.messages[Packets.NPC] = () => this.npcCallback;
        this.messages[Packets.Respawn] = () => this.respawnCallback;
        this.messages[Packets.Trade] = () => this.tradeCallback;
        this.messages[Packets.Enchant] = () => this.enchantCallback;
        this.messages[Packets.Guild] = () => this.guildCallback;
        this.messages[Packets.Pointer] = () => this.pointerCallback;
        this.messages[Packets.PVP] = () => this.pvpCallback;
        this.messages[Packets.Poison] = () => this.poisonCallback;
        this.messages[Packets.Store] = () => this.storeCallback;
        this.messages[Packets.Map] = () => this.mapCallback;
        this.messages[Packets.Overlay] = () => this.overlayCallback;
        this.messages[Packets.Camera] = () => this.cameraCallback;
        this.messages[Packets.Bubble] = () => this.bubbleCallback;
        this.messages[Packets.Skill] = () => this.skillCallback;
        this.messages[Packets.Update] = () => this.updateCallback;
        this.messages[Packets.Minigame] = () => this.minigameCallback;
        this.messages[Packets.Effect] = () => this.effectCallback;
        this.messages[Packets.Friends] = () => this.friendsCallback;
        this.messages[Packets.Rank] = () => this.rankCallback;
    }

    /**
     * Parses through the data and calls the appropriate callback.
     * @param data Packet data containing packet opcode and data.
     */

    public handleData(data: [Packets, ...never[]]): void {
        let packet = data.shift()!,
            message = this.messages[packet]();

        if (message && typeof message === 'function')
            message.call(this, ...(data as unknown[] as never[]));
    }

    /**
     * Packet data received in an array format calls `handleData`
     * for each iteration of packet data.
     * @param data Packet data array.
     */

    public handleBulkData(data: [Packets, ...never[]][]): void {
        for (let info of data) this.handleData(info);
    }

    /**
     * UTF8 messages handler. These are simple messages that are pure
     * strings. These errors are displayed on the login page.
     * @param message UTF8 message received from the server.
     */

    public handleUTF8(message: string): void {
        this.app.toggleLogin(false);

        switch (message) {
            case 'full': {
                this.app.sendError('The servers are currently full!');
                break;
            }

            case 'error': {
                this.app.sendError('The server has responded with an error!');
                break;
            }

            case 'development': {
                this.app.sendError('The game is currently in development mode.');
                break;
            }

            case 'disallowed': {
                this.app.sendError('The server is currently not accepting connections!');
                break;
            }

            case 'maintenance': {
                this.app.sendError('Kaetram is currently under maintenance.');
                break;
            }

            case 'userexists': {
                this.app.sendError('The username you have entered already exists.');
                break;
            }

            case 'emailexists': {
                this.app.sendError('The email you have entered is not available.');
                break;
            }

            case 'invalidinput': {
                this.app.sendError(
                    'The input you have entered is invalid. Please do not use special characters.'
                );
                break;
            }

            case 'loggedin': {
                this.app.sendError('The player is already logged in!');
                break;
            }

            case 'invalidlogin': {
                this.app.sendError('You have entered the wrong username or password.');
                break;
            }

            case 'toofast': {
                this.app.sendError('You are trying to log in too fast from the same connection.');
                break;
            }

            case 'timeout': {
                this.app.sendError('You have been disconnected for being inactive for too long.');
                break;
            }

            case 'updated': {
                this.app.sendError('The game has been updated. Please clear your browser cache.');
                break;
            }

            case 'cheating': {
                this.app.sendError(`An error in client-server syncing has occurred.`);
                break;
            }

            case 'lost': {
                this.app.sendError('The connection to the server has been lost.');
                break;
            }

            case 'toomany': {
                this.app.sendError('Too many devices from your IP address are connected.');
                break;
            }

            default: {
                this.app.sendError('An unknown error has occurred, please submit a bug report.');
                break;
            }
        }
    }

    /**
     * Packet callbacks.
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

    public onContainer(callback: ContainerCallback): void {
        this.containerCallback = callback;
    }

    public onAbility(callback: AbilityCallback): void {
        this.abilityCallback = callback;
    }

    public onQuest(callback: QuestCallback): void {
        this.questCallback = callback;
    }

    public onAchievement(callback: AchievementCallback): void {
        this.achievementCallback = callback;
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

    public onMusic(callback: MusicCallback): void {
        this.musicCallback = callback;
    }

    public onNPC(callback: NPCCallback): void {
        this.npcCallback = callback;
    }

    public onRespawn(callback: RespawnCallback): void {
        this.respawnCallback = callback;
    }

    public onTrade(callback: TradeCallback): void {
        this.tradeCallback = callback;
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

    public onPoison(callback: PoisonCallback): void {
        this.poisonCallback = callback;
    }

    public onStore(callback: StoreCallback): void {
        this.storeCallback = callback;
    }

    public onMap(callback: MapCallback): void {
        this.mapCallback = callback;
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

    public onSkill(callback: SkillCallback): void {
        this.skillCallback = callback;
    }

    public onUpdate(callback: UpdateCallback): void {
        this.updateCallback = callback;
    }

    public onMinigame(callback: MinigameCallback): void {
        this.minigameCallback = callback;
    }

    public onEffect(callback: EffectCallback): void {
        this.effectCallback = callback;
    }

    public onFriends(callback: FriendsCallback): void {
        this.friendsCallback = callback;
    }

    public onRank(callback: RankCallback): void {
        this.rankCallback = callback;
    }
}
