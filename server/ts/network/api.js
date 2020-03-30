"use strict";
exports.__esModule = true;
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var _ = require("underscore");
var config_1 = require("../../config");
var apiconstants_1 = require("../util/apiconstants");
/**
 * @param accessToken - A randomly generated token that can be used
 * to verify the validity between the client and the server.
 * This is a rudimentary security method, but is enough considering
 * the simplicity of the current API.
 */
/**
 * API will have a variety of uses. Including communication
 * between multiple worlds (planned for the future).
 *
 * @beta
 */
var API = /** @class */ (function () {
    function API(world) {
        this.world = world;
        var app = express_1["default"]();
        app.use(body_parser_1["default"].urlencoded({ extended: true }));
        app.use(body_parser_1["default"].json());
        var router = express_1["default"].Router();
        this.handle(router);
        app.use('/', router);
        app.listen(config_1["default"].apiPort, function () {
            console.info(config_1["default"].name + " API is now listening on: " + config_1["default"].apiPort);
        });
    }
    API.prototype.handle = function (router) {
        var _this = this;
        router.get('/', function (request, response) {
            response.json({
                name: config_1["default"].name,
                gameVersion: config_1["default"].gver,
                maxPlayers: config_1["default"].maxPlayers,
                playerCount: _this.world.getPopulation()
            });
        });
        router.get('/players', function (request, response) {
            if (!request.query.token ||
                request.query.token !== config_1["default"].accessToken) {
                _this.returnError(response, apiconstants_1["default"].MALFORMED_PARAMETERS, 'Invalid `token` specified for /player GET request.');
                return;
            }
            var players = {};
            _.each(_this.world.players, function (player) {
                players[player.username] = {
                    x: player.x,
                    y: player.y,
                    experience: player.experience,
                    level: player.level,
                    hitPoints: player.hitPoints,
                    maxHitPoints: player.maxHitPoints,
                    mana: player.mana,
                    maxMana: player.maxMana,
                    pvpKills: player.pvpKills,
                    orientation: player.orientation,
                    lastLogin: player.lastLogin,
                    mapVersion: player.mapVersion
                };
            });
            response.json(players);
        });
    };
    API.prototype.returnError = function (response, error, message) {
        response.json({
            error: error,
            message: message
        });
    };
    return API;
}());
exports["default"] = API;
