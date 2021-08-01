import _ from 'lodash';
import { inflate } from 'pako';

import { Packets } from '@kaetram/common/network';

import type App from '../app';

/** @todo Change once handlers are typed */
type Callback = (...data: never[]) => void;

export default class Messages {
    private messages: Callback[] = [];

    private handshakeCallback!: Callback;
    private welcomeCallback!: Callback;
    private spawnCallback!: Callback;
    private equipmentCallback!: Callback;
    private entityListCallback!: Callback;
    private syncCallback!: Callback;
    private movementCallback!: Callback;
    private teleportCallback!: Callback;
    private despawnCallback!: Callback;
    private combatCallback!: Callback;
    private animationCallback!: Callback;
    private projectileCallback!: Callback;
    private populationCallback!: Callback;
    private pointsCallback!: Callback;
    private networkCallback!: Callback;
    private chatCallback!: Callback;
    private commandCallback!: Callback;
    private inventoryCallback!: Callback;
    private bankCallback!: Callback;
    private abilityCallback!: Callback;
    private questCallback!: Callback;
    private notificationCallback!: Callback;
    private blinkCallback!: Callback;
    private healCallback!: Callback;
    private experienceCallback!: Callback;
    private deathCallback!: Callback;
    private audioCallback!: Callback;
    private npcCallback!: Callback;
    private respawnCallback!: Callback;
    private enchantCallback!: Callback;
    private guildCallback!: Callback;
    private pointerCallback!: Callback;
    private pvpCallback!: Callback;
    private shopCallback!: Callback;
    private minigameCallback!: Callback;
    private regionCallback!: Callback;
    private overlayCallback!: Callback;
    private cameraCallback!: Callback;
    private bubbleCallback!: Callback;
    private professionCallback!: Callback;

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

    public handleData(data: number[]): void {
        let packet = data.shift()!,
            message = this.messages[packet];

        if (message && _.isFunction(message)) message.call(this, data);
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
                this.app.sendError(null, `${this.app.config.name} is currently under maintenance.`);
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

    private receiveHandshake(data: never[]): void {
        let info = data.shift()!;

        this.handshakeCallback?.(info);
    }

    private receiveWelcome(data: never[]): void {
        let playerData = data.shift()!;

        this.welcomeCallback?.(playerData);
    }

    private receiveSpawn(data: never): void {
        this.spawnCallback?.(data);
    }

    private receiveEquipment(data: never[]): void {
        let equipType = data.shift()!,
            equipInfo = data.shift()!;

        this.equipmentCallback?.(equipType, equipInfo);
    }

    private receiveEntityList(data: never[]): void {
        this.entityListCallback?.(data.shift()!);
    }

    private receiveSync(data: never[]): void {
        this.syncCallback?.(data.shift()!);
    }

    private receiveMovement(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.movementCallback?.(opcode, info);
    }

    private receiveTeleport(data: never[]): void {
        let info = data.shift()!;

        this.teleportCallback?.(info);
    }

    private receiveDespawn(data: never[]): void {
        let id = data.shift()!;

        this.despawnCallback?.(id);
    }

    private receiveCombat(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.combatCallback?.(opcode, info);
    }

    private receiveAnimation(data: never[]): void {
        let id = data.shift()!,
            info = data.shift()!;

        this.animationCallback?.(id, info);
    }

    private receiveProjectile(data: never[]): void {
        let type = data.shift()!,
            info = data.shift()!;

        this.projectileCallback?.(type, info);
    }

    private receivePopulation(data: never[]): void {
        this.populationCallback?.(data.shift()!);
    }

    private receivePoints(data: never[]): void {
        let pointsData = data.shift()!;

        this.pointsCallback?.(pointsData);
    }

    private receiveNetwork(data: never[]): void {
        let opcode = data.shift()!;

        this.networkCallback?.(opcode);
    }

    private receiveChat(data: never[]): void {
        let info = data.shift()!;

        this.chatCallback?.(info);
    }

    private receiveCommand(data: never[]): void {
        let info = data.shift()!;

        this.commandCallback?.(info);
    }

    private receiveInventory(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.inventoryCallback?.(opcode, info);
    }

    private receiveBank(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.bankCallback?.(opcode, info);
    }

    private receiveAbility(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.abilityCallback?.(opcode, info);
    }

    private receiveQuest(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.questCallback?.(opcode, info);
    }

    private receiveNotification(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.notificationCallback?.(opcode, info);
    }

    private receiveBlink(data: never[]): void {
        let instance = data.shift()!;

        this.blinkCallback?.(instance);
    }

    private receiveHeal(data: never[]): void {
        this.healCallback?.(data.shift()!);
    }

    private receiveExperience(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.experienceCallback?.(opcode, info);
    }

    private receiveDeath(data: never[]): void {
        this.deathCallback?.(data.shift()!);
    }

    private receiveAudio(data: never[]): void {
        this.audioCallback?.(data.shift()!);
    }

    private receiveNPC(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.npcCallback?.(opcode, info);
    }

    private receiveRespawn(data: never[]): void {
        let id = data.shift()!,
            x = data.shift()!,
            y = data.shift()!;

        this.respawnCallback?.(id, x, y);
    }

    private receiveEnchant(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.enchantCallback?.(opcode, info);
    }

    private receiveGuild(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.guildCallback?.(opcode, info);
    }

    private receivePointer(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.pointerCallback?.(opcode, info);
    }

    private receivePVP(data: never[]): void {
        let id = data.shift()!,
            pvp = data.shift()!;

        this.pvpCallback?.(id, pvp);
    }

    private receiveShop(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.shopCallback?.(opcode, info);
    }

    private receiveMinigame(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.minigameCallback?.(opcode, info);
    }

    private receiveRegion(data: never[]): void {
        let opcode = data.shift()!,
            bufferSize = data.shift()!,
            info: string = data.shift()!,
            bufferData = window
                .atob(info)
                .split('')
                .map((char) => char.charCodeAt(0)),
            inflatedString = inflate(new Uint8Array(bufferData), { to: 'string' });

        this.regionCallback?.(opcode, bufferSize, JSON.parse(inflatedString) as never);
    }

    private receiveOverlay(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.overlayCallback?.(opcode, info);
    }

    private receiveCamera(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.cameraCallback?.(opcode, info);
    }

    private receiveBubble(data: never[]): void {
        let info = data.shift()!;

        this.bubbleCallback?.(info);
    }

    private receiveProfession(data: never[]): void {
        let opcode = data.shift()!,
            info = data.shift()!;

        this.professionCallback?.(opcode, info);
    }

    /**
     * Universal Callbacks
     */

    public onHandshake(callback: Callback): void {
        this.handshakeCallback = callback;
    }

    public onWelcome(callback: Callback): void {
        this.welcomeCallback = callback;
    }

    public onSpawn(callback: Callback): void {
        this.spawnCallback = callback;
    }

    public onEquipment(callback: Callback): void {
        this.equipmentCallback = callback;
    }

    public onEntityList(callback: Callback): void {
        this.entityListCallback = callback;
    }

    public onSync(callback: Callback): void {
        this.syncCallback = callback;
    }

    public onMovement(callback: Callback): void {
        this.movementCallback = callback;
    }

    public onTeleport(callback: Callback): void {
        this.teleportCallback = callback;
    }

    public onDespawn(callback: Callback): void {
        this.despawnCallback = callback;
    }

    public onCombat(callback: Callback): void {
        this.combatCallback = callback;
    }

    public onAnimation(callback: Callback): void {
        this.animationCallback = callback;
    }

    public onProjectile(callback: Callback): void {
        this.projectileCallback = callback;
    }

    public onPopulation(callback: Callback): void {
        this.populationCallback = callback;
    }

    public onPoints(callback: Callback): void {
        this.pointsCallback = callback;
    }

    public onNetwork(callback: Callback): void {
        this.networkCallback = callback;
    }

    public onChat(callback: Callback): void {
        this.chatCallback = callback;
    }

    public onCommand(callback: Callback): void {
        this.commandCallback = callback;
    }

    public onInventory(callback: Callback): void {
        this.inventoryCallback = callback;
    }

    public onBank(callback: Callback): void {
        this.bankCallback = callback;
    }

    public onAbility(callback: Callback): void {
        this.abilityCallback = callback;
    }

    public onQuest(callback: Callback): void {
        this.questCallback = callback;
    }

    public onNotification(callback: Callback): void {
        this.notificationCallback = callback;
    }

    public onBlink(callback: Callback): void {
        this.blinkCallback = callback;
    }

    public onHeal(callback: Callback): void {
        this.healCallback = callback;
    }

    public onExperience(callback: Callback): void {
        this.experienceCallback = callback;
    }

    public onDeath(callback: Callback): void {
        this.deathCallback = callback;
    }

    public onAudio(callback: Callback): void {
        this.audioCallback = callback;
    }

    public onNPC(callback: Callback): void {
        this.npcCallback = callback;
    }

    public onRespawn(callback: Callback): void {
        this.respawnCallback = callback;
    }

    public onEnchant(callback: Callback): void {
        this.enchantCallback = callback;
    }

    public onGuild(callback: Callback): void {
        this.guildCallback = callback;
    }

    public onPointer(callback: Callback): void {
        this.pointerCallback = callback;
    }

    public onPVP(callback: Callback): void {
        this.pvpCallback = callback;
    }

    public onShop(callback: Callback): void {
        this.shopCallback = callback;
    }

    public onMinigame(callback: Callback): void {
        this.minigameCallback = callback;
    }

    public onRegion(callback: Callback): void {
        this.regionCallback = callback;
    }

    public onOverlay(callback: Callback): void {
        this.overlayCallback = callback;
    }

    public onCamera(callback: Callback): void {
        this.cameraCallback = callback;
    }

    public onBubble(callback: Callback): void {
        this.bubbleCallback = callback;
    }

    public onProfession(callback: Callback): void {
        this.professionCallback = callback;
    }
}
