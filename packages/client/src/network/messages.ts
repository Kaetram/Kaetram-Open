import { MinigameCallback } from './../../../common/types/messages/outgoing.d';
import _ from 'lodash-es';

import { Packets } from '@kaetram/common/network';

import type App from '../app';
import type Game from '../game';
import type {
    HandshakeCallback,
    WelcomeCallback,
    MapCallback,
    EquipmentCallback,
    EntityListCallback,
    SyncCallback,
    SpawnCallback,
    MovementCallback,
    TeleportCallback,
    DespawnCallback,
    CombatCallback,
    AnimationCallback,
    PointsCallback,
    NetworkCallback,
    ChatCallback,
    CommandCallback,
    ContainerCallback,
    AbilityCallback,
    QuestCallback,
    AchievementCallback,
    NotificationCallback,
    BlinkCallback,
    HealCallback,
    ExperienceCallback,
    DeathCallback,
    AudioCallback,
    NPCCallback,
    RespawnCallback,
    EnchantCallback,
    GuildCallback,
    PointerCallback,
    PVPCallback,
    PoisonCallback,
    StoreCallback,
    OverlayCallback,
    CameraCallback,
    BubbleCallback,
    SkillCallback,
    UpdateCallback
} from '@kaetram/common/types/messages/outgoing';

export default class Messages {
    private messages;
    private app: App;

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
    private audioCallback?: AudioCallback;
    private npcCallback?: NPCCallback;
    private respawnCallback?: RespawnCallback;
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
    public constructor(private game: Game) {
        this.app = game.app;

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
        messages[Packets.Points] = () => this.pointsCallback;
        messages[Packets.Network] = () => this.networkCallback;
        messages[Packets.Chat] = () => this.chatCallback;
        messages[Packets.Command] = () => this.commandCallback;
        messages[Packets.Container] = () => this.containerCallback;
        messages[Packets.Ability] = () => this.abilityCallback;
        messages[Packets.Quest] = () => this.questCallback;
        messages[Packets.Achievement] = () => this.achievementCallback;
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
        messages[Packets.Poison] = () => this.poisonCallback;
        messages[Packets.Store] = () => this.storeCallback;
        messages[Packets.Map] = () => this.mapCallback;
        messages[Packets.Overlay] = () => this.overlayCallback;
        messages[Packets.Camera] = () => this.cameraCallback;
        messages[Packets.Bubble] = () => this.bubbleCallback;
        messages[Packets.Skill] = () => this.skillCallback;
        messages[Packets.Update] = () => this.updateCallback;
        messages[Packets.Minigame] = () => this.minigameCallback;

        this.messages = messages;
    }

    /**
     * Parses through the data and calls the appropriate callback.
     * @param data Packet data containing packet opcode and data.
     */

    public handleData(data: [Packets, ...never[]]): void {
        let packet = data.shift()!,
            message = this.messages[packet]();

        if (message && _.isFunction(message)) message.call(this, ...data);
    }

    /**
     * Packet data received in an array format calls `handleData`
     * for each iteration of packet data.
     * @param data Packet data array.
     */

    public handleBulkData(data: never[]): void {
        _.each(data, this.handleData.bind(this));
    }

    /**
     * UTF8 messages handler. These are simple messages that are pure
     * strings. These errors are displayed on the login page.
     * @param message UTF8 message received from the server.
     */

    public handleUTF8(message: string): void {
        this.app.toggleLogin(false);

        switch (message) {
            case 'full':
                this.app.sendError('The servers are currently full!');
                break;

            case 'error':
                this.app.sendError('The server has responded with an error!');
                break;

            case 'development':
                this.app.sendError('The game is currently in development mode.');
                break;

            case 'disallowed':
                this.app.sendError('The server is currently not accepting connections!');
                break;

            case 'maintenance':
                this.app.sendError('Kaetram is currently under maintenance.');
                break;

            case 'userexists':
                this.app.sendError('The username you have chosen already exists.');
                break;

            case 'emailexists':
                this.app.sendError('The email you have chosen is not available.');
                break;

            case 'invalidinput':
                this.app.sendError('The input you have provided is invalid.');
                break;

            case 'loggedin':
                this.app.sendError('The player is already logged in!');
                break;

            case 'invalidlogin':
                this.app.sendError('You have entered the wrong username or password.');
                break;

            case 'toofast':
                this.app.sendError('You are trying to log in too fast from the same connection.');
                break;

            case 'timeout':
                this.app.sendError('You have been disconnected for being inactive for too long.');
                break;

            default:
                this.app.sendError('An unknown error has occurred, please submit a bug report.');
                break;
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
}
