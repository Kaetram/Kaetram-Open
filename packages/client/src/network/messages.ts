import _ from 'lodash';

import App from '../app';
import Packets from '@kaetram/common/src/packets';

/** @todo Change once handlers are typed */
type Callback = (...data: never[]) => void;

export default class Messages {
    app: App;
    messages: Callback[];
    handshakeCallback!: Callback;
    welcomeCallback!: Callback;
    spawnCallback!: Callback;
    equipmentCallback!: Callback;
    entityListCallback!: Callback;
    syncCallback!: Callback;
    movementCallback!: Callback;
    teleportCallback!: Callback;
    despawnCallback!: Callback;
    combatCallback!: Callback;
    animationCallback!: Callback;
    projectileCallback!: Callback;
    populationCallback!: Callback;
    pointsCallback!: Callback;
    networkCallback!: Callback;
    chatCallback!: Callback;
    commandCallback!: Callback;
    inventoryCallback!: Callback;
    bankCallback!: Callback;
    abilityCallback!: Callback;
    questCallback!: Callback;
    notificationCallback!: Callback;
    blinkCallback!: Callback;
    healCallback!: Callback;
    experienceCallback!: Callback;
    deathCallback!: Callback;
    audioCallback!: Callback;
    npcCallback!: Callback;
    respawnCallback!: Callback;
    enchantCallback!: Callback;
    guildCallback!: Callback;
    pointerCallback!: Callback;
    pvpCallback!: Callback;
    shopCallback!: Callback;
    minigameCallback!: Callback;
    regionCallback!: Callback;
    overlayCallback!: Callback;
    cameraCallback!: Callback;
    bubbleCallback!: Callback;
    professionCallback!: Callback;

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
    constructor(app: App) {
        this.app = app;

        this.messages = [];

        this.messages[Packets.Handshake] = this.receiveHandshake;
        this.messages[Packets.Welcome] = this.receiveWelcome;
        this.messages[Packets.Spawn] = this.receiveSpawn;
        this.messages[Packets.Equipment] = this.receiveEquipment;
        this.messages[Packets.List] = this.receiveEntityList;
        this.messages[Packets.Sync] = this.receiveSync;
        this.messages[Packets.Movement] = this.receiveMovement;
        this.messages[Packets.Teleport] = this.receiveTeleport;
        this.messages[Packets.Despawn] = this.receiveDespawn;
        this.messages[Packets.Combat] = this.receiveCombat;
        this.messages[Packets.Animation] = this.receiveAnimation;
        this.messages[Packets.Projectile] = this.receiveProjectile;
        this.messages[Packets.Population] = this.receivePopulation;
        this.messages[Packets.Points] = this.receivePoints;
        this.messages[Packets.Network] = this.receiveNetwork;
        this.messages[Packets.Chat] = this.receiveChat;
        this.messages[Packets.Command] = this.receiveCommand;
        this.messages[Packets.Inventory] = this.receiveInventory;
        this.messages[Packets.Bank] = this.receiveBank;
        this.messages[Packets.Ability] = this.receiveAbility;
        this.messages[Packets.Quest] = this.receiveQuest;
        this.messages[Packets.Notification] = this.receiveNotification;
        this.messages[Packets.Blink] = this.receiveBlink;
        this.messages[Packets.Heal] = this.receiveHeal;
        this.messages[Packets.Experience] = this.receiveExperience;
        this.messages[Packets.Death] = this.receiveDeath;
        this.messages[Packets.Audio] = this.receiveAudio;
        this.messages[Packets.NPC] = this.receiveNPC;
        this.messages[Packets.Respawn] = this.receiveRespawn;
        this.messages[Packets.Enchant] = this.receiveEnchant;
        this.messages[Packets.Guild] = this.receiveGuild;
        this.messages[Packets.Pointer] = this.receivePointer;
        this.messages[Packets.PVP] = this.receivePVP;
        this.messages[Packets.Shop] = this.receiveShop;
        this.messages[Packets.Minigame] = this.receiveMinigame;
        this.messages[Packets.Region] = this.receiveRegion;
        this.messages[Packets.Overlay] = this.receiveOverlay;
        this.messages[Packets.Camera] = this.receiveCamera;
        this.messages[Packets.Bubble] = this.receiveBubble;
        this.messages[Packets.Profession] = this.receiveProfession;
    }

    handleData(data: number[]): void {
        const packet = data.shift()!;

        const message = this.messages[packet];

        if (message && _.isFunction(message)) message.call(this, data);
    }

    handleBulkData(data: never[]): void {
        _.each(data, (message) => this.handleData(message));
    }

    handleUTF8(message: string): void {
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
     * Data Receivers
     */

    receiveHandshake(data: never[]): void {
        const info = data.shift()!;

        this.handshakeCallback?.(info);
    }

    receiveWelcome(data: never[]): void {
        const playerData = data.shift()!;

        this.welcomeCallback?.(playerData);
    }

    receiveSpawn(data: never): void {
        this.spawnCallback?.(data);
    }

    receiveEquipment(data: never[]): void {
        const equipType = data.shift()!;
        const equipInfo = data.shift()!;

        this.equipmentCallback?.(equipType, equipInfo);
    }

    receiveEntityList(data: never[]): void {
        this.entityListCallback?.(data.shift()!);
    }

    receiveSync(data: never[]): void {
        this.syncCallback?.(data.shift()!);
    }

    receiveMovement(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.movementCallback?.(opcode, info);
    }

    receiveTeleport(data: never[]): void {
        const info = data.shift()!;

        this.teleportCallback?.(info);
    }

    receiveDespawn(data: never[]): void {
        const id = data.shift()!;

        this.despawnCallback?.(id);
    }

    receiveCombat(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.combatCallback?.(opcode, info);
    }

    receiveAnimation(data: never[]): void {
        const id = data.shift()!;
        const info = data.shift()!;

        this.animationCallback?.(id, info);
    }

    receiveProjectile(data: never[]): void {
        const type = data.shift()!;
        const info = data.shift()!;

        this.projectileCallback?.(type, info);
    }

    receivePopulation(data: never[]): void {
        this.populationCallback?.(data.shift()!);
    }

    receivePoints(data: never[]): void {
        const pointsData = data.shift()!;

        this.pointsCallback?.(pointsData);
    }

    receiveNetwork(data: never[]): void {
        const opcode = data.shift()!;

        this.networkCallback?.(opcode);
    }

    receiveChat(data: never[]): void {
        const info = data.shift()!;

        this.chatCallback?.(info);
    }

    receiveCommand(data: never[]): void {
        const info = data.shift()!;

        this.commandCallback?.(info);
    }

    receiveInventory(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.inventoryCallback?.(opcode, info);
    }

    receiveBank(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.bankCallback?.(opcode, info);
    }

    receiveAbility(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.abilityCallback?.(opcode, info);
    }

    receiveQuest(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.questCallback?.(opcode, info);
    }

    receiveNotification(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.notificationCallback?.(opcode, info);
    }

    receiveBlink(data: never[]): void {
        const instance = data.shift()!;

        this.blinkCallback?.(instance);
    }

    receiveHeal(data: never[]): void {
        this.healCallback?.(data.shift()!);
    }

    receiveExperience(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.experienceCallback?.(opcode, info);
    }

    receiveDeath(data: never[]): void {
        this.deathCallback?.(data.shift()!);
    }

    receiveAudio(data: never[]): void {
        this.audioCallback?.(data.shift()!);
    }

    receiveNPC(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.npcCallback?.(opcode, info);
    }

    receiveRespawn(data: never[]): void {
        const id = data.shift()!;
        const x = data.shift()!;
        const y = data.shift()!;

        this.respawnCallback?.(id, x, y);
    }

    receiveEnchant(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.enchantCallback?.(opcode, info);
    }

    receiveGuild(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.guildCallback?.(opcode, info);
    }

    receivePointer(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.pointerCallback?.(opcode, info);
    }

    receivePVP(data: never[]): void {
        const id = data.shift()!;
        const pvp = data.shift()!;

        this.pvpCallback?.(id, pvp);
    }

    receiveShop(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.shopCallback?.(opcode, info);
    }

    receiveMinigame(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.minigameCallback?.(opcode, info);
    }

    receiveRegion(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;
        const force = data.shift()!;

        this.regionCallback?.(opcode, info, force);
    }

    receiveOverlay(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.overlayCallback?.(opcode, info);
    }

    receiveCamera(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.cameraCallback?.(opcode, info);
    }

    receiveBubble(data: never[]): void {
        const info = data.shift()!;

        this.bubbleCallback?.(info);
    }

    receiveProfession(data: never[]): void {
        const opcode = data.shift()!;
        const info = data.shift()!;

        this.professionCallback?.(opcode, info);
    }

    /**
     * Universal Callbacks
     */

    onHandshake(callback: Callback): void {
        this.handshakeCallback = callback;
    }

    onWelcome(callback: Callback): void {
        this.welcomeCallback = callback;
    }

    onSpawn(callback: Callback): void {
        this.spawnCallback = callback;
    }

    onEquipment(callback: Callback): void {
        this.equipmentCallback = callback;
    }

    onEntityList(callback: Callback): void {
        this.entityListCallback = callback;
    }

    onSync(callback: Callback): void {
        this.syncCallback = callback;
    }

    onMovement(callback: Callback): void {
        this.movementCallback = callback;
    }

    onTeleport(callback: Callback): void {
        this.teleportCallback = callback;
    }

    onDespawn(callback: Callback): void {
        this.despawnCallback = callback;
    }

    onCombat(callback: Callback): void {
        this.combatCallback = callback;
    }

    onAnimation(callback: Callback): void {
        this.animationCallback = callback;
    }

    onProjectile(callback: Callback): void {
        this.projectileCallback = callback;
    }

    onPopulation(callback: Callback): void {
        this.populationCallback = callback;
    }

    onPoints(callback: Callback): void {
        this.pointsCallback = callback;
    }

    onNetwork(callback: Callback): void {
        this.networkCallback = callback;
    }

    onChat(callback: Callback): void {
        this.chatCallback = callback;
    }

    onCommand(callback: Callback): void {
        this.commandCallback = callback;
    }

    onInventory(callback: Callback): void {
        this.inventoryCallback = callback;
    }

    onBank(callback: Callback): void {
        this.bankCallback = callback;
    }

    onAbility(callback: Callback): void {
        this.abilityCallback = callback;
    }

    onQuest(callback: Callback): void {
        this.questCallback = callback;
    }

    onNotification(callback: Callback): void {
        this.notificationCallback = callback;
    }

    onBlink(callback: Callback): void {
        this.blinkCallback = callback;
    }

    onHeal(callback: Callback): void {
        this.healCallback = callback;
    }

    onExperience(callback: Callback): void {
        this.experienceCallback = callback;
    }

    onDeath(callback: Callback): void {
        this.deathCallback = callback;
    }

    onAudio(callback: Callback): void {
        this.audioCallback = callback;
    }

    onNPC(callback: Callback): void {
        this.npcCallback = callback;
    }

    onRespawn(callback: Callback): void {
        this.respawnCallback = callback;
    }

    onEnchant(callback: Callback): void {
        this.enchantCallback = callback;
    }

    onGuild(callback: Callback): void {
        this.guildCallback = callback;
    }

    onPointer(callback: Callback): void {
        this.pointerCallback = callback;
    }

    onPVP(callback: Callback): void {
        this.pvpCallback = callback;
    }

    onShop(callback: Callback): void {
        this.shopCallback = callback;
    }

    onMinigame(callback: Callback): void {
        this.minigameCallback = callback;
    }

    onRegion(callback: Callback): void {
        this.regionCallback = callback;
    }

    onOverlay(callback: Callback): void {
        this.overlayCallback = callback;
    }

    onCamera(callback: Callback): void {
        this.cameraCallback = callback;
    }

    onBubble(callback: Callback): void {
        this.bubbleCallback = callback;
    }

    onProfession(callback: Callback): void {
        this.professionCallback = callback;
    }
}
