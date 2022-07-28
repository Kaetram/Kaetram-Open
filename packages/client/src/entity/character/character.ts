import _ from 'lodash';

import { Modules } from '@kaetram/common/network';

import Transition from '../../utils/transition';
import Animation from '../animation';
import Entity from '../entity';
import EntityHandler from '../entityhandler';

type HitPointsCallback = (hitPoints: number, maxHitPoints: number, decrease?: boolean) => void;

export default class Character extends Entity {
    public healthBarVisible = false;

    private following = false;
    private interrupted = false;
    public explosion = false;
    public healing = false;

    public path: number[][] | null = null;
    public target: Entity | null = null;

    private attackers: { [id: string]: Character } = {};

    public movement = new Transition();

    private readonly attackAnimationSpeed = 50;
    private readonly walkAnimationSpeed = 100;

    public override nextGridX = -1;
    public override nextGridY = -1;
    public override movementSpeed = -1;
    public override attackRange = 1;
    public override critical = false;
    public override frozen = false;
    public override stunned = false;
    public override dead = false;

    public override orientation = Modules.Orientation.Down;

    private newDestination!: Position | null;
    private step!: number;
    private healthBarTimeout!: number | null;

    private criticalAnimation: Animation = new Animation('atk_down', 10, 0, 48, 48);
    private terrorAnimation: Animation = new Animation('explosion', 8, 0, 64, 64);
    private stunAnimation: Animation = new Animation('atk_down', 6, 0, 48, 48);
    private explosionAnimation: Animation = new Animation('explosion', 8, 0, 64, 64);
    private healingAnimation: Animation = new Animation('explosion', 8, 0, 64, 64);

    private secondStepCallback?(): void;
    private beforeStepCallback?(): void;
    private stepCallback?(): void;
    private stopPathingCallback?(gridX: number, gridY: number, forced: boolean): void;
    private startPathingCallback?(path: number[][]): void;
    private moveCallback?(): void;
    private requestPathCallback?(x: number, y: number): number[][] | null;
    private hitPointsCallback?: HitPointsCallback;

    public forced!: boolean;

    public handler = new EntityHandler(this);

    public constructor(instance: string, type: Modules.EntityType) {
        super(instance, type);

        this.loadAnimations();
    }

    /**
     * Loads animations used for special effects.
     */

    private loadAnimations(): void {
        // Critical Hit Animation
        this.criticalAnimation.setSpeed(30);
        this.criticalAnimation.setCount(1, () => {
            this.critical = false;

            this.criticalAnimation.reset();
            this.criticalAnimation.count = 1;
        });

        // Terror Animation
        this.terrorAnimation.setSpeed(50);
        this.terrorAnimation.setCount(1, () => {
            this.terror = false;

            this.terrorAnimation.reset();
            this.terrorAnimation.count = 1;
        });

        // Stunned Animation
        this.stunAnimation.setSpeed(30);

        // Explosion Animation
        this.explosionAnimation.setSpeed(50);
        this.explosionAnimation.setCount(1, () => {
            this.explosion = false;

            this.explosionAnimation.reset();
            this.explosionAnimation.count = 1;
        });

        // Healing Animation
        this.healingAnimation.setSpeed(50);

        this.healingAnimation.setCount(1, () => {
            this.healing = false;

            this.healingAnimation.reset();
            this.healingAnimation.count = 1;
        });
    }

    public animate(animation: string, speed: number, count = 1, onEndCount?: () => void): void {
        let o = ['atk', 'walk', 'idle'];

        if (this.animation?.name === 'death') return;

        this.spriteFlipX = false;
        this.spriteFlipY = false;

        if (o.includes(animation)) {
            animation += `_${
                this.orientation === Modules.Orientation.Left ? 'right' : this.orientationToString()
            }`;
            this.spriteFlipX = this.orientation === Modules.Orientation.Left;
        }

        this.setAnimation(animation, speed, count, onEndCount);
    }

    /**
     * Animates the character's death animation and
     * creates a callback if needed.
     * @param callback Optional parameter for when the animation finishes.
     * @param speed Optional parameter for the animation speed.
     * @param count How many times to repeat the animation.
     */

    public override animateDeath(callback?: () => void, speed = 120, count = 1): void {
        this.animate('death', speed, count, callback);
    }

    /**
     * Briefly changes the character's sprite with that of the
     * hurt sprite (a white and red sprite when a character is hurt).
     */

    public toggleHurt(): void {
        this.sprite = this.hurtSprite;

        window.setTimeout(() => {
            this.sprite = this.normalSprite;
        }, 75);
    }

    public despawn(): void {
        this.hitPoints = 0;
        this.dead = true;
        this.stop();

        this.orientation = Modules.Orientation.Down;
    }

    /**
     * Begins the following process. The character will perpetually
     * follow a moving target until it reaches its position.
     * @param entity The entity we are trying to follow.
     * @param forced Whether or not we start a new path or update current one.
     */

    public follow(entity: Entity, forced = false): void {
        this.following = true;

        this.setTarget(entity);
        this.move(entity.gridX, entity.gridY, forced);
    }

    /**
     * Not technically a following action, but it is used since
     * it removes the last step from the path.
     * @param x The x grid coordinate of the position we are moving towards.
     * @param y The y grid coordinate of the position we are moving towards.
     */

    public followPosition(x: number, y: number): void {
        this.following = true;

        this.move(x, y);
    }

    /**
     * Adds an attacker to the dictionary of attackers.
     * @param character Character we are adding to the dictionary.
     */

    public addAttacker(character: Character): void {
        this.attackers[character.instance] = character;
    }

    /**
     * Removes a character from the list of attackers.
     * @param character The character we are trying to remove.
     */

    public removeAttacker(character: Character): void {
        delete this.attackers[character.instance];
    }

    /**
     * Performs an action and updates the orientation of the character.
     * @param orientation New orientation we are setting.
     * @param action The type of action we are performing.
     */

    public performAction(orientation: Modules.Orientation, action: Modules.Actions): void {
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

    /**
     * Return an entity to the base idle state.
     * @param o Optional parameter if we want to update the orientation.
     */

    public override idle(o?: Modules.Orientation): void {
        let orientation = o || this.orientation;

        this.performAction(orientation, Modules.Actions.Idle);
    }

    /**
     * Converts the current orientation to a string that can
     * be used in the animations.
     * @returns String of the current orientation.
     */

    private orientationToString(): string {
        switch (this.orientation) {
            case Modules.Orientation.Left:
                return 'left';

            case Modules.Orientation.Right:
                return 'right';

            case Modules.Orientation.Up:
                return 'up';

            case Modules.Orientation.Down:
                return 'down';
        }
    }

    /**
     * Used for setting the orientation of a character relative to another entity.
     * @param entity The entity relative to the character.
     */

    public lookAt(entity: Entity): void {
        let { gridX, gridY } = this;

        if (entity.gridX > gridX) this.setOrientation(Modules.Orientation.Right);
        else if (entity.gridX < gridX) this.setOrientation(Modules.Orientation.Left);
        else if (entity.gridY > gridY) this.setOrientation(Modules.Orientation.Down);
        else if (entity.gridY < gridY) this.setOrientation(Modules.Orientation.Up);

        this.idle();
    }

    /**
     * Begins the movement of the entity to the given position.
     * @param x The grid x position to move to.
     * @param y The grid y position to move to.
     * @param forced Forced movement overrides any other movement.
     */

    public go(x: number, y: number, forced = false): void {
        if (this.frozen) return;

        if (this.following) {
            this.following = false;
            this.target = null;
        }

        this.move(x, y, forced);
    }

    /**
     * Updates the movement of the entity or starts a new path if needed.
     * @param x The new grid x coordinate we are trying to move the character to.
     * @param y The new grid y coordinate we are trying to move the character to.
     * @param forced Whether or not to update the current pathing or request a new one.
     */

    private move(x: number, y: number, forced = false): void {
        if (this.hasPath() && !forced) this.proceed(x, y);
        else this.followPath(this.requestPathfinding(x, y));
    }

    /**
     * Soft update to the character's pathing destination.
     * @param x The new grid x coordinate we are trying to move the character to.
     * @param y The new grid y coordinate we are trying to move the character to.
     */

    private proceed(x: number, y: number): void {
        this.newDestination = {
            x,
            y
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

    public nextStep(): void {
        let stop = false,
            x: number,
            y: number,
            path: number[][] | null;

        // Make a callback every two steps the character takes.
        if (this.step % 2 === 0 && this.secondStepCallback) this.secondStepCallback();

        // Stop if there is no path present.
        if (!this.hasPath()) return;

        // Callback prior to taking a step.
        this.beforeStepCallback?.();

        // Set the new position onto the grid.
        this.updateGridPosition();

        if (!this.interrupted && this.path) {
            if (this.hasNextStep()) [this.nextGridX, this.nextGridY] = this.path[this.step + 1];

            this.stepCallback?.();

            if (this.changedPath()) {
                ({ x, y } = this.newDestination!);

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

    /**
     * Determines which orientation the entity should be facing
     * and animates the repsective walking animation.
     */

    private updateMovement(): void {
        let { path, step } = this;

        if (!path) return;

        // nextStepX < prevStepX -> walking to the left
        if (path[step][0] < path[step - 1][0])
            this.performAction(Modules.Orientation.Left, Modules.Actions.Walk);

        // nextStepX > prevStepX -> walking to the right
        if (path[step][0] > path[step - 1][0])
            this.performAction(Modules.Orientation.Right, Modules.Actions.Walk);

        // nextStepY < prevStepY -> walking to the top
        if (path[step][1] < path[step - 1][1])
            this.performAction(Modules.Orientation.Up, Modules.Actions.Walk);

        // nextStepY > prevStepY -> walking to the bottom
        if (path[step][1] > path[step - 1][1])
            this.performAction(Modules.Orientation.Down, Modules.Actions.Walk);
    }

    private followPath(path: number[][] | null): void {
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

    public stop(force = false): void {
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

    public hasEffect(): boolean {
        return this.critical || this.stunned || this.terror || this.explosion || this.healing;
    }

    public getEffectAnimation(): Animation | undefined {
        if (this.critical) return this.criticalAnimation;

        if (this.stunned) return this.stunAnimation;

        if (this.terror) return this.terrorAnimation;

        if (this.explosion) return this.explosionAnimation;

        if (this.healing) return this.healingAnimation;
    }

    public getActiveEffect(): string {
        if (this.critical) return 'criticaleffect';

        if (this.stunned) return 'stuneffect';

        if (this.terror) return 'explosion-terror';

        if (this.explosion) return 'explosion-fireball';

        if (this.healing) return 'explosion-heal';

        return '';
    }

    /**
     * TRIGGERED!!!!
     */
    public triggerHealthBar(): void {
        this.healthBarVisible = true;

        if (this.healthBarTimeout) clearTimeout(this.healthBarTimeout);

        this.healthBarTimeout = window.setTimeout(() => {
            this.healthBarVisible = false;
        }, 7000);
    }

    public clearHealthBar(): void {
        this.healthBarVisible = false;
        clearTimeout(this.healthBarTimeout!);
        this.healthBarTimeout = null;
    }

    private requestPathfinding(x: number, y: number): number[][] | null {
        return this.requestPathCallback?.(x, y) || null;
    }

    private updateGridPosition(): void {
        if (!this.path || this.path.length === 0) return;

        this.setGridPosition(this.path[this.step][0], this.path[this.step][1]);
    }

    public forEachAttacker(callback: (attacker: Character) => void): void {
        _.each(this.attackers, (attacker) => callback(attacker));
    }

    public override hasWeapon(): boolean {
        return false;
    }

    public override hasShadow(): boolean {
        return true;
    }

    public override hasPath(): boolean {
        return this.path !== null;
    }

    public hasNextStep(): boolean | null {
        return this.path && this.path.length - 1 > this.step;
    }

    private changedPath(): boolean {
        return !!this.newDestination;
    }

    public removeTarget(): void {
        if (this.target) this.target.targeted = false;

        this.target = null;
    }

    public forget(): void {
        this.attackers = {};
    }

    public moved(): void {
        this.moveCallback?.();
    }

    public setTarget(target: Entity): void {
        this.target = target;
        this.target.targeted = true;
    }

    public hasTarget(target?: Entity): boolean {
        return target ? this.target === target : !!this.target;
    }

    public setObjectTarget(position: Position): void {
        /**
         * All we are doing is mimicking the `setTarget` entity
         * parameter. But we are throwing in an extra.
         */

        let character = new Character(`${position.x}-${position.y}`, Modules.EntityType.Object);
        character.setGridPosition(position.x, position.y);

        this.setTarget(character);
        this.followPosition(position.x, position.y);
    }

    /**
     * Sets the hitpoints values onto the character.
     * @param hitPoints The new hitpoints value we are setting.
     * @param maxHitPoints Optional parameter if we wish to update the max hitpoints.
     */

    public setHitPoints(hitPoints: number, maxHitPoints?: number): void {
        let decrease = false;

        // Clamp the hitpoints to 0.
        if (hitPoints < 0) hitPoints = 0;

        // Use the decrease value for the callback (used for certain UI special effects).
        if (hitPoints < this.hitPoints) decrease = true;

        this.hitPoints = hitPoints;

        // Update the max hitPoints if it is specified.
        if (maxHitPoints) this.maxHitPoints = maxHitPoints;

        // Callback contains the new maxHitPoints if specified, otherwise we use the current one.
        this.hitPointsCallback?.(this.hitPoints, maxHitPoints || this.maxHitPoints, decrease);
    }

    /**
     * Updates the current orientation of the character.
     */

    public setOrientation(orientation: Modules.Orientation): void {
        this.orientation = orientation;
    }

    /**
     * Initial action where we request a new position for the character to move to.
     * @param callback Contains the x and y grid coordinates of the position requested.
     */

    public onRequestPath(callback: (x: number, y: number) => number[][] | null): void {
        this.requestPathCallback = callback;
    }

    /**
     * Starts the pathing process for the character.
     * @param callback Contains the path to follow.
     */

    public onStartPathing(callback: (path: number[][]) => void): void {
        this.startPathingCallback = callback;
    }

    /**
     * Callback for when the pathfinding stops.
     * @param callback The grid x and y coordinates the player stopped pathing at.
     */

    public onStopPathing(callback: (gridX: number, gridY: number) => void): void {
        this.stopPathingCallback = callback;
    }

    /**
     * Callback done just before the character begins movement to another grid position.
     */

    public onBeforeStep(callback: () => void): void {
        this.beforeStepCallback = callback;
    }

    /**
     * Callback for when the character moves from one grid position to another.
     */

    public onStep(callback: () => void): void {
        this.stepCallback = callback;
    }

    /**
     * Callback for every two grid positions the character moves across.
     */

    public onSecondStep(callback: () => void): void {
        this.secondStepCallback = callback;
    }

    /**
     * Callback for when a character moves one absolute unit (pixel).
     */

    public onMove(callback: () => void): void {
        this.moveCallback = callback;
    }

    /**
     * Callback for when hitpoints undergo a change.
     * @param callback Contains the new hitpoints and the max hitpoints.
     */

    public onHitPoints(callback: HitPointsCallback): void {
        this.hitPointsCallback = callback;
    }
}
