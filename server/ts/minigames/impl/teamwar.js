"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var _ = require("underscore");
var minigame_1 = require("../minigame");
var utils_1 = require("../../util/utils");
var messages_1 = require("../../network/messages");
var packets_1 = require("../../network/packets");
/**
 *
 */
var TeamWar = /** @class */ (function (_super) {
    __extends(TeamWar, _super);
    function TeamWar(world) {
        var _this = _super.call(this, 0, 'TeamWar') || this;
        _this.world = world;
        _this.lobby = [];
        _this.redTeam = [];
        _this.blueTeam = [];
        _this.updateInterval = null;
        _this.started = false;
        _this.countdown = 120;
        _this.updateInterval = 1000;
        _this.lastSync = new Date().getTime();
        _this.syncThreshold = 10000;
        _this.load();
        return _this;
    }
    TeamWar.prototype.load = function () {
        var _this = this;
        this.updateInterval = setInterval(function () {
            if (_this.count() < 5 || _this.countdown > 0)
                return;
            _this.buildTeams();
            if (new Date().getTime() - _this.lastSync > _this.syncThreshold)
                _this.synchronize();
            _this.started = true;
        }, this.updateInterval);
    };
    TeamWar.prototype.start = function () {
        //
    };
    TeamWar.prototype.add = function (player) {
        if (this.lobby.indexOf(player) > -1)
            return;
        this.lobby.push(player);
    };
    TeamWar.prototype.remove = function (player) {
        var index = this.lobby.indexOf(player);
        if (index < 0)
            return;
        this.lobby.splice(index, 1);
    };
    /**
     * Splits the players in the lobby into two groups.
     * These will be the two teams we are creating and
     * sending into the game map.
     */
    TeamWar.prototype.buildTeams = function () {
        var tmp = this.lobby.slice();
        var half = Math.ceil(tmp.length / 2);
        var random = utils_1["default"].randomInt(0, 1);
        if (random === 1) {
            this.redTeam = tmp.splice(0, half);
            this.blueTeam = tmp;
        }
        else {
            this.blueTeam = tmp.splice(0, half);
            this.redTeam = tmp;
        }
    };
    TeamWar.prototype.count = function () {
        return this.lobby.length;
    };
    TeamWar.prototype.synchronize = function () {
        var _this = this;
        if (this.started)
            return;
        _.each(this.lobby, function (player) {
            _this.sendCountdown(player);
        });
    };
    TeamWar.prototype.sendCountdown = function (player) {
        /**
         * We handle this logic client-sided. If a countdown does not exist,
         * we create one, otherwise we synchronize it with the packets we receive.
         */
        this.world.push(packets_1["default"].PushOpcode.Player, {
            player: player,
            message: new messages_1["default"].Minigame(packets_1["default"].MinigameOpcode.TeamWar, {
                opcode: packets_1["default"].MinigameOpcode.TeamWarOpcode.Countdown,
                countdown: this.countdown
            })
        });
    };
    // Used for radius
    TeamWar.prototype.getRandom = function (radius) {
        return utils_1["default"].randomInt(0, radius || 4);
    };
    TeamWar.prototype.getTeam = function (player) {
        return this.redTeam.indexOf(player) > -1
            ? 'red'
            : this.blueTeam.indexOf(player) > -1
                ? 'blue'
                : 'lobby';
    };
    // Both these spawning areas randomize the spawning to a radius of 4
    // The spawning area for the red team
    TeamWar.prototype.getRedTeamSpawn = function () {
        return {
            x: 133 + this.getRandom(),
            y: 471 + this.getRandom()
        };
    };
    // The spawning area for the blue team
    TeamWar.prototype.getBlueTeamSpawn = function () {
        return {
            x: 163 + this.getRandom(),
            y: 499 + this.getRandom()
        };
    };
    return TeamWar;
}(minigame_1["default"]));
exports["default"] = TeamWar;
