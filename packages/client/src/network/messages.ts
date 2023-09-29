import { Packets } from '@kaetram/common/network';

import type App from '../app';
import type {
    AbilityPacketCallback,
    AchievementPacketCallback,
    AnimationPacketCallback,
    BlinkPacketCallback,
    BubblePacketCallback,
    CameraPacketCallback,
    ChatPacketCallback,
    CombatPacketCallback,
    CommandPacketCallback,
    ContainerPacketCallback,
    CountdownPacketCallback,
    CraftingPacketCallback,
    DeathPacketCallback,
    DespawnPacketCallback,
    EffectPacketCallback,
    EnchantPacketCallback,
    EntityListPacketCallback,
    EquipmentPacketCallback,
    ExperiencePacketCallback,
    FriendsPacketCallback,
    GuildPacketCallback,
    HandshakePacketCallback,
    HealPacketCallback,
    InterfacePacketCallback,
    LootBagPacketCallback,
    MapPacketCallback,
    MinigamePacketCallback,
    MovementPacketCallback,
    MusicPacketCallback,
    NetworkPacketCallback,
    NotificationPacketCallback,
    NPCPacketCallback,
    OverlayPacketCallback,
    PointerPacketCallback,
    PointsPacketCallback,
    PoisonPacketCallback,
    PVPPacketCallback,
    QuestPacketCallback,
    RankPacketCallback,
    ResourcePacketCallback,
    RespawnPacketCallback,
    SkillPacketCallback,
    SpawnPacketCallback,
    StorePacketCallback,
    SyncPacketCallback,
    TeleportPacketCallback,
    TradePacketCallback,
    UpdatePacketCallback,
    WelcomePacketCallback
} from '@kaetram/common/types/messages/outgoing';

export default class Messages {
    private messages: (() => ((...data: never[]) => void) | undefined)[] = [];

    private handshakeCallback?: HandshakePacketCallback;
    private welcomeCallback?: WelcomePacketCallback;
    private mapCallback?: MapPacketCallback;
    private spawnCallback?: SpawnPacketCallback;
    private equipmentCallback?: EquipmentPacketCallback;
    private entityListCallback?: EntityListPacketCallback;
    private syncCallback?: SyncPacketCallback;
    private movementCallback?: MovementPacketCallback;
    private teleportCallback?: TeleportPacketCallback;
    private despawnCallback?: DespawnPacketCallback;
    private combatCallback?: CombatPacketCallback;
    private animationCallback?: AnimationPacketCallback;
    private pointsCallback?: PointsPacketCallback;
    private networkCallback?: NetworkPacketCallback;
    private chatCallback?: ChatPacketCallback;
    private commandCallback?: CommandPacketCallback;
    private containerCallback?: ContainerPacketCallback;
    private abilityCallback?: AbilityPacketCallback;
    private questCallback?: QuestPacketCallback;
    private achievementCallback?: AchievementPacketCallback;
    private notificationCallback?: NotificationPacketCallback;
    private blinkCallback?: BlinkPacketCallback;
    private healCallback?: HealPacketCallback;
    private experienceCallback?: ExperiencePacketCallback;
    private deathCallback?: DeathPacketCallback;
    private musicCallback?: MusicPacketCallback;
    private npcCallback?: NPCPacketCallback;
    private respawnCallback?: RespawnPacketCallback;
    private tradeCallback?: TradePacketCallback;
    private enchantCallback?: EnchantPacketCallback;
    private guildCallback?: GuildPacketCallback;
    private pointerCallback?: PointerPacketCallback;
    private pvpCallback?: PVPPacketCallback;
    private poisonCallback?: PoisonPacketCallback;
    private storeCallback?: StorePacketCallback;
    private overlayCallback?: OverlayPacketCallback;
    private cameraCallback?: CameraPacketCallback;
    private bubbleCallback?: BubblePacketCallback;
    private skillCallback?: SkillPacketCallback;
    private updateCallback?: UpdatePacketCallback;
    private minigameCallback?: MinigamePacketCallback;
    private effectCallback?: EffectPacketCallback;
    private friendsCallback?: FriendsPacketCallback;
    private rankCallback?: RankPacketCallback;
    private craftingCallback?: CraftingPacketCallback;
    private interfaceCallback?: InterfacePacketCallback;
    private lootBagCallback?: LootBagPacketCallback;
    private countdownCallback?: CountdownPacketCallback;
    private resourceCallback?: ResourcePacketCallback;

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
        this.messages[Packets.Crafting] = () => this.craftingCallback;
        this.messages[Packets.Interface] = () => this.interfaceCallback;
        this.messages[Packets.LootBag] = () => this.lootBagCallback;
        this.messages[Packets.Countdown] = () => this.countdownCallback;
        this.messages[Packets.Resource] = () => this.resourceCallback;
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
            case 'worldfull': {
                this.app.sendError('The servers are currently full!');
                break;
            }

            case 'error': {
                this.app.sendError('The server has responded with an error!');
                break;
            }

            case 'banned': {
                this.app.sendError('Your account has been disabled!');
                break;
            }

            case 'disabledregister': {
                this.app.sendError('Registration is currently disabled.');
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

            case 'ratelimit': {
                this.app.sendError('You are sending packets too fast.');
                break;
            }

            case 'invalidpassword': {
                this.app.sendError('The password you have entered is invalid.');
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

    public onHandshake(callback: HandshakePacketCallback): void {
        this.handshakeCallback = callback;
    }

    public onWelcome(callback: WelcomePacketCallback): void {
        this.welcomeCallback = callback;
    }

    public onSpawn(callback: SpawnPacketCallback): void {
        this.spawnCallback = callback;
    }

    public onEquipment(callback: EquipmentPacketCallback): void {
        this.equipmentCallback = callback;
    }

    public onEntityList(callback: EntityListPacketCallback): void {
        this.entityListCallback = callback;
    }

    public onSync(callback: SyncPacketCallback): void {
        this.syncCallback = callback;
    }

    public onMovement(callback: MovementPacketCallback): void {
        this.movementCallback = callback;
    }

    public onTeleport(callback: TeleportPacketCallback): void {
        this.teleportCallback = callback;
    }

    public onDespawn(callback: DespawnPacketCallback): void {
        this.despawnCallback = callback;
    }

    public onCombat(callback: CombatPacketCallback): void {
        this.combatCallback = callback;
    }

    public onAnimation(callback: AnimationPacketCallback): void {
        this.animationCallback = callback;
    }

    public onPoints(callback: PointsPacketCallback): void {
        this.pointsCallback = callback;
    }

    public onNetwork(callback: NetworkPacketCallback): void {
        this.networkCallback = callback;
    }

    public onChat(callback: ChatPacketCallback): void {
        this.chatCallback = callback;
    }

    public onCommand(callback: CommandPacketCallback): void {
        this.commandCallback = callback;
    }

    public onContainer(callback: ContainerPacketCallback): void {
        this.containerCallback = callback;
    }

    public onAbility(callback: AbilityPacketCallback): void {
        this.abilityCallback = callback;
    }

    public onQuest(callback: QuestPacketCallback): void {
        this.questCallback = callback;
    }

    public onAchievement(callback: AchievementPacketCallback): void {
        this.achievementCallback = callback;
    }

    public onNotification(callback: NotificationPacketCallback): void {
        this.notificationCallback = callback;
    }

    public onBlink(callback: BlinkPacketCallback): void {
        this.blinkCallback = callback;
    }

    public onHeal(callback: HealPacketCallback): void {
        this.healCallback = callback;
    }

    public onExperience(callback: ExperiencePacketCallback): void {
        this.experienceCallback = callback;
    }

    public onDeath(callback: DeathPacketCallback): void {
        this.deathCallback = callback;
    }

    public onMusic(callback: MusicPacketCallback): void {
        this.musicCallback = callback;
    }

    public onNPC(callback: NPCPacketCallback): void {
        this.npcCallback = callback;
    }

    public onRespawn(callback: RespawnPacketCallback): void {
        this.respawnCallback = callback;
    }

    public onTrade(callback: TradePacketCallback): void {
        this.tradeCallback = callback;
    }

    public onEnchant(callback: EnchantPacketCallback): void {
        this.enchantCallback = callback;
    }

    public onGuild(callback: GuildPacketCallback): void {
        this.guildCallback = callback;
    }

    public onPointer(callback: PointerPacketCallback): void {
        this.pointerCallback = callback;
    }

    public onPVP(callback: PVPPacketCallback): void {
        this.pvpCallback = callback;
    }

    public onPoison(callback: PoisonPacketCallback): void {
        this.poisonCallback = callback;
    }

    public onStore(callback: StorePacketCallback): void {
        this.storeCallback = callback;
    }

    public onMap(callback: MapPacketCallback): void {
        this.mapCallback = callback;
    }

    public onOverlay(callback: OverlayPacketCallback): void {
        this.overlayCallback = callback;
    }

    public onCamera(callback: CameraPacketCallback): void {
        this.cameraCallback = callback;
    }

    public onBubble(callback: BubblePacketCallback): void {
        this.bubbleCallback = callback;
    }

    public onSkill(callback: SkillPacketCallback): void {
        this.skillCallback = callback;
    }

    public onUpdate(callback: UpdatePacketCallback): void {
        this.updateCallback = callback;
    }

    public onMinigame(callback: MinigamePacketCallback): void {
        this.minigameCallback = callback;
    }

    public onEffect(callback: EffectPacketCallback): void {
        this.effectCallback = callback;
    }

    public onFriends(callback: FriendsPacketCallback): void {
        this.friendsCallback = callback;
    }

    public onRank(callback: RankPacketCallback): void {
        this.rankCallback = callback;
    }

    public onCrafting(callback: CraftingPacketCallback): void {
        this.craftingCallback = callback;
    }

    public onInterface(callback: InterfacePacketCallback): void {
        this.interfaceCallback = callback;
    }

    public onLootBag(callback: LootBagPacketCallback): void {
        this.lootBagCallback = callback;
    }

    public onCountdown(callback: CountdownPacketCallback): void {
        this.countdownCallback = callback;
    }

    public onResource(callback: ResourcePacketCallback): void {
        this.resourceCallback = callback;
    }
}
