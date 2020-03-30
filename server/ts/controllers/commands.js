"use strict";
exports.__esModule = true;
var _ = require("underscore");
var messages_1 = require("../network/messages");
var packets_1 = require("../network/packets");
var world_client_json_1 = require("../../data/map/world_client.json");
/**
 *
 */
var Commands = /** @class */ (function () {
    function Commands(player) {
        this.player = player;
        this.world = player.world;
    }
    Commands.prototype.parse = function (rawText) {
        var blocks = rawText.substring(1).split(' ');
        if (blocks.length < 1)
            return;
        var command = blocks.shift();
        this.handlePlayerCommands(command, blocks);
        if (this.player.rights > 0)
            this.handleModeratorCommands(command, blocks);
        if (this.player.rights > 1)
            this.handleAdminCommands(command, blocks);
    };
    Commands.prototype.handlePlayerCommands = function (command, blocks) {
        var _this = this;
        switch (command) {
            case 'players':
                var population = this.world.getPopulation();
                var singular = population === 1;
                if (this.player.rights > 1)
                    _.each(this.world.players, function (player) {
                        _this.player.notify(player.username);
                    });
                this.player.notify("There " + (singular ? 'is' : 'are') + " currently " + population + " " + (singular ? 'person' : 'people') + " online.");
                return;
            case 'tutstage':
                console.info(this.player.getTutorial().stage);
                return;
            case 'coords':
                this.player.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, "x: " + this.player.x + " y: " + this.player.y));
                return;
            case 'progress':
                var tutorialQuest = this.player.getTutorial();
                this.player.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.Progress, {
                    id: tutorialQuest.id,
                    stage: tutorialQuest.stage
                }));
                return;
            case 'global':
                this.world.push(packets_1["default"].PushOpcode.Broadcast, {
                    message: new messages_1["default"].Chat({
                        name: this.player.username,
                        text: blocks.join(' '),
                        isGlobal: true,
                        withBubble: false,
                        colour: 'rgba(191, 191, 63, 1.0)'
                    })
                });
                return;
            case 'region':
                console.info(this.player.region);
                return;
            case 'getintroduction':
                console.info(this.player.quests.getQuest(0).getStage());
                return;
            case 'resetintro':
                var introduction = this.player.quests.getQuest(0);
                introduction.setStage(0);
                introduction.clearPointers();
                introduction.update();
                introduction.updatePointers();
                this.player.updateRegion();
                this.player.save();
        }
    };
    Commands.prototype.handleModeratorCommands = function (command, blocks) {
        switch (command) {
            case 'mute':
            case 'ban':
                var duration = blocks.shift();
                var targetName = blocks.join(' ');
                var user = this.world.getPlayerByName(targetName);
                if (!user)
                    return;
                if (!duration)
                    duration = 24;
                var timeFrame = new Date().getTime() + duration * 60 * 60;
                if (command === 'mute')
                    user.mute = timeFrame;
                else if (command === 'ban') {
                    user.ban = timeFrame;
                    user.save();
                    user.connection.sendUTF8('ban');
                    user.connection.close('banned');
                }
                user.save();
                return;
            case 'unmute':
                var uTargetName = blocks.join(' ');
                var uUser = this.world.getPlayerByName(uTargetName);
                if (!uTargetName)
                    return;
                uUser.mute = new Date().getTime() - 3600;
                uUser.save();
        }
    };
    Commands.prototype.handleAdminCommands = function (command, blocks) {
        var _this = this;
        var username;
        var player;
        switch (command) {
            case 'spawn':
                var spawnId = parseInt(blocks.shift());
                var count = parseInt(blocks.shift());
                var ability = parseInt(blocks.shift());
                var abilityLevel = parseInt(blocks.shift());
                if (!spawnId || !count)
                    return;
                this.player.inventory.add({
                    id: spawnId,
                    count: count,
                    ability: ability || -1,
                    abilityLevel: abilityLevel || -1
                });
                return;
            case 'maxhealth':
                this.player.notify("Max health is " + this.player.hitPoints.getMaxHitPoints());
                return;
            case 'ipban':
                return;
            case 'drop':
                var id = parseInt(blocks.shift());
                var dCount = parseInt(blocks.shift());
                if (!id)
                    return;
                if (!dCount)
                    dCount = 1;
                this.world.dropItem(id, dCount, this.player.x, this.player.y);
                return;
            case 'ghost':
                this.player.equip('ghost', 1, -1, -1);
                return;
            case 'notify':
                this.player.notify('Hello!!!');
                return;
            case 'teleport':
                var x = parseInt(blocks.shift());
                var y = parseInt(blocks.shift());
                var withAnimation = parseInt(blocks.shift());
                console.info(!!withAnimation);
                if (x && y)
                    this.player.teleport(x, y, false, !!withAnimation);
                return;
            case 'teletome':
                username = blocks.join(' ');
                player = this.world.getPlayerByName(username);
                if (player)
                    player.teleport(this.player.x, this.player.y);
                return;
            case 'teleto':
                username = blocks.join(' ');
                player = this.world.getPlayerByName(username);
                if (player)
                    this.player.teleport(player.x, player.y);
                return;
            case 'nohit':
                console.info('invincinil');
                this.player.invincible = !this.player.invincible;
                return;
            case 'mob':
                var npcId = parseInt(blocks.shift());
                this.world.spawnMob(npcId, this.player.x, this.player.y);
                return;
            case 'pointer':
                if (blocks.length > 1) {
                    var posX = parseInt(blocks.shift());
                    var posY = parseInt(blocks.shift());
                    if (!posX || !posY)
                        return;
                    this.player.send(new messages_1["default"].Pointer(packets_1["default"].PointerOpcode.Location, {
                        id: this.player.instance,
                        x: posX,
                        y: posY
                    }));
                }
                else {
                    var instance = blocks.shift();
                    if (!instance)
                        return;
                    this.player.send(new messages_1["default"].Pointer(packets_1["default"].PointerOpcode.NPC, {
                        id: instance
                    }));
                }
                return;
            case 'teleall':
                _.each(this.world.players, function (player) {
                    player.teleport(_this.player.x, _this.player.y);
                });
                return;
            case 'attackaoe':
                var radius = parseInt(blocks.shift());
                if (!radius)
                    radius = 1;
                this.player.combat.dealAoE(radius);
                return;
            case 'addexp':
                var exp = parseInt(blocks.shift());
                if (!exp)
                    return;
                this.player.addExperience(exp);
                return;
            case 'region':
                var tileX = parseInt(blocks.shift());
                var tileY = parseInt(blocks.shift());
                var tileInfo = parseInt(blocks.shift());
                if (!tileX || !tileY)
                    return;
                var tileIndex = this.world.region.gridPositionToIndex(tileX - 1, tileY);
                console.info("Sending Tile: " + tileIndex);
                this.world.push(packets_1["default"].PushOpcode.Player, {
                    player: this.player,
                    message: new messages_1["default"].Region(packets_1["default"].RegionOpcode.Modify, {
                        index: tileIndex,
                        data: tileInfo
                    })
                });
                return;
            case 'gettile':
                var getTileX = parseInt(blocks.shift());
                var getTileY = parseInt(blocks.shift());
                if (!getTileX || !getTileY)
                    return;
                var getTileIndex = this.world.region.gridPositionToIndex(getTileX - 1, getTileY);
                console.info("Tile Index: " + getTileIndex);
                console.info("Tile Info: " + world_client_json_1["default"].data[getTileIndex]);
                console.info("Actual Index: " + this.world.map.getActualTileIndex(getTileIndex));
                return;
            case 'instance':
                this.world.region.createInstance(this.player, this.player.region);
                return;
            case 'checkregion':
                this.player.notify("Current Region: " + this.player.region);
                return;
            case 'deinstance':
                this.world.region.deleteInstance(this.player);
                return;
            case 'debug':
                this.player.send(new messages_1["default"].Command({
                    command: 'debug'
                }));
                return;
            case 'addexperience':
                this.player.addExperience(parseInt(blocks.shift()));
                return;
            case 'attackrange':
                console.info(this.player.attackRange);
                return;
            case 'resetregions':
                console.info('Resetting regions...');
                this.player.regionsLoaded = [];
                this.player.updateRegion();
                return;
            case 'finishQuest':
                this.player.quests.getQuest(1).finish();
                break;
            case 'finishAchievement':
                this.player.quests.achievements[0].finish();
                break;
            case 'resetAchievement':
                var achievementId = parseInt(blocks.shift());
                if (!achievementId) {
                    this.player.notify('Invalid command format. /resetAchievement <achievementId>');
                    return;
                }
                this.player.quests.achievements[achievementId].setProgress(0);
                this.player.updateRegion();
                break;
            case 'clear':
                this.player.inventory.forEachSlot(function (slot) {
                    if (slot !== -1) {
                        _this.player.inventory.remove(slot.id, slot.count);
                    }
                });
                break;
            case 'timeout':
                this.player.timeout();
                break;
            case 'togglepvp':
                this.world.forEachPlayer(function (player) {
                    player.updatePVP(true, true);
                });
                break;
            case 'die':
                this.world.handleDeath(this.player);
                break;
            case 'ms':
                var movementSpeed = parseInt(blocks.shift());
                if (!movementSpeed) {
                    this.player.notify('No movement speed specified.');
                    return;
                }
                if (movementSpeed < 75)
                    // Just to not break stuff.
                    movementSpeed = 75;
                this.player.defaultMovementSpeed = movementSpeed;
                this.player.sync();
                break;
            case 'toggleheal':
                this.player.send(new messages_1["default"].Command({
                    command: 'toggleheal'
                }));
                break;
        }
    };
    return Commands;
}());
exports["default"] = Commands;
