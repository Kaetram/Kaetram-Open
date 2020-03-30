"use strict";
exports.__esModule = true;
var utils_1 = require("../../../../util/utils");
var messages_1 = require("../../../../network/messages");
var packets_1 = require("../../../../network/packets");
/**
 *
 */
var MobHandler = /** @class */ (function () {
    function MobHandler(mob, world) {
        this.mob = mob;
        this.world = world;
        this.map = world.map;
        this.roamingInterval = null;
        this.spawnLocation = mob.spawnLocation;
        this.maxRoamingDistance = mob.maxRoamingDistance;
        this.load();
        this.loadCallbacks();
    }
    MobHandler.prototype.load = function () {
        var _this = this;
        if (!this.mob.roaming)
            return;
        this.roamingInterval = setInterval(function () {
            if (!_this.mob.dead) {
                // Calculate a random position near the mobs spawn location.
                var newX = _this.spawnLocation[0] +
                    utils_1["default"].randomInt(-_this.maxRoamingDistance, _this.maxRoamingDistance);
                var newY = _this.spawnLocation[1] +
                    utils_1["default"].randomInt(-_this.maxRoamingDistance, _this.maxRoamingDistance);
                var distance = utils_1["default"].getDistance(_this.spawnLocation[0], _this.spawnLocation[1], newX, newY);
                // Return if the tile is colliding.
                if (_this.map.isColliding(newX, newY))
                    return;
                // Prevent movement if the area is empty.
                if (_this.map.isEmpty(newX, newY))
                    return;
                // Don't have mobs block a door.
                if (_this.map.isDoor(newX, newY))
                    return;
                // Prevent mobs from going outside of their roaming radius.
                if (distance < _this.mob.maxRoamingDistance)
                    return;
                // No need to move mobs to the same position as theirs.
                if (newX === _this.mob.x && newY === _this.mob.y)
                    return;
                // We don't want mobs randomly roaming while in combat.
                if (_this.mob.combat.started)
                    return;
                /**
                 * An expansion of the plateau level present in BrowserQuest.
                 * Because the map is far more complex, we will require multiple
                 * levels of plateau in order to properly roam entities without
                 * them walking into other regions (or clipping).
                 */
                if (_this.mob.getPlateauLevel() !==
                    _this.map.getPlateauLevel(newX, newY))
                    return;
                // if (config.debug)
                //    this.forceTalk('Yes hello, I am moving.');
                _this.mob.setPosition(newX, newY);
                _this.world.push(packets_1["default"].PushOpcode.Regions, {
                    regionId: _this.mob.region,
                    message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Move, {
                        id: _this.mob.instance,
                        x: newX,
                        y: newY
                    })
                });
            }
        }, 5000);
    };
    MobHandler.prototype.loadCallbacks = function () {
        // TODO: Implement posion on Mobs
    };
    MobHandler.prototype.forceTalk = function (message) {
        if (!this.world)
            return;
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: this.mob.region,
            message: new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Talk, {
                id: this.mob.instance,
                text: message,
                nonNPC: true
            })
        });
    };
    return MobHandler;
}());
exports["default"] = MobHandler;
