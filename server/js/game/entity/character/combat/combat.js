/* global module */

let _ = require('underscore'),
    Hit = require('./hit'),
    CombatQueue = require('./combatqueue'),
    Utils = require('../../../../util/utils'),
    Formulas = require('../../../../util/formulas'),
    Modules = require('../../../../util/modules'),
    Messages = require('../../../../network/messages'),
    Character = require('../character'),
    Packets = require('../../../../network/packets');

class Combat {

    constructor(character) {
        let self = this;

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
        let self = this;

        self.start();

        self.character.setTarget(attacker);
        self.addAttacker(attacker);

        attacker.combat.addAttacker(self.character); //For mobs attacking players..

        self.attack(attacker);
    }

    start() {
        let self = this;

        if (self.started)
            return;

        if (self.character.type === 'player')
            log.debug('Starting player attack.');

        self.lastAction = new Date().getTime();

        self.attackLoop = setInterval(() => { self.parseAttack(); }, self.character.attackRate);

        self.followLoop = setInterval(() => { self.parseFollow(); }, 400);

        self.checkLoop = setInterval(() => { self.parseCheck(); }, 1000);

        self.started = true;
    }

    stop() {
        let self = this;

        if (!self.started)
            return;

        if (self.character.type === 'player')
            log.debug('Stopping player attack.');

        clearInterval(self.attackLoop);
        clearInterval(self.followLoop);
        clearInterval(self.checkLoop);

        self.attackLoop = null;
        self.followLoop = null;
        self.checkLoop = null;

        self.started = false;
    }

    parseAttack() {
        let self = this;

        if (!self.world || !self.queue || self.character.stunned)
            return;

        if (self.character.hasTarget() && self.inProximity()) {

            if (self.character.target && !self.character.target.isDead())
                self.attack(self.character.target);

            if (self.queue.hasQueue())
                self.hit(self.character, self.character.target, self.queue.getHit());

            self.sync();

            self.lastAction = self.getTime();
        } else
            self.queue.clear();
    }

    parseFollow() {
        let self = this;

        if (self.character.frozen || self.character.stunned)
            return;

        if (self.isMob()) {

            if (!self.character.isRanged())
                self.sendFollow();

            if (self.isAttacked() || self.character.hasTarget())
                self.lastAction = self.getTime();

            if (self.onSameTile()) {
                let newPosition = self.getNewPosition();

                self.move(self.character, newPosition.x, newPosition.y);
            }

            if (self.character.hasTarget() && !self.inProximity()) {
                let attacker = self.getClosestAttacker();

                if (attacker)
                    self.follow(self.character, attacker);

            }
        }

        if (self.isPlayer()) {
            if (!self.character.hasTarget())
                return;

            if (self.character.target.type !== 'player')
                return;

            if (!self.inProximity())
                self.follow(self.character, self.character.target);
        }
    }

    parseCheck() {
        let self = this;

        if (self.getTime() - self.lastAction > self.lastActionThreshold) {

            self.stop();

            self.forget();

        }
    }

    attack(target) {
        let self = this,
            hit;

        if (self.isPlayer())
            hit = self.character.getHit(target);
        else
            hit = new Hit(Modules.Hits.Damage, Formulas.getDamage(self.character, target));

        if (!hit)
            return;

        self.queue.add(hit);
    }

    sync() {
        let self = this;

        if (self.character.type !== 'mob')
            return;

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.character.region,
            message: new Messages.Combat(Packets.CombatOpcode.Sync, {
                attackerId: self.character.instance, //irrelevant
                targetId: self.character.instance, //can be the same since we're acting on an entity.
                x: self.character.x,
                y: self.character.y
            })
        })
    }

    dealAoE(radius, hasTerror) {
        let self = this;

        /**
         * TODO - Find a way to implement special effects without hardcoding them.
         */

        if (!self.world)
            return;

        let entities = self.world.getGrids().getSurroundingEntities(self.character, radius);

        _.each(entities, (entity) => {

            let hitData = new Hit(Modules.Hits.Damage, Formulas.getAoEDamage(self.character, entity)).getData();

            hitData.isAoE = true;
            hitData.hasTerror = hasTerror;

            self.hit(self.character, entity, hitData);

        });

    }

    forceAttack() {
        let self = this;

        if (!self.character.target || !self.inProximity())
            return;

        //self.stop();
        self.start();

        self.attackCount(2, self.character.target);
        self.hit(self.character, self.character.target, self.queue.getHit());
    }

    attackCount(count, target) {
        let self = this;

        for (let i = 0; i < count; i++)
            self.attack(target);
    }

    addAttacker(character) {
        let self = this;

        if (self.hasAttacker(character))
            return;

        self.attackers[character.instance] = character;
    }

    removeAttacker(character) {
        let self = this;

        if (self.hasAttacker(character))
            delete self.attackers[character.instance];

        if (!self.isAttacked())
            self.sendToSpawn();
    }

    sendToSpawn() {
        let self = this;

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
        let self = this;

        if (!self.isAttacked())
            return;

        return character.instance in self.attackers;
    }

    onSameTile() {
        let self = this;

        if (!self.character.target || self.character.type !== 'mob')
            return;

        return self.character.x === self.character.target.x && self.character.y === self.character.target.y;
    }

    isAttacked() {
        return this.attackers && Object.keys(this.attackers).length > 0;
    }

    getNewPosition() {
        let self = this,
            position = {
                x: self.character.x,
                y: self.character.y
            };

        let random = Utils.randomInt(0, 3);

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
        let self = this;

        if (!self.character.target)
            return;

        let targetDistance = self.character.getDistance(self.character.target),
            range = self.character.attackRange;

        if (self.character.isRanged())
            return targetDistance <= range;

        return self.character.isNonDiagonal(self.character.target);
    }

    getClosestAttacker() {
        let self = this,
            closest = null,
            lowestDistance = 100;

        self.forEachAttacker((attacker) => {
            let distance = self.character.getDistance(attacker);

            if (distance < lowestDistance)
                closest = attacker;
        });

        return closest;
    }

    setWorld(world) {
        let self = this;

        if (!self.world)
            self.world = world;
    }

    forget() {
        let self = this;

        self.attackers = {};
        self.character.removeTarget();

        if (self.forgetCallback)
            self.forgetCallback();
    }

    move(character, x, y) {
        let self = this;

        /**
         * The server and mob types can parse the mob movement
         */

        if (character.type !== 'mob')
            return;

        character.setPosition(x, y);
    }

    hit(character, target, hitInfo) {
        let self = this,
            time = self.getTime();

        if (!self.canHit())
            return;

        if (character.isRanged() || hitInfo.isRanged) {

            let projectile = self.world.createProjectile([character, target], hitInfo);

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
        let self = this;

        if (!self.character.hasTarget() || self.character.target.isDead())
            return;

        //let ignores = [self.character.instance, self.character.target.instance];

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: self.character.instance,
                targetId: self.character.target.instance
            })
        });

    }

    forEachAttacker(callback) {
        _.each(this.attackers, (attacker) => {
            callback(attacker);
        });
    }

    onForget(callback) {
        this.forgetCallback = callback;
    }

    targetOutOfBounds() {
        let self = this;

        if (!self.character.hasTarget() || !self.isMob())
            return;

        let spawnPoint = self.character.spawnLocation,
            target = self.character.target;

        return Utils.getDistance(spawnPoint[0], spawnPoint[1], target.x, target.y) > self.character.spawnDistance;
    }

    getTime() {
        return new Date().getTime();
    }

    colliding(x, y) {
        return this.world.map.isColliding(x, y);
    }

    isPlayer() {
        return this.character.type === 'player'
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

    canHit() {
        let self = this,
            currentTime = new Date().getTime(),
            diff = currentTime - self.lastHit;

        // 5 millisecond margin of error.
        return diff + 5 > self.character.attackRate;
    }

}

module.exports = Combat;
