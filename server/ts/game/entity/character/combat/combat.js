"use strict";
exports.__esModule = true;
var _ = require("underscore");
var messages_1 = require("../../../../network/messages");
var packets_1 = require("../../../../network/packets");
var formulas_1 = require("../../../../util/formulas");
var modules_1 = require("../../../../util/modules");
var utils_1 = require("../../../../util/utils");
var combatqueue_1 = require("./combatqueue");
var hit_1 = require("./hit");
/**
 *
 */
var Combat = /** @class */ (function () {
    function Combat(character) {
        var _this = this;
        this.character = character;
        this.character = character;
        this.world = null;
        this.attackers = {};
        this.retaliate = false;
        this.queue = new combatqueue_1["default"]();
        this.attacking = false;
        this.attackLoop = null;
        this.followLoop = null;
        this.checkLoop = null;
        this.first = false;
        this.started = false;
        this.lastAction = -1;
        this.lastHit = -1;
        this.lastActionThreshold = 7000;
        this.cleanTimeout = null;
        this.character.onSubAoE(function (radius, hasTerror) {
            _this.dealAoE(radius, hasTerror);
        });
        this.character.onDamage(function (target, hitInfo) {
            if (_this.isPlayer() &&
                _this.character.hasBreakableWeapon() &&
                formulas_1["default"].getWeaponBreak(_this.character, target))
                _this.character.breakWeapon();
            if (hitInfo.type === modules_1["default"].Hits.Stun) {
                target.setStun(true);
                if (target.stunTimeout)
                    clearTimeout(target.stunTimeout);
                target.stunTimeout = setTimeout(function () {
                    target.setStun(false);
                }, 3000);
            }
        });
    }
    Combat.prototype.begin = function (attacker) {
        this.start();
        this.character.setTarget(attacker);
        this.addAttacker(attacker);
        attacker.combat.addAttacker(this.character); // For mobs attacking players..
        this.attack(attacker);
    };
    Combat.prototype.start = function () {
        var _this = this;
        if (this.started)
            return;
        this.lastAction = new Date().getTime();
        this.attackLoop = setInterval(function () {
            _this.parseAttack();
        }, this.character.attackRate);
        this.followLoop = setInterval(function () {
            _this.parseFollow();
        }, 400);
        this.checkLoop = setInterval(function () {
            _this.parseCheck();
        }, 1000);
        this.started = true;
    };
    Combat.prototype.stop = function () {
        if (!this.started)
            return;
        clearInterval(this.attackLoop);
        clearInterval(this.followLoop);
        clearInterval(this.checkLoop);
        this.attackLoop = null;
        this.followLoop = null;
        this.checkLoop = null;
        this.started = false;
    };
    Combat.prototype.parseAttack = function () {
        if (!this.world || !this.queue || this.character.stunned)
            return;
        if (this.character.hasTarget() && this.inProximity()) {
            if (this.character.target && !this.character.target.isDead())
                this.attack(this.character.target);
            if (this.queue.hasQueue())
                this.hit(this.character, this.character.target, this.queue.getHit());
            this.sync();
            this.lastAction = this.getTime();
        }
        else
            this.queue.clear();
    };
    Combat.prototype.parseFollow = function () {
        if (this.character.frozen || this.character.stunned)
            return;
        if (this.isMob()) {
            if (!this.character.isRanged())
                this.sendFollow();
            if (this.isAttacked() || this.character.hasTarget())
                this.lastAction = this.getTime();
            if (this.onSameTile()) {
                var newPosition = this.getNewPosition();
                this.move(this.character, newPosition.x, newPosition.y);
            }
            if (this.character.hasTarget() && !this.inProximity()) {
                var attacker = this.getClosestAttacker();
                if (attacker)
                    this.follow(this.character, attacker);
            }
        }
        if (this.isPlayer()) {
            if (!this.character.hasTarget())
                return;
            if (this.character.target.type !== 'player')
                return;
            if (!this.inProximity())
                this.follow(this.character, this.character.target);
        }
    };
    Combat.prototype.parseCheck = function () {
        if (this.getTime() - this.lastAction > this.lastActionThreshold) {
            this.stop();
            this.forget();
        }
    };
    Combat.prototype.attack = function (target) {
        var hit;
        if (this.isPlayer())
            hit = this.character.getHit(target);
        else
            hit = new hit_1["default"](modules_1["default"].Hits.Damage, formulas_1["default"].getDamage(this.character, target));
        if (!hit)
            return;
        this.queue.add(hit);
    };
    Combat.prototype.sync = function () {
        if (this.character.type !== 'mob')
            return;
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: this.character.region,
            message: new messages_1["default"].Combat(packets_1["default"].CombatOpcode.Sync, {
                attackerId: this.character.instance,
                targetId: this.character.instance,
                x: this.character.x,
                y: this.character.y
            })
        });
    };
    Combat.prototype.dealAoE = function (radius, hasTerror) {
        // TODO: Find a way to implement special effects without hard-coding them.
        var _this = this;
        if (!this.world)
            return;
        var entities = this.world
            .getGrids()
            .getSurroundingEntities(this.character, radius);
        _.each(entities, function (entity) {
            var hitData = new hit_1["default"](modules_1["default"].Hits.Damage, formulas_1["default"].getAoEDamage(_this.character, entity)).getData();
            hitData.isAoE = true;
            hitData.hasTerror = hasTerror;
            _this.hit(_this.character, entity, hitData);
        });
    };
    Combat.prototype.forceAttack = function () {
        if (!this.character.target || !this.inProximity())
            return;
        // this.stop();
        this.start();
        this.attackCount(2, this.character.target);
        this.hit(this.character, this.character.target, this.queue.getHit());
    };
    Combat.prototype.attackCount = function (count, target) {
        for (var i = 0; i < count; i++)
            this.attack(target);
    };
    Combat.prototype.addAttacker = function (character) {
        if (this.hasAttacker(character))
            return;
        this.attackers[character.instance] = character;
    };
    Combat.prototype.removeAttacker = function (character) {
        if (this.hasAttacker(character))
            delete this.attackers[character.instance];
        if (!this.isAttacked())
            this.sendToSpawn();
    };
    Combat.prototype.sendToSpawn = function () {
        if (!this.isMob())
            return;
        this.character["return"]();
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: this.character.region,
            message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Move, {
                id: this.character.instance,
                x: this.character.x,
                y: this.character.y,
                forced: false,
                teleport: false
            })
        });
    };
    Combat.prototype.hasAttacker = function (character) {
        if (!this.isAttacked())
            return;
        return character.instance in this.attackers;
    };
    Combat.prototype.onSameTile = function () {
        if (!this.character.target || this.character.type !== 'mob')
            return;
        return (this.character.x === this.character.target.x &&
            this.character.y === this.character.target.y);
    };
    Combat.prototype.isAttacked = function () {
        return this.attackers && Object.keys(this.attackers).length > 0;
    };
    Combat.prototype.getNewPosition = function () {
        var position = {
            x: this.character.x,
            y: this.character.y
        };
        var random = utils_1["default"].randomInt(0, 3);
        if (random === 0)
            position.x++;
        else if (random === 1)
            position.y--;
        else if (random === 2)
            position.x--;
        else if (random === 3)
            position.y++;
        return position;
    };
    Combat.prototype.isRetaliating = function () {
        return (this.isPlayer() &&
            !this.character.hasTarget() &&
            this.retaliate &&
            !this.character.moving &&
            new Date().getTime() - this.character.lastMovement > 1500);
    };
    Combat.prototype.inProximity = function () {
        if (!this.character.target)
            return;
        var targetDistance = this.character.getDistance(this.character.target);
        var range = this.character.attackRange;
        if (this.character.isRanged())
            return targetDistance <= range;
        return this.character.isNonDiagonal(this.character.target);
    };
    Combat.prototype.getClosestAttacker = function () {
        var _this = this;
        var closest = null;
        var lowestDistance = 100;
        this.forEachAttacker(function (attacker) {
            var distance = _this.character.getDistance(attacker);
            if (distance < lowestDistance)
                closest = attacker;
        });
        return closest;
    };
    Combat.prototype.setWorld = function (world) {
        if (!this.world)
            this.world = world;
    };
    Combat.prototype.forget = function () {
        this.attackers = {};
        this.character.removeTarget();
        if (this.forgetCallback)
            this.forgetCallback();
    };
    Combat.prototype.move = function (character, x, y) {
        /**
         * The server and mob types can parse the mob movement
         */
        if (character.type !== 'mob')
            return;
        character.setPosition(x, y);
    };
    Combat.prototype.hit = function (character, target, hitInfo, force) {
        var time = this.getTime();
        if (time - this.lastHit < this.character.attackRate &&
            !hitInfo.isAoE &&
            !force)
            return;
        if (character.isRanged() || hitInfo.isRanged) {
            var projectile = this.world.createProjectile([character, target], hitInfo);
            this.world.push(packets_1["default"].PushOpcode.Regions, {
                regionId: character.region,
                message: new messages_1["default"].Projectile(packets_1["default"].ProjectileOpcode.Create, projectile.getData())
            });
        }
        else {
            this.world.push(packets_1["default"].PushOpcode.Regions, {
                regionId: character.region,
                message: new messages_1["default"].Combat(packets_1["default"].CombatOpcode.Hit, {
                    attackerId: character.instance,
                    targetId: target.instance,
                    hitInfo: hitInfo
                })
            });
            this.world.handleDamage(character, target, hitInfo.damage);
        }
        if (character.damageCallback)
            character.damageCallback(target, hitInfo);
        this.lastHit = this.getTime();
    };
    Combat.prototype.follow = function (character, target) {
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: character.region,
            message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Follow, {
                attackerId: character.instance,
                targetId: target.instance,
                isRanged: character.isRanged,
                attackRange: character.attackRange
            })
        });
    };
    Combat.prototype.end = function () {
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: this.character.region,
            message: new messages_1["default"].Combat(packets_1["default"].CombatOpcode.Finish, {
                attackerId: this.character.instance,
                targetId: null
            })
        });
    };
    Combat.prototype.sendFollow = function () {
        if (!this.character.hasTarget() || this.character.target.isDead())
            return;
        // let ignores = [this.character.instance, this.character.target.instance];
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: this.character.region,
            message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Follow, {
                attackerId: this.character.instance,
                targetId: this.character.target.instance
            })
        });
    };
    Combat.prototype.forEachAttacker = function (callback) {
        _.each(this.attackers, function (attacker) {
            callback(attacker);
        });
    };
    Combat.prototype.onForget = function (callback) {
        this.forgetCallback = callback;
    };
    Combat.prototype.targetOutOfBounds = function () {
        if (!this.character.hasTarget() || !this.isMob())
            return;
        var spawnPoint = this.character.spawnLocation;
        var target = this.character.target;
        return (utils_1["default"].getDistance(spawnPoint[0], spawnPoint[1], target.x, target.y) > this.character.spawnDistance);
    };
    Combat.prototype.getTime = function () {
        return new Date().getTime();
    };
    Combat.prototype.colliding = function (x, y) {
        return this.world.map.isColliding(x, y);
    };
    Combat.prototype.isPlayer = function () {
        return this.character.type === 'player';
    };
    Combat.prototype.isMob = function () {
        return this.character.type === 'mob';
    };
    Combat.prototype.isTargetMob = function () {
        return this.character.target.type === 'mob';
    };
    Combat.prototype.canAttackAoE = function (target) {
        return (this.isMob() ||
            target.type === 'mob' ||
            (this.isPlayer() &&
                target.type === 'player' &&
                target.pvp &&
                this.character.pvp));
    };
    return Combat;
}());
exports["default"] = Combat;
