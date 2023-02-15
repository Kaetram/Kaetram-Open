import Transition from '../../utils/transition';
import Animation from '../animation';
import Entity from '../entity';
import EntityHandler from '../entityhandler';

import { Modules } from '@kaetram/common/network';

type HitPointsCallback = (hitPoints: number, maxHitPoints: number, decrease?: boolean) => void;
type FallbackCallback = (x: number, y: number) => void;

interface EffectInfo {
    key: string;
    animation: Animation;
    perpetual?: boolean; // Animation plays endlessly until effect is manually removed.
    speed?: number;
}

export default class Character extends Entity {
    public moving = false;
    public following = false;
    public stunned = false;
    public forced = false;
    public trading = false;

    private interrupted = false;

    public path: number[][] | null = null;
    public target: Entity | null = null;

    public lastTarget = '';

    private attackers: { [id: string]: Character } = {};
    private followers: { [id: string]: Character } = {};

    public movement = new Transition();

    private readonly attackAnimationSpeed = 50;
    private readonly walkAnimationSpeed = 120;

    public override nextGridX = -1;
    public override nextGridY = -1;
    public override movementSpeed = -1;
    public override attackRange = 1;
    public override frozen = false;
    public override dead = false;

    public override orientation = Modules.Orientation.Down;

    public effect: Modules.Effects = Modules.Effects.None;
    public destination!: Position | null;
    private newDestination!: Position | null;
    private step!: number;
    private healthBarTimeout!: number | null;

    private effects: { [id: string]: EffectInfo } = {
        [Modules.Effects.Critical]: {
            key: 'effect-critical',
            animation: new Animation('effect', 10, 0, 48, 48)
        },
        [Modules.Effects.Terror]: {
            key: 'effect-terror',
            animation: new Animation('effect', 8, 0, 64, 64)
        },
        [Modules.Effects.Stun]: {
            key: 'effect-stun',
            animation: new Animation('effect', 6, 0, 48, 48),
            perpetual: true
        },
        [Modules.Effects.Healing]: {
            key: 'effect-heal',
            animation: new Animation('effect', 8, 0, 64, 64)
        },
        [Modules.Effects.Fireball]: {
            key: 'effect-fireball',
            animation: new Animation('effect', 8, 0, 64, 64)
        },
        [Modules.Effects.Iceball]: {
            key: 'effect-iceball',
            animation: new Animation('effect', 8, 0, 64, 64)
        },
        [Modules.Effects.Burning]: {
            key: 'effect-burn',
            animation: new Animation('effect', 4, 0, 64, 64),
            perpetual: true,
            speed: 150
        },
        [Modules.Effects.Freezing]: {
            key: 'effect-freeze',
            animation: new Animation('effect', 6, 0, 32, 32),
            perpetual: true,
            speed: 200
        },
        [Modules.Effects.Poisonball]: {
            key: 'effect-poisonball',
            animation: new Animation('effect', 10, 0, 40, 40),
            speed: 175
        },
        [Modules.Effects.Boulder]: {
            key: 'effect-boulder',
            animation: new Animation('effect', 7, 0, 32, 32)
        }
    };

    private secondStepCallback?(): void;
    private beforeStepCallback?(): void;
    private stepCallback?(): void;
    private stopPathingCallback?(gridX: number, gridY: number, forced: boolean): void;
    private startPathingCallback?(path: number[][]): void;
    private moveCallback?(): void;
    private requestPathCallback?(x: number, y: number): number[][] | null;
    private fallbackCallback?: FallbackCallback;
    private hitPointsCallback?: HitPointsCallback;

    public handler: EntityHandler = new EntityHandler(this);

    public constructor(instance: string, type: Modules.EntityType) {
        super(instance, type);

        this.loadAnimations();
    }

    /**
     * Loads animations used for special effects.
     */

    private loadAnimations(): void {
        // Iterate through all the effects and load default speed and end callback events.
        for (let effect of Object.values(this.effects)) {
            // Default speed
            effect.animation.setSpeed(effect.speed || 50);

            // Remove effect once it has finished playing.
            effect.animation.setCount(1, () => {
                if (!effect.perpetual) this.removeEffect();

                effect.animation.reset();
                effect.animation.count = 1;
            });
        }
    }

    /**
     * An override of the superclass function with added functionality and cases
     * for characters. Since characters have a orientation, we must handle the
     * 'directionality' of the animation sprite.
     * @param name The name of the animation to play.
     * @param speed The speed at which the animation takes to play (in ms).
     * @param count The amount of times the animation should play.
     * @param onEndCount A function to be called upon animation completion.
     */

    public override setAnimation(
        name: string,
        speed = 120,
        count = 0,
        onEndCount?: () => void
    ): void {
        let o = ['atk', 'walk', 'idle'];

        // Do not perform another animation while the death one is playing.
        if (this.animation?.name === 'death') return;

        this.spriteFlipX = false;
        this.spriteFlipY = false;

        if (o.includes(name)) {
            name += `_${
                this.orientation === Modules.Orientation.Left ? 'right' : this.orientationToString()
            }`;
            this.spriteFlipX = this.orientation === Modules.Orientation.Left;
        }

        super.setAnimation(name, speed, count, onEndCount);
    }

    /**
     * Override for the superclass function so that the character's `setAnimation` is called.
     * @param callback Optional parameter for when the animation finishes.
     * @param speed Optional parameter for the animation speed.
     * @param count How many times to repeat the animation.
     */

    public override animateDeath(callback?: () => void, speed = 120, count = 0): void {
        this.setAnimation('death', speed, count, callback);
    }

    /**
     * Briefly changes the character's sprite with that of the
     * hurt sprite (a white and red sprite when a character is hurt).
     */

    public toggleHurt(): void {
        if (this.dead || this.teleporting) return;

        this.sprite = this.hurtSprite;

        window.setTimeout(() => {
            this.sprite = this.normalSprite;
        }, 75);
    }

    /**
     * Declares the entity dead and stops all pathing.
     */

    public despawn(): void {
        this.hitPoints = 0;
        this.dead = true;
        this.removeTarget();
        this.stop();

        this.orientation = Modules.Orientation.Down;
    }

    /**
     * Follows the player then requests a trade with them.
     * @param entity The entity we are trying to trade with.
     */

    public trade(entity: Entity): void {
        this.trading = true;

        this.follow(entity);
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
     * Pursues a character. Similar to following except no attacking
     * is done and the character will not stop following until you
     * click on something else.
     * @param character The character we will be pursuing.
     */

    public pursue(character: Character): void {
        this.setTarget(character);
        this.move(character.gridX, character.gridY);

        character.addFollower(this);
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
     * Adds a follower to the dictionary of followers.
     * @param character Character we are adding to the dictionary.
     */

    public addFollower(character: Character): void {
        this.followers[character.instance] = character;
    }

    /**
     * Removes a character from the list of attackers.
     * @param character The character we are trying to remove.
     */

    public removeAttacker(character: Character): void {
        delete this.attackers[character.instance];
    }

    /**
     * Removes a follower from the list of followers.
     * @param character The character we are trying to remove.
     */

    public removeFollower(character: Character): void {
        delete this.followers[character.instance];
    }

    /**
     * @returns Whether or not the character has any attackers.
     */

    public hasAttackers(): boolean {
        return Object.keys(this.attackers).length > 0;
    }

    /**
     * @returns Whether or not the character has any followers.
     */

    public hasFollowers(): boolean {
        return Object.keys(this.followers).length > 0;
    }

    /**
     * Performs an action and updates the orientation of the character.
     * @param orientation New orientation we are setting.
     * @param action The type of action we are performing.
     */

    public performAction(orientation: Modules.Orientation, action: Modules.Actions): void {
        this.setOrientation(orientation);

        switch (action) {
            case Modules.Actions.Idle: {
                this.setAnimation('idle', this.idleSpeed);
                break;
            }

            case Modules.Actions.Orientate: {
                this.setAnimation('idle', this.idleSpeed);
                break;
            }

            case Modules.Actions.Attack: {
                this.setAnimation('atk', this.attackAnimationSpeed, 1);
                break;
            }

            case Modules.Actions.Walk: {
                this.setAnimation('walk', this.walkAnimationSpeed);
                break;
            }
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
            case Modules.Orientation.Left: {
                return 'left';
            }

            case Modules.Orientation.Right: {
                return 'right';
            }

            case Modules.Orientation.Up: {
                return 'up';
            }

            case Modules.Orientation.Down: {
                return 'down';
            }
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
     * @param fallback Entities that cannot path correctly are teleported instead.
     */

    public go(x: number, y: number, forced = false, fallback = false): void {
        if (this.frozen) return;

        if (this.following) {
            this.following = false;
            this.removeTarget();
        }

        this.move(x, y, forced, fallback);
    }

    /**
     * Updates the movement of the entity or starts a new path if needed.
     * @param x The new grid x coordinate we are trying to move the character to.
     * @param y The new grid y coordinate we are trying to move the character to.
     * @param forced Whether or not to update the current pathing or request a new one.
     * @param fallback Whether or not to teleport the entity if pathing fails.
     */

    private move(x: number, y: number, forced = false, fallback = false): void {
        if (this.hasPath() && !forced) this.proceed(x, y);
        else {
            let path = this.requestPathfinding(x, y);

            if ((!path || path.length < 2) && fallback) return this.fallbackCallback?.(x, y);

            this.followPath(path);
        }

        this.destination = { x, y };
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
     * This code will remain present throughout the alpha. Once we begin moving
     * the pathfinder to the server-side, a tick-based system will be implemented
     * to calculate steps and movement there rather than the client.
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
                else {
                    this.startPathingCallback?.(path);
                    this.followPath(path);
                }
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

            this.forced = false;
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

    /**
     * Begins the procedure to follow a path after it has been found.
     * @param path The path we are following.
     */

    private followPath(path: number[][] | null): void {
        /**
         * This is to ensure the player does not click on
         * himthis or somehow into another dimension
         */

        if (!path || path.length < 2) return;

        this.path = path;
        this.step = 0;

        if (this.following) path.pop();

        if (!this.moving && !this.changedPath()) this.startPathingCallback?.(path);

        this.nextStep();
    }

    public stop(force = false): void {
        if (!force) this.interrupted = true;
        else if (this.hasPath()) {
            this.path = null;
            this.destination = null;
            this.newDestination = null;
            this.movement = new Transition();
            this.performAction(this.orientation, Modules.Actions.Idle);
            this.nextGridX = this.gridX;
            this.nextGridY = this.gridY;
        }
    }

    /**
     * @returns Whether or not the character has an active effect.
     */

    public hasEffect(): boolean {
        return this.effect !== Modules.Effects.None;
    }

    /**
     * Resets the currently active effect for the character.
     */

    public removeEffect(): void {
        this.effect = Modules.Effects.None;
    }

    /**
     * Updates the value of the currently active effect.
     * @param effect The effect we add to the character.
     */

    public setEffect(effect: Modules.Effects): void {
        this.effect = effect;

        if (this.effect === Modules.Effects.None) return;

        // Reset the animation when we change effects.
        this.effects[effect].animation.reset();
    }

    /**
     * Whether or not the player can attack its target given its position.
     * @returns True if the player is within the attack range of its target.
     */

    public canAttackTarget(): boolean {
        if (!this.hasTarget()) return false;

        if (!this.target!.isMob() && !this.target!.isPlayer()) return false;

        if (this.getDistance(this.target!) > this.attackRange - 1) return false;

        return true;
    }

    /**
     * @returns The animation object of the currently active effect (or undefined).
     */

    public getEffectAnimation(): Animation {
        return this.effects[this.effect]?.animation;
    }

    /**
     * Returns the key of the currently active effect or an empty string if none.
     * @returns The current key of the effect.
     */

    public getActiveEffect(): string {
        return this.effects[this.effect]?.key || '';
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

    /**
     * Iterates through all the attackers in the list and returns them.
     * @param callback The attacker currently being iterated.
     */

    public forEachAttacker(callback: (attacker: Character) => void): void {
        for (let attacker of Object.values(this.attackers)) callback(attacker);
    }

    /**
     * Iterates through all the followers in the list and returns them.
     * @param callback The follower currently being iterated.
     */

    public forEachFollower(callback: (follower: Character) => void): void {
        for (let follower of Object.values(this.followers)) callback(follower);
    }

    public override hasShadow(): boolean {
        return true;
    }

    public hasPath(): boolean {
        return this.path !== null;
    }

    public hasNextStep(): boolean | null {
        return this.path && this.path.length - 1 > this.step;
    }

    public changedPath(): boolean {
        return !!this.newDestination;
    }

    public removeTarget(): void {
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

        this.lastTarget = target.instance;
    }

    /**
     * @param target Optional parameter to check if the player has a specific target.
     * @returns Whether or not the player has a specific target or a target at all.
     */

    public hasTarget(target?: Entity): boolean {
        return target ? this.target === target : !!this.target;
    }

    /**
     * Mocks a entity-based target function and targets an object instead.
     * @param position The position of the object we are targeting.
     */

    public setObjectTarget(position: Coordinate): void {
        /**
         * All we are doing is mimicking the `setTarget` entity
         * parameter. But we are throwing in an extra.
         */

        let character = new Character(
            `${position.gridX}-${position.gridY}`,
            Modules.EntityType.Object
        );
        character.setGridPosition(position.gridX, position.gridY);

        this.setTarget(character);
        this.followPosition(position.gridX, position.gridY);
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

    /**
     * Callback for when we want to perform a fallback for entity movement.
     * @param callback Contains the x and y coordinates to teleport the entity to.
     */

    public onFallback(callback: FallbackCallback): void {
        this.fallbackCallback = callback;
    }
}
