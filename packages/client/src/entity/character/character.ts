import _ from 'lodash';

import Modules from '../../utils/modules';
import Transition from '../../utils/transition';
import Animation from '../animation';
import Weapon from './player/equipment/weapon';
import Entity from '../entity';

export default class Character extends Entity {
    dead: boolean;
    teleporting: boolean;
    weapon: Weapon;
    nextGridX: number;
    nextGridY: number;
    prevGridX: number;
    prevGridY: number;
    hitPoints: number;
    maxHitPoints: number;
    mana: number;
    maxMana: number;
    healthBarVisible: boolean;
    healthBarTimeout: number;
    following: boolean;
    attacking: boolean;
    interrupted: boolean;
    critical: boolean;
    frozen: boolean;
    stunned: boolean;
    explosion: boolean;
    healing: boolean;
    path: number[][];
    target: Entity;
    attackers: { [id: string]: Entity };
    movement: Transition;
    attackAnimationSpeed: number;
    walkAnimationSpeed: number;
    movementSpeed: number;
    attackRange: number;
    criticalAnimation: Animation;
    terrorAnimation: Animation;
    terror: boolean;
    stunAnimation: Animation;
    explosionAnimation: Animation;
    healingAnimation: Animation;
    spriteFlipX: boolean;
    spriteFlipY: boolean;
    gridX: number;
    gridY: number;
    newDestination: Pos;
    step: number;
    secondStepCallback: () => void;
    beforeStepCallback: () => void;
    stepCallback: () => void;
    stopPathingCallback: (gridX: number, gridY: number, forced?: boolean) => void;
    startPathingCallback: (path: number[][]) => void;
    destination: { gridX: number; gridY: number };
    adjacentTiles: { [key: string]: unknown };
    requestPathCallback: (x: number, y: number) => number[][];
    x: number;
    y: number;
    moveCallback: () => void;
    hitPointsCallback: (hitPoints: number) => void;
    maxHitPointsCallback: (maxHitPoints: number) => void;
    instance: string;
    type: string;
    forced: boolean;

    constructor(id: string, kind: string) {
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

    loadGlobals(): void {
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

    animate(animation: string, speed: number, count?: number, onEndCount?: () => void): void {
        const o = ['atk', 'walk', 'idle'],
            orientation = this.orientation;

        if (this.currentAnimation && this.currentAnimation.name === 'death') return;

        this.spriteFlipX = false;
        this.spriteFlipY = false;

        if (o.indexOf(animation) > -1) {
            animation += `_${
                orientation === Modules.Orientation.Left
                    ? 'right'
                    : this.orientationToString(orientation)
            }`;
            this.spriteFlipX = this.orientation === Modules.Orientation.Left;
        }

        this.setAnimation(animation, speed, count, onEndCount);
    }

    follow(entity: Entity): void {
        this.following = true;

        this.setTarget(entity);
        this.move(entity.gridX, entity.gridY);
    }

    followPosition(x: number, y: number): void {
        this.following = true;

        this.move(x, y);
    }

    attack(attacker: Entity, character: Character): void {
        this.attacking = true;

        this.follow(character);
    }

    backOff(): void {
        this.attacking = false;
        this.following = false;

        this.removeTarget();
    }

    addAttacker(character: Character): void {
        if (this.hasAttacker(character)) return;

        this.attackers[character.instance] = character;
    }

    removeAttacker(character: Character): void {
        if (this.hasAttacker(character)) delete this.attackers[character.id];
    }

    hasAttacker(character: Character): boolean {
        if (!this.attackers[0]) return false;

        return character.instance in this.attackers;
    }

    performAction(orientation: number, action: number): void {
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

    idle(o?: number): void {
        const orientation = o ? o : this.orientation;

        this.performAction(orientation, Modules.Actions.Idle);
    }

    orientationToString(o: number): string {
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

    lookAt(character: Entity): void {
        if (character.gridX > this.gridX) this.setOrientation(Modules.Orientation.Right);
        else if (character.gridX < this.gridX) this.setOrientation(Modules.Orientation.Left);
        else if (character.gridY > this.gridY) this.setOrientation(Modules.Orientation.Down);
        else if (character.gridY < this.gridY) this.setOrientation(Modules.Orientation.Up);

        this.idle();
    }

    go(x: number, y: number, forced?: boolean): void {
        if (this.frozen) return;

        if (this.following) {
            this.following = false;
            this.target = null;
        }

        this.move(x, y, forced);
    }

    proceed(x: number, y: number): void {
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
    nextStep(): void {
        let stop = false,
            x: number,
            y: number,
            path: number[][];

        if (this.step % 2 === 0 && this.secondStepCallback) this.secondStepCallback();

        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        if (!this.hasPath()) return;

        this.beforeStepCallback?.();

        this.updateGridPosition();

        if (!this.interrupted) {
            if (this.hasNextStep()) {
                this.nextGridX = this.path[this.step + 1][0];
                this.nextGridY = this.path[this.step + 1][1];
            }

            this.stepCallback?.();

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

            this.forced &&= false;
        }
    }

    updateMovement(): void {
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

    followPath(path: number[][]): void {
        /**
         * This is to ensure the player does not click on
         * himthis or somehow into another dimension
         */

        if (!path || path.length < 2) return;

        this.path = path;
        this.step = 0;

        if (this.following) path.pop();

        this.startPathingCallback?.(path);

        this.nextStep();
    }

    move(x: number, y: number, forced?: boolean): void {
        this.destination = {
            gridX: x,
            gridY: y
        };

        this.adjacentTiles = {};

        if (this.hasPath() && !forced) this.proceed(x, y);
        else this.followPath(this.requestPathfinding(x, y));
    }

    stop(force?: boolean): void {
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

    hasEffect(): boolean {
        return this.critical || this.stunned || this.terror || this.explosion || this.healing;
    }

    getEffectAnimation(): Animation {
        if (this.critical) return this.criticalAnimation;

        if (this.stunned) return this.stunAnimation;

        if (this.terror) return this.terrorAnimation;

        if (this.explosion) return this.explosionAnimation;

        if (this.healing) return this.healingAnimation;
    }

    getActiveEffect(): string {
        if (this.critical) return 'criticaleffect';

        if (this.stunned) return 'stuneffect';

        if (this.terror) return 'explosion-terror';

        if (this.explosion) return 'explosion-fireball';

        if (this.healing) return 'explosion-heal';
    }

    /**
     * TRIGGERED!!!!
     */
    triggerHealthBar(): void {
        this.healthBarVisible = true;

        if (this.healthBarTimeout) clearTimeout(this.healthBarTimeout);

        this.healthBarTimeout = window.setTimeout(() => {
            this.healthBarVisible = false;
        }, 7000);
    }

    clearHealthBar(): void {
        this.healthBarVisible = false;
        clearTimeout(this.healthBarTimeout);
        this.healthBarTimeout = null;
    }

    requestPathfinding(x: number, y: number): number[][] {
        if (this.requestPathCallback) return this.requestPathCallback(x, y);
    }

    updateGridPosition(): void {
        if (!this.path || this.path.length < 1) return;

        this.setGridPosition(this.path[this.step][0], this.path[this.step][1]);
    }

    isMoving(): boolean {
        return this.currentAnimation.name === 'walk' || this.x % 2 !== 0 || this.y % 2 !== 0;
    }

    forEachAttacker(callback: (attacker: Character) => void): void {
        _.each(this.attackers, (attacker) => {
            callback(attacker as Character);
        });
    }

    isAttacked(): boolean {
        return Object.keys(this.attackers).length > 0;
    }

    hasWeapon(): boolean {
        return false;
    }

    hasShadow(): boolean {
        return true;
    }

    hasTarget(): boolean {
        return !(this.target === null);
    }

    hasPath(): boolean {
        return this.path !== null;
    }

    hasNextStep(): boolean {
        return this.path && this.path.length - 1 > this.step;
    }

    changedPath(): boolean {
        return !!this.newDestination;
    }

    removeTarget(): void {
        if (!this.target) return;

        this.target = null;
    }

    forget(): void {
        this.attackers = {};
    }

    moved(): void {
        this.loadDirty();

        this.moveCallback?.();
    }

    setTarget(target: Entity): void {
        if (!target) {
            this.removeTarget();
            return;
        }

        if (this.target && this.target.id === target.id) return;

        if (this.hasTarget()) this.removeTarget();

        this.target = target;
    }

    setObjectTarget(x: number, y: number): void {
        /**
         * All we are doing is mimicking the `setTarget` entity
         * parameter. But we are throwing in an extra.
         */

        const character = new Character(`${x}-${y}`, 'object');
        character.setGridPosition(x, y);

        this.setTarget(character);
    }

    setHitPoints(hitPoints: number): void {
        if (hitPoints < 0) hitPoints = 0;

        this.hitPoints = hitPoints;

        this.hitPointsCallback?.(this.hitPoints);
    }

    setMaxHitPoints(maxHitPoints: number): void {
        this.maxHitPoints = maxHitPoints;

        this.maxHitPointsCallback?.(this.maxHitPoints);
    }

    setOrientation(orientation: number): void {
        this.orientation = orientation;
    }

    onRequestPath(callback: (x: number, y: number) => number[][]): void {
        this.requestPathCallback = callback;
    }

    onStartPathing(callback: (path: number[][]) => void): void {
        this.startPathingCallback = callback;
    }

    onStopPathing(callback: (gridX: number, gridY: number) => void): void {
        this.stopPathingCallback = callback;
    }

    onBeforeStep(callback: () => void): void {
        this.beforeStepCallback = callback;
    }

    onStep(callback: () => void): void {
        this.stepCallback = callback;
    }

    onSecondStep(callback: () => void): void {
        this.secondStepCallback = callback;
    }

    onMove(callback: () => void): void {
        this.moveCallback = callback;
    }

    onHitPoints(callback: () => void): void {
        this.hitPointsCallback = callback;
    }

    onMaxHitPoints(callback: () => void): void {
        this.maxHitPointsCallback = callback;
    }
}
