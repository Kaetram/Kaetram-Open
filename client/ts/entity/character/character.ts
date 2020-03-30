/* global _, Modules, log */

import Entity from '../entity';
import Transition from '../../utils/transition';
import Animation from '../animation';
import Modules from '../../utils/modules';
import _ from 'underscore';

export default class Character extends Entity {
    nextGridX: number;
    nextGridY: number;
    prevGridX: number;
    prevGridY: number;
    orientation: any;
    hitPoints: number;
    maxHitPoints: number;
    mana: number;
    maxMana: number;
    healthBarVisible: boolean;
    healthBarTimeout: any;
    dead: boolean;
    following: boolean;
    attacking: boolean;
    interrupted: boolean;
    frozen: boolean;
    explosion: boolean;
    healing: boolean;
    path: any;
    target: any;
    attackers: { [key: string]: any };
    movement: Transition;
    attackAnimationSpeed: number;
    walkAnimationSpeed: number;
    movementSpeed: number;
    attackRange: number;
    criticalAnimation: Animation;
    terrorAnimation: Animation;
    stunAnimation: Animation;
    explosionAnimation: Animation;
    healingAnimation: Animation;
    newDestination: { x: any; y: any };
    step: number;
    beforeStepCallback: any;
    stepCallback: any;
    stopPathingCallback: any;
    startPathingCallback: any;
    destination: { gridX: any; gridY: any };
    adjacentTiles: { [key: string]: any };
    requestPathCallback: any;
    moveCallback: any;
    hitPointsCallback: any;
    maxHitPointsCallback: any;
    forced: boolean;
    teleporting: any;
    weapon: any;
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
        // Critical Hit Animation
        this.criticalAnimation = new Animation('atk_down', 10, 0, 48, 48);
        this.criticalAnimation.setSpeed(30);

        this.criticalAnimation.setCount(1, () => {
            this.critical = false;

            this.criticalAnimation.reset();
            this.criticalAnimation.count = 1;
        });

        // Terror Animation
        this.terrorAnimation = new Animation('explosion', 8, 0, 64, 64);
        this.terrorAnimation.setSpeed(50);

        this.terrorAnimation.setCount(1, () => {
            this.terror = false;

            this.terrorAnimation.reset();
            this.terrorAnimation.count = 1;
        });

        // Stunned Animation
        this.stunAnimation = new Animation('atk_down', 6, 0, 48, 48);
        this.stunAnimation.setSpeed(30);

        // Explosion Animation
        this.explosionAnimation = new Animation('explosion', 8, 0, 64, 64);
        this.explosionAnimation.setSpeed(50);

        this.explosionAnimation.setCount(1, () => {
            this.explosion = false;

            this.explosionAnimation.reset();
            this.explosionAnimation.count = 1;
        });

        // Healing Animation
        this.healingAnimation = new Animation('explosion', 8, 0, 48, 48);
        this.healingAnimation.setSpeed(50);

        this.healingAnimation.setCount(1, () => {
            this.healing = false;

            this.healingAnimation.reset();
            this.healingAnimation.count = 1;
        });
    }

    animate(animation, speed, count?, onEndCount?) {
        const o = ['atk', 'walk', 'idle'];
        const orientation = this.orientation;

        if (this.currentAnimation && this.currentAnimation.name === 'death')
            return;

        this.spriteFlipX = false;
        this.spriteFlipY = false;

        if (o.indexOf(animation) > -1) {
            animation +=
                '_' +
                (orientation === Modules.Orientation.Left
                    ? 'right'
                    : this.orientationToString(orientation));
            this.spriteFlipX = this.orientation === Modules.Orientation.Left;
        }

        this.setAnimation(animation, speed, count, onEndCount);
    }

    lookAt(character) {
        if (character.gridX > this.gridX)
            this.setOrientation(Modules.Orientation.Right);
        else if (character.gridX < this.gridX)
            this.setOrientation(Modules.Orientation.Left);
        else if (character.gridY > this.gridY)
            this.setOrientation(Modules.Orientation.Down);
        else if (character.gridY < this.gridY)
            this.setOrientation(Modules.Orientation.Up);

        this.idle();
    }

    follow(character) {
        this.following = true;

        this.setTarget(character);
        this.move(character.gridX, character.gridY);
    }

    followPosition(x, y) {
        this.following = true;

        this.move(x, y);
    }

    attack(attacker, character) {
        this.attacking = true;

        this.follow(character);
    }

    backOff() {
        this.attacking = false;
        this.following = false;

        this.removeTarget();
    }

    addAttacker(character) {
        if (this.hasAttacker(character)) return;

        this.attackers[character.instance] = character;
    }

    removeAttacker(character) {
        if (this.hasAttacker(character)) delete this.attackers[character.id];
    }

    hasAttacker(character) {
        if (this.attackers.size === 0) return false;

        return character.instance in this.attackers;
    }

    performAction(orientation, action) {
        this.setOrientation(orientation);

        switch (action) {
            case Modules.Actions.Idle:
                this.animate('idle', this.idleSpeed);
                break;

            case Modules.Actions.Orientate:
                this.animate('idle', this.idleSpeed);
                break;

            case Modules.Actions.Attack:
                this.animate('atk', this.attackAnimationSpeed, 1);
                break;

            case Modules.Actions.Walk:
                this.animate('walk', this.walkAnimationSpeed);
                break;
        }
    }

    idle(o?) {
        const orientation = o || this.orientation;

        this.performAction(orientation, Modules.Actions.Idle);
    }

    orientationToString(o) {
        const oM = Modules.Orientation;

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
        if (this.frozen) return;

        if (this.following) {
            this.following = false;
            this.target = null;
        }

        this.move(x, y, forced);
    }

    proceed(x, y) {
        this.newDestination = {
            x: x,
            y: y
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
        let stop = false;
        let x;
        let y;
        let path;

        if (this.step % 2 === 0 && this.secondStepCallback)
            this.secondStepCallback();

        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        if (!this.hasPath()) return;

        if (this.beforeStepCallback) this.beforeStepCallback();

        this.updateGridPosition();

        if (!this.interrupted) {
            if (this.hasNextStep()) {
                this.nextGridX = this.path[this.step + 1][0];
                this.nextGridY = this.path[this.step + 1][1];
            }

            if (this.stepCallback) this.stepCallback();

            if (this.changedPath()) {
                x = this.newDestination.x;
                y = this.newDestination.y;

                path = this.requestPathfinding(x, y);

                if (!path) return;

                this.newDestination = null;

                if (path.length < 2) stop = true;
                else this.followPath(path);
            } else if (this.hasNextStep()) {
                this.step++;
                this.updateMovement();
            } else stop = true;
        } else {
            stop = true;
            this.interrupted = false;
        }

        if (stop) {
            this.path = null;
            this.idle();

            if (this.stopPathingCallback)
                this.stopPathingCallback(this.gridX, this.gridY, this.forced);

            if (this.forced) this.forced = false;
        }
    }

    secondStepCallback() {
        throw new Error('Method not implemented.');
    }

    updateMovement() {
        const step = this.step;

        if (this.path[step][0] < this.path[step - 1][0])
            this.performAction(Modules.Orientation.Left, Modules.Actions.Walk);

        if (this.path[step][0] > this.path[step - 1][0])
            this.performAction(Modules.Orientation.Right, Modules.Actions.Walk);

        if (this.path[step][1] < this.path[step - 1][1])
            this.performAction(Modules.Orientation.Up, Modules.Actions.Walk);

        if (this.path[step][1] > this.path[step - 1][1])
            this.performAction(Modules.Orientation.Down, Modules.Actions.Walk);
    }

    /**
     * This is to ensure the player does not click on
     * himself or somehow into another dimension
     */
    followPath(path) {
        if (!path || path.length < 2) return;

        this.path = path;
        this.step = 0;

        if (this.following) path.pop();

        if (this.startPathingCallback) this.startPathingCallback(path);

        this.nextStep();
    }

    move(x, y, forced?) {
        this.destination = {
            gridX: x,
            gridY: y
        };

        this.adjacentTiles = {};

        if (this.hasPath() && !forced) this.proceed(x, y);
        else this.followPath(this.requestPathfinding(x, y));
    }

    stop(force) {
        if (!force) this.interrupted = true;
        else if (this.hasPath()) {
            this.path = null;
            this.newDestination = null;
            this.movement = new Transition();
            this.performAction(this.orientation, Modules.Actions.Idle);
            this.nextGridX = this.gridX;
            this.nextGridY = this.gridY;
        }
    }

    hasEffect() {
        return (
            this.critical ||
            this.stunned ||
            this.terror ||
            this.explosion ||
            this.healing
        );
    }

    getEffectAnimation() {
        if (this.critical) return this.criticalAnimation;

        if (this.stunned) return this.stunAnimation;

        if (this.terror) return this.terrorAnimation;

        if (this.explosion) return this.explosionAnimation;

        if (this.healing) return this.healingAnimation;
    }

    getActiveEffect() {
        if (this.critical) return 'criticaleffect';

        if (this.stunned) return 'stuneffect';

        if (this.terror) return 'explosion-terror';

        if (this.explosion) return 'explosion-fireball';

        if (this.healing) return 'explosion-heal';
    }

    /**
     * TRIGGERED!!!!
     */
    triggerHealthBar() {
        this.healthBarVisible = true;

        if (this.healthBarTimeout) clearTimeout(this.healthBarTimeout);

        this.healthBarTimeout = setTimeout(() => {
            this.healthBarVisible = false;
        }, 7000);
    }

    clearHealthBar() {
        this.healthBarVisible = false;
        clearTimeout(this.healthBarTimeout);
        this.healthBarTimeout = null;
    }

    requestPathfinding(x, y) {
        if (this.requestPathCallback) return this.requestPathCallback(x, y);
    }

    updateGridPosition() {
        this.setGridPosition(this.path[this.step][0], this.path[this.step][1]);
    }

    isMoving() {
        return (
            this.currentAnimation.name === 'walk' ||
            this.x % 2 !== 0 ||
            this.y % 2 !== 0
        );
    }

    forEachAttacker(callback) {
        _.each(this.attackers, function(attacker) {
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
        return this.path.length - 1 > this.step;
    }

    changedPath() {
        return !!this.newDestination;
    }

    removeTarget() {
        if (!this.target) return;

        this.target = null;
    }

    forget() {
        this.attackers = {};
    }

    moved() {
        this.loadDirty();

        if (this.moveCallback) this.moveCallback();
    }

    setTarget(target) {
        if (!target) {
            this.removeTarget();
            return;
        }

        if (this.target && this.target.id === target.id) return;

        if (this.hasTarget()) this.removeTarget();

        this.target = target;
    }

    /**
     * All we are doing is mimicking the `setTarget` entity
     * parameter. But we are throwing in an extra.
     */
    setObjectTarget(x, y) {
        this.setTarget({
            id: x + '-' + y,
            type: 'object',
            gridX: x,
            gridY: y
        });
    }

    setHitPoints(hitPoints) {
        if (hitPoints < 0) hitPoints = 0;

        this.hitPoints = hitPoints;

        if (this.hitPointsCallback) this.hitPointsCallback(this.hitPoints);
    }

    setMaxHitPoints(maxHitPoints) {
        this.maxHitPoints = maxHitPoints;

        if (this.maxHitPointsCallback)
            this.maxHitPointsCallback(this.maxHitPoints);
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
