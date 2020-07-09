import Packets from './packets';
import _ from 'underscore';

export default class Messages {
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

    constructor(app) {
        var self = this;

        self.app = app;

        self.messages = [];

        self.messages[Packets.Handshake] = self.receiveHandshake;
        self.messages[Packets.Welcome] = self.receiveWelcome;
        self.messages[Packets.Spawn] = self.receiveSpawn;
        self.messages[Packets.Equipment] = self.receiveEquipment;
        self.messages[Packets.List] = self.receiveEntityList;
        self.messages[Packets.Sync] = self.receiveSync;
        self.messages[Packets.Movement] = self.receiveMovement;
        self.messages[Packets.Teleport] = self.receiveTeleport;
        self.messages[Packets.Despawn] = self.receiveDespawn;
        self.messages[Packets.Combat] = self.receiveCombat;
        self.messages[Packets.Animation] = self.receiveAnimation;
        self.messages[Packets.Projectile] = self.receiveProjectile;
        self.messages[Packets.Population] = self.receivePopulation;
        self.messages[Packets.Points] = self.receivePoints;
        self.messages[Packets.Network] = self.receiveNetwork;
        self.messages[Packets.Chat] = self.receiveChat;
        self.messages[Packets.Command] = self.receiveCommand;
        self.messages[Packets.Inventory] = self.receiveInventory;
        self.messages[Packets.Bank] = self.receiveBank;
        self.messages[Packets.Ability] = self.receiveAbility;
        self.messages[Packets.Quest] = self.receiveQuest;
        self.messages[Packets.Notification] = self.receiveNotification;
        self.messages[Packets.Blink] = self.receiveBlink;
        self.messages[Packets.Heal] = self.receiveHeal;
        self.messages[Packets.Experience] = self.receiveExperience;
        self.messages[Packets.Death] = self.receiveDeath;
        self.messages[Packets.Audio] = self.receiveAudio;
        self.messages[Packets.NPC] = self.receiveNPC;
        self.messages[Packets.Respawn] = self.receiveRespawn;
        self.messages[Packets.Enchant] = self.receiveEnchant;
        self.messages[Packets.Guild] = self.receiveGuild;
        self.messages[Packets.Pointer] = self.receivePointer;
        self.messages[Packets.PVP] = self.receivePVP;
        self.messages[Packets.Shop] = self.receiveShop;
        self.messages[Packets.Minigame] = self.receiveMinigame;
        self.messages[Packets.Region] = self.receiveRegion;
        self.messages[Packets.Overlay] = self.receiveOverlay;
        self.messages[Packets.Camera] = self.receiveCamera;
        self.messages[Packets.Bubble] = self.receiveBubble;
        self.messages[Packets.Profession] = self.receiveProfession;
    }

    handleData(data) {
        var self = this,
            packet = data.shift();

        if (self.messages[packet] && _.isFunction(self.messages[packet]))
            self.messages[packet].call(self, data);
    }

    handleBulkData(data) {
        var self = this;

        _.each(data, function(message) {
            self.handleData(message);
        });
    }

    handleUTF8(message) {
        var self = this;

        self.app.toggleLogin(false);

        switch (message) {
            case 'updated':
                self.app.sendError(null, 'The client has been updated!');

                self.app.openScroll('loadCharacter', 'clientUpdated');
                break;

            case 'full':
                self.app.sendError(null, 'The servers are currently full!');
                break;

            case 'error':
                self.app.sendError(null, 'The server has responded with an error!');
                break;

            case 'development':
                self.app.sendError(null, 'The game is currently in development mode.');
                break;

            case 'disallowed':
                self.app.sendError(null, 'The server is currently not accepting connections!');
                break;

            case 'maintenance':
                self.app.sendError(null, 'Kaetram is currently under maintenance.');
                break;

            case 'userexists':
                self.app.sendError(null, 'The username you have chosen already exists.');
                break;

            case 'emailexists':
                self.app.sendError(null, 'The email you have chosen is not available.');
                break;

            case 'loggedin':
                self.app.sendError(null, 'The player is already logged in!');
                break;

            case 'invalidlogin':
                self.app.sendError(null, 'You have entered the wrong username or password.');
                break;

            case 'toofast':
                self.app.sendError(
                    null,
                    'You are trying to log in too fast from the same connection.'
                );
                break;

            case 'malform':
                self.app.game.handleDisconnection(true);
                self.app.sendError(null, 'Client has experienced a malfunction.');

                break;

            case 'timeout':
                self.app.sendError(
                    null,
                    'You have been disconnected for being inactive for too long.'
                );

                break;

            default:
                self.app.sendError(
                    null,
                    'An unknown error has occurred, please submit a bug report.'
                );
                break;
        }
    }

    /**
     * Data Receivers
     */

    receiveHandshake(data) {
        var self = this,
            info = data.shift();

        if (self.handshakeCallback) self.handshakeCallback(info);
    }

    receiveWelcome(data) {
        var self = this,
            playerData = data.shift();

        if (self.welcomeCallback) self.welcomeCallback(playerData);
    }

    receiveSpawn(data) {
        var self = this;

        if (self.spawnCallback) self.spawnCallback(data);
    }

    receiveEquipment(data) {
        var self = this,
            equipType = data.shift(),
            equipInfo = data.shift();

        if (self.equipmentCallback) self.equipmentCallback(equipType, equipInfo);
    }

    receiveEntityList(data) {
        var self = this;

        if (self.entityListCallback) self.entityListCallback(data);
    }

    receiveSync(data) {
        var self = this;

        if (self.syncCallback) self.syncCallback(data.shift());
    }

    receiveMovement(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.movementCallback) self.movementCallback(opcode, info);
    }

    receiveTeleport(data) {
        var self = this,
            info = data.shift();

        if (self.teleportCallback) self.teleportCallback(info);
    }

    receiveDespawn(data) {
        var self = this,
            id = data.shift();

        if (self.despawnCallback) self.despawnCallback(id);
    }

    receiveCombat(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.combatCallback) self.combatCallback(opcode, info);
    }

    receiveAnimation(data) {
        var self = this,
            id = data.shift(),
            info = data.shift();

        if (self.animationCallback) self.animationCallback(id, info);
    }

    receiveProjectile(data) {
        var self = this,
            type = data.shift(),
            info = data.shift();

        if (self.projectileCallback) self.projectileCallback(type, info);
    }

    receivePopulation(data) {
        var self = this;

        if (self.populationCallback) self.populationCallback(data.shift());
    }

    receivePoints(data) {
        var self = this,
            pointsData = data.shift();

        if (self.pointsCallback) self.pointsCallback(pointsData);
    }

    receiveNetwork(data) {
        var self = this,
            opcode = data.shift();

        if (self.networkCallback) self.networkCallback(opcode);
    }

    receiveChat(data) {
        var self = this,
            info = data.shift();

        if (self.chatCallback) self.chatCallback(info);
    }

    receiveCommand(data) {
        var self = this,
            info = data.shift();

        if (self.commandCallback) self.commandCallback(info);
    }

    receiveInventory(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.inventoryCallback) self.inventoryCallback(opcode, info);
    }

    receiveBank(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.bankCallback) self.bankCallback(opcode, info);
    }

    receiveAbility(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.abilityCallback) self.abilityCallback(opcode, info);
    }

    receiveQuest(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.questCallback) self.questCallback(opcode, info);
    }

    receiveNotification(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.notificationCallback) self.notificationCallback(opcode, info);
    }

    receiveBlink(data) {
        var self = this,
            instance = data.shift();

        if (self.blinkCallback) self.blinkCallback(instance);
    }

    receiveHeal(data) {
        var self = this;

        if (self.healCallback) self.healCallback(data.shift());
    }

    receiveExperience(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.experienceCallback) self.experienceCallback(opcode, info);
    }

    receiveDeath(data) {
        var self = this;

        if (self.deathCallback) self.deathCallback(data.shift());
    }

    receiveAudio(data) {
        var self = this;

        if (self.audioCallback) self.audioCallback(data.shift());
    }

    receiveNPC(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.npcCallback) self.npcCallback(opcode, info);
    }

    receiveRespawn(data) {
        var self = this,
            id = data.shift(),
            x = data.shift(),
            y = data.shift();

        if (self.respawnCallback) self.respawnCallback(id, x, y);
    }

    receiveEnchant(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.enchantCallback) self.enchantCallback(opcode, info);
    }

    receiveGuild(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.guildCallback) self.guildCallback(opcode, info);
    }

    receivePointer(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.pointerCallback) self.pointerCallback(opcode, info);
    }

    receivePVP(data) {
        var self = this,
            id = data.shift(),
            pvp = data.shift();

        if (self.pvpCallback) self.pvpCallback(id, pvp);
    }

    receiveShop(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.shopCallback) self.shopCallback(opcode, info);
    }

    receiveMinigame(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.minigameCallback) self.minigameCallback(opcode, info);
    }

    receiveRegion(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift(),
            force = data.shift();

        if (self.regionCallback) self.regionCallback(opcode, info, force);
    }

    receiveOverlay(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.overlayCallback) self.overlayCallback(opcode, info);
    }

    receiveCamera(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.cameraCallback) self.cameraCallback(opcode, info);
    }

    receiveBubble(data) {
        var self = this,
            info = data.shift();

        if (self.bubbleCallback) self.bubbleCallback(info);
    }

    receiveProfession(data) {
        var self = this,
            opcode = data.shift(),
            info = data.shift();

        if (self.professionCallback) self.professionCallback(opcode, info);
    }

    /**
     * Universal Callbacks
     */

    onHandshake(callback) {
        this.handshakeCallback = callback;
    }

    onWelcome(callback) {
        this.welcomeCallback = callback;
    }

    onSpawn(callback) {
        this.spawnCallback = callback;
    }

    onEquipment(callback) {
        this.equipmentCallback = callback;
    }

    onEntityList(callback) {
        this.entityListCallback = callback;
    }

    onSync(callback) {
        this.syncCallback = callback;
    }

    onMovement(callback) {
        this.movementCallback = callback;
    }

    onTeleport(callback) {
        this.teleportCallback = callback;
    }

    onDespawn(callback) {
        this.despawnCallback = callback;
    }

    onCombat(callback) {
        this.combatCallback = callback;
    }

    onAnimation(callback) {
        this.animationCallback = callback;
    }

    onProjectile(callback) {
        this.projectileCallback = callback;
    }

    onPopulation(callback) {
        this.populationCallback = callback;
    }

    onPoints(callback) {
        this.pointsCallback = callback;
    }

    onNetwork(callback) {
        this.networkCallback = callback;
    }

    onChat(callback) {
        this.chatCallback = callback;
    }

    onCommand(callback) {
        this.commandCallback = callback;
    }

    onInventory(callback) {
        this.inventoryCallback = callback;
    }

    onBank(callback) {
        this.bankCallback = callback;
    }

    onAbility(callback) {
        this.abilityCallback = callback;
    }

    onQuest(callback) {
        this.questCallback = callback;
    }

    onNotification(callback) {
        this.notificationCallback = callback;
    }

    onBlink(callback) {
        this.blinkCallback = callback;
    }

    onHeal(callback) {
        this.healCallback = callback;
    }

    onExperience(callback) {
        this.experienceCallback = callback;
    }

    onDeath(callback) {
        this.deathCallback = callback;
    }

    onAudio(callback) {
        this.audioCallback = callback;
    }

    onNPC(callback) {
        this.npcCallback = callback;
    }

    onRespawn(callback) {
        this.respawnCallback = callback;
    }

    onEnchant(callback) {
        this.enchantCallback = callback;
    }

    onGuild(callback) {
        this.guildCallback = callback;
    }

    onPointer(callback) {
        this.pointerCallback = callback;
    }

    onPVP(callback) {
        this.pvpCallback = callback;
    }

    onShop(callback) {
        this.shopCallback = callback;
    }

    onMinigame(callback) {
        this.minigameCallback = callback;
    }

    onRegion(callback) {
        this.regionCallback = callback;
    }

    onOverlay(callback) {
        this.overlayCallback = callback;
    }

    onCamera(callback) {
        this.cameraCallback = callback;
    }

    onBubble(callback) {
        this.bubbleCallback = callback;
    }

    onProfession(callback) {
        this.professionCallback = callback;
    }
}
