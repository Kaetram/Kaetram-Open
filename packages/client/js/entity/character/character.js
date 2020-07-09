import _ from 'underscore';
import Entity from '../entity';
import Transition from '../../utils/transition';
import Animation from '../animation';
import Modules from '../../utils/modules';

export default class Character extends Entity {
    constructor(id, kind) {
        super(id, kind);

        this.nextGridX = -1;
        this.nextGridY = -1;
        this.prevGridX = -1;
        this.prevGridY = -1;

        this.orientation = Modules.Orientation.Down;

        this.hitPoints = -1;
        this.maxHitPoints = -1;
        this.mana = -1;
        this.maxMana = -1;

        this.healthBarVisible = false;
        this.healthBarTimeout = false;

        this.dead = false;
        this.following = false;
        this.attacking = false;
        this.interrupted = false;

        this.critical = false;
        this.frozen = false;
        this.stunned = false;
        this.explosion = false;
        this.healing = false;

        this.path = null;
        this.target = null;

        this.attackers = {};

        this.movement = new Transition();

        this.attackAnimationSpeed = 50;
        this.walkAnimationSpeed = 100;
        this.movementSpeed = -1;

        this.attackRange = 1;

        this.loadGlobals();
    }

    loadGlobals() {
        var self = this;

        // Critical Hit Animation
        self.criticalAnimation = new Animation('atk_down', 10, 0, 48, 48);
        self.criticalAnimation.setSpeed(30);

        self.criticalAnimation.setCount(1, function() {
            self.critical = false;

            self.criticalAnimation.reset();
            self.criticalAnimation.count = 1;
        });

        // Terror Animation
        self.terrorAnimation = new Animation('explosion', 8, 0, 64, 64);
        self.terrorAnimation.setSpeed(50);

        self.terrorAnimation.setCount(1, function() {
            self.terror = false;

            self.terrorAnimation.reset();
            self.terrorAnimation.count = 1;
        });

        // Stunned Animation
        self.stunAnimation = new Animation('atk_down', 6, 0, 48, 48);
        self.stunAnimation.setSpeed(30);

        // Explosion Animation
        self.explosionAnimation = new Animation('explosion', 8, 0, 64, 64);
        self.explosionAnimation.setSpeed(50);

        self.explosionAnimation.setCount(1, function() {
            self.explosion = false;

            self.explosionAnimation.reset();
            self.explosionAnimation.count = 1;
        });

        // Healing Animation
        self.healingAnimation = new Animation('explosion', 8, 0, 48, 48);
        self.healingAnimation.setSpeed(50);

        self.healingAnimation.setCount(1, function() {
            self.healing = false;

            self.healingAnimation.reset();
            self.healingAnimation.count = 1;
        });
    }

    animate(animation, speed, count, onEndCount) {
        var self = this,
            o = ['atk', 'walk', 'idle'],
            orientation = self.orientation;

        if (self.currentAnimation && self.currentAnimation.name === 'death') return;

        self.spriteFlipX = false;
        self.spriteFlipY = false;

        if (o.indexOf(animation) > -1) {
            animation +=
                '_' +
                (orientation === Modules.Orientation.Left
                    ? 'right'
                    : self.orientationToString(orientation));
            self.spriteFlipX = self.orientation === Modules.Orientation.Left;
        }

        self.setAnimation(animation, speed, count, onEndCount);
    }

    lookAt(character) {
        var self = this;

        if (character.gridX > self.gridX) self.setOrientation(Modules.Orientation.Right);
        else if (character.gridX < self.gridX) self.setOrientation(Modules.Orientation.Left);
        else if (character.gridY > self.gridY) self.setOrientation(Modules.Orientation.Down);
        else if (character.gridY < self.gridY) self.setOrientation(Modules.Orientation.Up);

        self.idle();
    }

    follow(character) {
        var self = this;

        self.following = true;

        self.setTarget(character);
        self.move(character.gridX, character.gridY);
    }

    followPosition(x, y) {
        var self = this;

        self.following = true;

        self.move(x, y);
    }

    attack(attacker, character) {
        var self = this;

        self.attacking = true;

        self.follow(character);
    }

    backOff() {
        var self = this;

        self.attacking = false;
        self.following = false;

        self.removeTarget();
    }

    addAttacker(character) {
        var self = this;

        if (self.hasAttacker(character)) return;

        self.attackers[character.instance] = character;
    }

    removeAttacker(character) {
        var self = this;

        if (self.hasAttacker(character)) delete self.attackers[character.id];
    }

    hasAttacker(character) {
        var self = this;

        if (self.attackers.size === 0) return false;

        return character.instance in self.attackers;
    }

    performAction(orientation, action) {
        var self = this;

        self.setOrientation(orientation);

        switch (action) {
            case Modules.Actions.Idle:
                self.animate('idle', self.idleSpeed);
                break;

            case Modules.Actions.Orientate:
                self.animate('idle', self.idleSpeed);
                break;

            case Modules.Actions.Attack:
                self.animate('atk', self.attackAnimationSpeed, 1);
                break;

            case Modules.Actions.Walk:
                self.animate('walk', self.walkAnimationSpeed);
                break;
        }
    }

    idle(o) {
        var self = this,
            orientation = o ? o : self.orientation;

        self.performAction(orientation, Modules.Actions.Idle);
    }

    orientationToString(o) {
        var oM = Modules.Orientation;

        switch (o) {
            case oM.Left:
                return 'left';

            case oM.Right:
                return 'right';

            case oM.Up:
                return 'up';

            case oM.Down:
                return 'down';
        }
    }

    go(x, y, forced) {
        var self = this;

        if (self.frozen) return;

        if (self.following) {
            self.following = false;
            self.target = null;
        }

        self.move(x, y, forced);
    }

    proceed(x, y) {
        this.newDestination = {
            x: x,
            y: y,
        };
    }

    /**
     * We can have the movement remain client sided because
     * the server side will be responsible for determining
     * whether or not the player should have reached the
     * location and ban all hackers. That and the fact
     * the movement speed is constantly updated to avoid
     * hacks previously present in BQ.
     */

    nextStep() {
        var self = this,
            stop = false,
            x,
            y,
            path;

        if (self.step % 2 === 0 && self.secondStepCallback) self.secondStepCallback();

        self.prevGridX = self.gridX;
        self.prevGridY = self.gridY;

        if (!self.hasPath()) return;

        if (self.beforeStepCallback) self.beforeStepCallback();

        self.updateGridPosition();

        if (!self.interrupted) {
            if (self.hasNextStep()) {
                self.nextGridX = self.path[self.step + 1][0];
                self.nextGridY = self.path[self.step + 1][1];
            }

            if (self.stepCallback) self.stepCallback();

            if (self.changedPath()) {
                x = self.newDestination.x;
                y = self.newDestination.y;

                path = self.requestPathfinding(x, y);

                if (!path) return;

                self.newDestination = null;

                if (path.length < 2) stop = true;
                else self.followPath(path);
            } else if (self.hasNextStep()) {
                self.step++;
                self.updateMovement();
            } else stop = true;
        } else {
            stop = true;
            self.interrupted = false;
        }

        if (stop) {
            self.path = null;
            self.idle();

            if (self.stopPathingCallback)
                self.stopPathingCallback(self.gridX, self.gridY, self.forced);

            if (self.forced) self.forced = false;
        }
    }

    updateMovement() {
        var self = this,
            step = self.step;

        if (self.path[step][0] < self.path[step - 1][0])
            self.performAction(Modules.Orientation.Left, Modules.Actions.Walk);

        if (self.path[step][0] > self.path[step - 1][0])
            self.performAction(Modules.Orientation.Right, Modules.Actions.Walk);

        if (self.path[step][1] < self.path[step - 1][1])
            self.performAction(Modules.Orientation.Up, Modules.Actions.Walk);

        if (self.path[step][1] > self.path[step - 1][1])
            self.performAction(Modules.Orientation.Down, Modules.Actions.Walk);
    }

    followPath(path) {
        var self = this;

        /**
         * This is to ensure the player does not click on
         * himself or somehow into another dimension
         */

        if (!path || path.length < 2) return;

        self.path = path;
        self.step = 0;

        if (self.following) path.pop();

        if (self.startPathingCallback) self.startPathingCallback(path);

        self.nextStep();
    }

    move(x, y, forced) {
        var self = this;

        self.destination = {
            gridX: x,
            gridY: y,
        };

        self.adjacentTiles = {};

        if (self.hasPath() && !forced) self.proceed(x, y);
        else self.followPath(self.requestPathfinding(x, y));
    }

    stop(force) {
        var self = this;

        if (!force) self.interrupted = true;
        else if (self.hasPath()) {
            self.path = null;
            self.newDestination = null;
            self.movement = new Transition();
            self.performAction(self.orientation, Modules.Actions.Idle);
            self.nextGridX = self.gridX;
            self.nextGridY = self.gridY;
        }
    }

    hasEffect() {
        return this.critical || this.stunned || this.terror || this.explosion || this.healing;
    }

    getEffectAnimation() {
        var self = this;

        if (self.critical) return self.criticalAnimation;

        if (self.stunned) return self.stunAnimation;

        if (self.terror) return self.terrorAnimation;

        if (self.explosion) return self.explosionAnimation;

        if (self.healing) return self.healingAnimation;
    }

    getActiveEffect() {
        var self = this;

        if (self.critical) return 'criticaleffect';

        if (self.stunned) return 'stuneffect';

        if (self.terror) return 'explosion-terror';

        if (self.explosion) return 'explosion-fireball';

        if (self.healing) return 'explosion-heal';
    }

    /**
     * TRIGGERED!!!!
     */

    triggerHealthBar() {
        var self = this;

        self.healthBarVisible = true;

        if (self.healthBarTimeout) clearTimeout(self.healthBarTimeout);

        self.healthBarTimeout = setTimeout(function() {
            self.healthBarVisible = false;
        }, 7000);
    }

    clearHealthBar() {
        var self = this;

        self.healthBarVisible = false;
        clearTimeout(self.healthBarTimeout);
        self.healthBarTimeout = null;
    }

    requestPathfinding(x, y) {
        var self = this;

        if (self.requestPathCallback) return self.requestPathCallback(x, y);
    }

    updateGridPosition() {
        var self = this;

        if (!self.path || self.path.length < 1) return;

        self.setGridPosition(self.path[self.step][0], self.path[self.step][1]);
    }

    isMoving() {
        return this.currentAnimation.name === 'walk' || this.x % 2 !== 0 || this.y % 2 !== 0;
    }

    forEachAttacker(callback) {
        var self = this;

        _.each(self.attackers, function(attacker) {
            callback(attacker);
        });
    }

    isAttacked() {
        return Object.keys(this.attackers).length > 0;
    }

    hasWeapon() {
        return false;
    }

    hasShadow() {
        return true;
    }

    hasTarget() {
        return !(this.target === null);
    }

    hasPath() {
        return this.path !== null;
    }

    hasNextStep() {
        return this.path && this.path.length - 1 > this.step;
    }

    changedPath() {
        return !!this.newDestination;
    }

    removeTarget() {
        var self = this;

        if (!self.target) return;

        self.target = null;
    }

    forget() {
        this.attackers = {};
    }

    moved() {
        var self = this;

        self.loadDirty();

        if (self.moveCallback) self.moveCallback();
    }

    setTarget(target) {
        var self = this;

        if (!target) {
            self.removeTarget();
            return;
        }

        if (self.target && self.target.id === target.id) return;

        if (self.hasTarget()) self.removeTarget();

        self.target = target;
    }

    setObjectTarget(x, y) {
        var self = this;

        /**
         * All we are doing is mimicking the `setTarget` entity
         * parameter. But we are throwing in an extra.
         */

        self.setTarget({
            id: x + '-' + y,
            type: 'object',
            gridX: x,
            gridY: y,
        });
    }

    setHitPoints(hitPoints) {
        var self = this;

        if (hitPoints < 0) hitPoints = 0;

        self.hitPoints = hitPoints;

        if (self.hitPointsCallback) self.hitPointsCallback(self.hitPoints);
    }

    setMaxHitPoints(maxHitPoints) {
        var self = this;

        self.maxHitPoints = maxHitPoints;

        if (self.maxHitPointsCallback) self.maxHitPointsCallback(self.maxHitPoints);
    }

    setOrientation(orientation) {
        this.orientation = orientation;
    }

    onRequestPath(callback) {
        this.requestPathCallback = callback;
    }

    onStartPathing(callback) {
        this.startPathingCallback = callback;
    }

    onStopPathing(callback) {
        this.stopPathingCallback = callback;
    }

    onBeforeStep(callback) {
        this.beforeStepCallback = callback;
    }

    onStep(callback) {
        this.stepCallback = callback;
    }

    onSecondStep(callback) {
        this.secondStepCallback = callback;
    }

    onMove(callback) {
        this.moveCallback = callback;
    }

    onHitPoints(callback) {
        this.hitPointsCallback = callback;
    }

    onMaxHitPoints(callback) {
        this.maxHitPointsCallback = callback;
    }
}
