"use strict";
exports.__esModule = true;
var _ = require("underscore");
var messages_1 = require("../../../../network/messages");
var modules_1 = require("../../../../util/modules");
var packets_1 = require("../../../../network/packets");
var npcs_1 = require("../../../../util/npcs");
var hit_1 = require("../combat/hit");
var shops_1 = require("../../../../util/shops");
/**
 *
 */
var Handler = /** @class */ (function () {
    function Handler(player) {
        this.player = player;
        this.world = player.world;
        this.map = player.world.map;
        this.updateTicks = 0;
        this.updateInterval = null;
        this.load();
    }
    Handler.prototype.load = function () {
        var _this = this;
        this.updateInterval = setInterval(function () {
            _this.detectAggro();
            _this.detectPVP(_this.player.x, _this.player.y);
            if (_this.updateTicks % 4 === 0)
                // Every 4 (1.6 seconds) update ticks.
                _this.handlePoison();
            if (_this.updateTicks % 16 === 0)
                // Every 16 (6.4 seconds) update ticks.
                _this.player.cheatScore = 0;
            if (_this.updateTicks > 100)
                // Reset them every now and then.
                _this.updateTicks = 0;
            _this.updateTicks++;
        }, 400);
        this.player.onMovement(function (x, y) {
            _this.player.checkRegions();
            _this.detectMusic(x, y);
            _this.detectOverlay(x, y);
            _this.detectCamera(x, y);
            _this.detectLights(x, y);
        });
        this.player.onDeath(function () {
            _this.player.combat.stop();
        });
        this.player.onHit(function (attacker, damage) {
            /**
             * Handles actions whenever the player
             * instance is hit by 'damage' amount
             */
            if (_this.player.combat.isRetaliating())
                _this.player.combat.begin(attacker);
        });
        this.player.onKill(function (character) {
            if (_this.player.quests.isAchievementMob(character)) {
                var achievement = _this.player.quests.getAchievementByMob(character);
                if (achievement && achievement.isStarted())
                    _this.player.quests.getAchievementByMob(character).step();
            }
        });
        this.player.onRegion(function () {
            _this.player.lastRegionChange = new Date().getTime();
            _this.world.region.handle(_this.player);
            _this.world.region.push(_this.player);
        });
        this.player.connection.onClose(function () {
            _this.player.stopHealing();
            /* Avoid a memory leak */
            clearInterval(_this.updateInterval);
            _this.updateInterval = null;
            _this.world.removePlayer(_this.player);
        });
        this.player.onTalkToNPC(function (npc) {
            if (_this.player.quests.isQuestNPC(npc)) {
                _this.player.quests.getQuestByNPC(npc).triggerTalk(npc);
                return;
            }
            if (_this.player.quests.isAchievementNPC(npc)) {
                _this.player.quests.getAchievementByNPC(npc).converse(npc);
                return;
            }
            if (shops_1["default"].isShopNPC(npc.id)) {
                _this.world.shops.open(_this.player, npc.id);
                return;
            }
            switch (npcs_1["default"].getType(npc.id)) {
                case 'banker':
                    _this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Bank, {}));
                    return;
                case 'enchanter':
                    _this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Enchant, {}));
                    break;
            }
            var text = npcs_1["default"].getText(npc.id);
            if (!text)
                return;
            _this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(text, _this.player)
            }));
        });
        this.player.onTeleport(function (x, y, isDoor) {
            if (!_this.player.finishedTutorial() &&
                isDoor &&
                _this.player.doorCallback) {
                _this.player.doorCallback(x, y);
            }
        });
        this.player.onPoison(function (info) {
            _this.player.sync();
            if (info)
                _this.player.notify('You have been poisoned.');
            else
                _this.player.notify('The poison has worn off.');
            console.debug("Player " + _this.player.instance + " updated poison status.");
        });
        this.player.onCheatScore(function () {
            /**
             * This is a primitive anti-cheating system.
             * It will not accomplish much, but it is enough for now.
             */
            if (_this.player.cheatScore > 10)
                _this.player.timeout();
            console.debug("Cheat score - " + _this.player.cheatScore);
        });
    };
    Handler.prototype.detectAggro = function () {
        var _this = this;
        var region = this.world.region.regions[this.player.region];
        if (!region)
            return;
        _.each(region.entities, function (entity) {
            if (entity && entity.type === 'mob' && _this.canEntitySee(entity)) {
                var aggro = entity.canAggro(_this.player);
                if (aggro)
                    entity.combat.begin(_this.player);
            }
        });
    };
    Handler.prototype.detectMusic = function (x, y) {
        var musicArea = _.find(this.world.getMusicAreas(), function (area) {
            return area.contains(x, y);
        });
        var song = musicArea ? musicArea.id : null;
        if (this.player.currentSong !== song)
            this.player.updateMusic(song);
    };
    Handler.prototype.detectPVP = function (x, y) {
        var pvpArea = _.find(this.world.getPVPAreas(), function (area) {
            return area.contains(x, y);
        });
        this.player.updatePVP(!!pvpArea);
    };
    Handler.prototype.detectOverlay = function (x, y) {
        var overlayArea = _.find(this.world.getOverlayAreas(), function (area) {
            return area.contains(x, y);
        });
        this.player.updateOverlay(overlayArea);
    };
    Handler.prototype.detectCamera = function (x, y) {
        var cameraArea = _.find(this.world.getCameraAreas(), function (area) {
            return area.contains(x, y);
        });
        this.player.updateCamera(cameraArea);
    };
    Handler.prototype.detectLights = function (x, y) {
        var _this = this;
        _.each(this.map.lights, function (light) {
            if (_this.map.nearLight(light, x, y) &&
                !_this.player.hasLoadedLight(light)) {
                // Add a half a tile offset so the light is centered on the tile.
                _this.player.lightsLoaded.push(light);
                _this.player.send(new messages_1["default"].Overlay(packets_1["default"].OverlayOpcode.Lamp, light));
            }
        });
    };
    Handler.prototype.handlePoison = function () {
        if (!this.player.poison)
            return;
        var info = this.player.poison.split(':');
        var timeDiff = new Date().getTime() - info[0];
        if (timeDiff > info[1]) {
            this.player.setPoison(false);
            return;
        }
        var hit = new hit_1["default"](modules_1["default"].Hits.Poison, info[2]);
        hit.poison = true;
        this.player.combat.hit(this.player, this.player, hit.getData());
    };
    Handler.prototype.canEntitySee = function (entity) {
        return (!this.player.hasInvisible(entity) &&
            !this.player.hasInvisibleId(entity.id));
    };
    return Handler;
}());
exports["default"] = Handler;
