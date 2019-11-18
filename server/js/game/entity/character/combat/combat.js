/* global module */

const _ = require('underscore');
const Hit = require('./hit');
const CombatQueue = require('./combatqueue');
const Utils = require('../../../../util/utils');
const Formulas = require('../../../../util/formulas');
const Modules = require('../../../../util/modules');
const Messages = require('../../../../network/messages');
const Packets = require('../../../../network/packets');

class Combat {
    constructor(character) {
        const self = this;

        self.character = character;
        self.world = null;

        self.attackers = {};

        self.retaliate = false;

        self.queue = new CombatQueue();

        self.attacking = false;

        self.attackLoop = null;
        self.followLoop = null;
        self.checkLoop = null;

        self.first = false;
        self.started = false;
        self.lastAction = -1;
        self.lastHit = -1;

        self.lastActionThreshold = 7000;

        self.cleanTimeout = null;

        self.character.onSubAoE((radius, hasTerror) => {
            self.dealAoE(radius, hasTerror);
        });

        self.character.onDamage((target, hitInfo) => {
            if (self.isPlayer() && self.character.hasBreakableWeapon() && Formulas.getWeaponBreak(self.character, target))
                self.character.breakWeapon();

            if (hitInfo.type === Modules.Hits.Stun) {
                target.setStun(true);

                if (target.stunTimeout)
                    clearTimeout(target.stunTimeout);

                target.stunTimeout = setTimeout(() => {
                    target.setStun(false);
                }, 3000);
            }
        });
    }

    begin(attacker) {
        const self = this;

        self.start();

        self.character.setTarget(attacker);
        self.addAttacker(attacker);

        attacker.combat.addAttacker(self.character); // For mobs attacking players..

        self.attack(attacker);
    }

    start() {
        const self = this;

        if (self.started)
            return;

        self.lastAction = new Date().getTime();

        self.attackLoop = setInterval(() => {self.parseAttack();}, self.character.attackRate);

        self.followLoop = setInterval(() => {self.parseFollow();}, 400);

        self.checkLoop = setInterval(() => {self.parseCheck();}, 1000);

        self.started = true;
    }

    stop() {
        const self = this;

        if (!self.started)
            return;

        clearInterval(self.attackLoop);
        clearInterval(self.followLoop);
        clearInterval(self.checkLoop);

        self.attackLoop = null;
        self.followLoop = null;
        self.checkLoop = null;

        self.started = false;
    }

    parseAttack() {
        const self = this;

        if (!self.world || !self.queue || self.character.stunned)
            return;

        if (self.character.hasTarget() && self.inProximity()) {
            if (self.queue.hasQueue())
                self.hit(self.character, self.character.target, self.queue.getHit());

            if (self.character.target && !self.character.target.isDead())
                self.attack(self.character.target);

            self.sync();

            self.lastAction = self.getTime();
        } else
            self.queue.clear();
    }

    parseFollow() {
        const self = this;

        if (self.character.frozen || self.character.stunned)
            return;

        if (self.isMob()) {
            if (!self.character.isRanged())
                self.sendFollow();

            if (self.isAttacked() || self.character.hasTarget())
                self.lastAction = self.getTime();

            if (self.onSameTile()) {
                const newPosition = self.getNewPosition();

                self.move(self.character, newPosition.x, newPosition.y);
            }

            if (self.character.hasTarget() && !self.inProximity()) {
                const attacker = self.getClosestAttacker();

                if (attacker)
                    self.follow(self.character, attacker);
            }
        }
    }

    parseCheck() {
        const self = this;

        if (self.getTime() - self.lastAction > self.lastActionThreshold) {
            self.stop();

            self.forget();
        }
    }

    attack(target) {
        const self = this;
        let hit;

        if (self.isPlayer())
            hit = self.character.getHit(target);
        else
            hit = new Hit(Modules.Hits.Damage, Formulas.getDamage(self.character, target));

        if (!hit)
            return;

        self.queue.add(hit);
    }

    sync() {
        const self = this;

        if (self.character.type !== 'mob')
            return;

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.character.region,
            message: new Messages.Combat(Packets.CombatOpcode.Sync, {
                attackerId: self.character.instance, // irrelevant
                targetId: self.character.instance, // can be the same since we're acting on an entity.
                x: self.character.x,
                y: self.character.y
            })
        });
    }

    dealAoE(radius, hasTerror) {
        const self = this;

        /**
         * TODO - Find a way to implement special effects without hardcoding them.
         */

        if (!self.world)
            return;

        const entities = self.world.getGrids().getSurroundingEntities(self.character, radius);

        _.each(entities, entity => {
            const hitData = new Hit(Modules.Hits.Damage, Formulas.getAoEDamage(self.character, entity)).getData();

            hitData.isAoE = true;
            hitData.hasTerror = hasTerror;

            self.hit(self.character, entity, hitData);
        });
    }

    forceAttack() {
        const self = this;

        if (!self.character.target || !self.inProximity())
            return;

        self.stop();
        self.start();

        self.attackCount(2, self.character.target);
        self.hit(self.character, self.character.target, self.queue.getHit());
    }

    attackCount(count, target) {
        const self = this;

        for (let i = 0; i < count; i++)
            self.attack(target);
    }

    addAttacker(character) {
        const self = this;

        if (self.hasAttacker(character))
            return;

        self.attackers[character.instance] = character;
    }

    removeAttacker(character) {
        const self = this;

        if (self.hasAttacker(character))
            delete self.attackers[character.instance];

        if (!self.isAttacked())
            self.sendToSpawn();
    }

    sendToSpawn() {
        const self = this;

        if (!self.isMob())
            return;

        self.character.return();

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Move, {
                id: self.character.instance,
                x: self.character.x,
                y: self.character.y,
                forced: false,
                teleport: false
            })
        });
    }

    hasAttacker(character) {
        const self = this;

        if (!self.isAttacked())
            return;

        return character.instance in self.attackers;
    }

    onSameTile() {
        const self = this;

        if (!self.character.target || self.character.type !== 'mob')
            return;

        return self.character.x === self.character.target.x && self.character.y === self.character.target.y;
    }

    isAttacked() {
        return this.attackers && Object.keys(this.attackers).length > 0;
    }

    getNewPosition() {
        const self = this;
        const position = {
            x: self.character.x,
            y: self.character.y
        };

        const random = Utils.randomInt(0, 3);

        if (random === 0)
            position.x++;
        else if (random === 1)
            position.y--;
        else if (random === 2)
            position.x--;
        else if (random === 3)
            position.y++;

        return position;
    }

    isRetaliating() {
        return this.isPlayer() && !this.character.hasTarget() && this.retaliate && !this.character.moving && new Date().getTime() - this.character.lastMovement > 1500;
    }

    inProximity() {
        const self = this;

        if (!self.character.target)
            return;

        const targetDistance = self.character.getDistance(self.character.target);
        const range = self.character.attackRange;

        if (self.character.isRanged())
            return targetDistance <= range;

        return self.character.isNonDiagonal(self.character.target);
    }

    getClosestAttacker() {
        const self = this;
        let closest = null;
        const lowestDistance = 100;

        self.forEachAttacker(attacker => {
            const distance = self.character.getDistance(attacker);

            if (distance < lowestDistance)
                closest = attacker;
        });

        return closest;
    }

    setWorld(world) {
        const self = this;

        if (!self.world)
            self.world = world;
    }

    forget() {
        const self = this;

        self.attackers = {};
        self.character.removeTarget();

        if (self.forgetCallback)
            self.forgetCallback();
    }

    move(character, x, y) {
        const self = this;

        /**
         * The server and mob types can parse the mob movement
         */

        if (character.type !== 'mob')
            return;

        character.setPosition(x, y);
    }

    hit(character, target, hitInfo) {
        const self = this;
        const time = self.getTime();

        if (time - self.lastHit < self.character.attackRate && !hitInfo.isAoE)
            return;

        if (character.isRanged() || hitInfo.isRanged) {
            const projectile = self.world.createProjectile([character, target], hitInfo);

            self.world.push(Packets.PushOpcode.Regions, {
                regionId: character.region,
                message: new Messages.Projectile(Packets.ProjectileOpcode.Create, projectile.getData())
            });
        } else {
            self.world.push(Packets.PushOpcode.Regions, {
                regionId: character.region,
                message: new Messages.Combat(Packets.CombatOpcode.Hit, {
                    attackerId: character.instance,
                    targetId: target.instance,
                    hitInfo: hitInfo
                })
            });

            self.world.handleDamage(character, target, hitInfo.damage);
        }

        if (character.damageCallback)
            character.damageCallback(target, hitInfo);

        self.lastHit = self.getTime();
    }

    follow(character, target) {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: character.instance,
                targetId: target.instance,
                isRanged: character.isRanged,
                attackRange: character.attackRange
            })
        });
    }

    end() {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Combat(Packets.CombatOpcode.Finish, {
                attackerId: this.character.instance,
                targetId: null
            })
        });
    }

    sendFollow() {
        const self = this;

        if (!self.character.hasTarget() || self.character.target.isDead())
            return;

        const ignores = [self.character.instance, self.character.target.instance];

        self.world.push(Packets.PushOpcode.Selectively, {
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: self.character.instance,
                targetId: self.character.target.instance
            }),
            ignores: ignores
        });
    }

    forEachAttacker(callback) {
        _.each(this.attackers, attacker => {
            callback(attacker);
        });
    }

    onForget(callback) {
        this.forgetCallback = callback;
    }

    targetOutOfBounds() {
        const self = this;

        if (!self.character.hasTarget() || !self.isMob())
            return;

        const spawnPoint = self.character.spawnLocation;
        const target = self.character.target;

        return Utils.getDistance(spawnPoint[0], spawnPoint[1], target.x, target.y) > self.character.spawnDistance;
    }

    getTime() {
        return new Date().getTime();
    }

    colliding(x, y) {
        return this.world.map.isColliding(x, y);
    }

    isPlayer() {
        return this.character.type === 'player';
    }

    isMob() {
        return this.character.type === 'mob';
    }

    isTargetMob() {
        return this.character.target.type === 'mob';
    }

    canAttackAoE(target) {
        return this.isMob() || target.type === 'mob' || (this.isPlayer() && target.type === 'player' && target.pvp && this.character.pvp);
    }
}

module.exports = Combat;
