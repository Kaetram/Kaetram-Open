import Animation from './animation';

import Utils from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type Player from './character/player/player';
import type Item from './objects/item';
import type Sprite from './sprite';
import type Pet from './character/pet/pet';
import type { EntityDisplayInfo } from '@kaetram/common/types/entity';

export default abstract class Entity {
    public x = 0;
    public y = 0;
    public gridX = 0;
    public gridY = 0;
    public nextGridX = -1;
    public nextGridY = -1;

    // Used to calculate distances between entities.
    public distance = -1;

    public movementSpeed = -1;
    public attackRange = -1;
    public frozen = false;
    public dead = false;

    public name = '';

    public region = -1;

    public healthBarVisible = false;

    public sprite!: Sprite;

    public spriteFlipX = false;
    public spriteFlipY = false;

    public animation!: Animation | null;

    public offsetY = 0; // Used for manually offsetting the entity itself.
    public shadowOffsetY = 0;
    public hidden = false;

    private visible = true;

    // Exclamation points display above.
    public exclamation = false;
    public blueExclamation = false;

    public fading = false;
    public hurt = false;
    public silhouette = false;

    public angle = 0;

    // Counter variables
    public counter = 0;

    public fadingDuration = 1000;

    public orientation: Modules.Orientation = Modules.Orientation.Down;

    public fadingTime!: number;
    private blinking!: number;

    public ready = false;

    public hitPoints = 0;
    public maxHitPoints = 0;
    public mana = 0;
    public maxMana = 0;
    public level = 1;
    public experience = 0;
    public teleporting = false;
    public pvp = false;
    public nameColour = '';
    public customScale!: number;
    public fadingAlpha = 0;
    public lastUpdate = Date.now();

    public counterInterval!: NodeJS.Timeout | undefined;

    public constructor(
        public instance = '',
        public type: Modules.EntityType
    ) {}

    /**
     * Fades in the entity when spawning in.
     * @param time The duration the fade-in will take.
     */

    public fadeIn(time: number): void {
        this.fading = true;
        this.fadingTime = time;
    }

    /**
     * Begins the blinking interval.
     * @param speed The speed at which the blink occurs.
     */

    public blink(speed = 150): void {
        this.blinking = window.setInterval(() => this.toggleVisibility(), speed);
    }

    /**
     * Stops teh blinking interval if it's running and updates the visibility.
     */

    protected stopBlinking(): void {
        if (this.blinking) clearInterval(this.blinking);

        this.setVisible(true);
    }

    /**
     * Unimplemented idle() function.
     */

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public idle(): void {}

    /**
     * Animates the character's death animation and
     * creates a callback if needed.
     * @param callback Optional parameter for when the animation finishes.
     * @param speed Optional parameter for the animation speed.
     * @param count How many times to repeat the animation.
     */

    public animateDeath(callback?: () => void, speed = 120, count = 1): void {
        this.setAnimation('death', speed, count, callback);
    }

    /**
     * Updates the current state of the silhouette sprite. If the silhouette sprite doesn't exist
     * we attempt to load it.
     * @param state The new state to set the silhouette sprite to, defaults to false.
     */

    public updateSilhouette(state = false): void {
        if (this.dead || this.teleporting) {
            this.silhouette = false;
            return;
        }

        // Attempt to load the silhouette if it doesn't exist.
        if (state && this.sprite.hasSilhouette() && !this.sprite.silhouetteSprite)
            this.sprite.loadSilhouetteSprite();

        this.silhouette = state;
    }

    /**
     * Updates the display info for the entity. This essentially adds minor
     * decorations to the entity's name colour, scaling, and whether or not
     * they have additional markings above their head.
     * @param displayInfo Contains the display info data to update.
     */

    public updateDisplayInfo(displayInfo: EntityDisplayInfo): void {
        if (displayInfo.colour) this.nameColour = displayInfo.colour;
        if (displayInfo.scale) this.customScale = displayInfo.scale;

        // Display the exclamations if they're set onto the entity.
        if (displayInfo.exclamation === 'achievement') this.exclamation = true;
        else if (displayInfo.exclamation === 'blue') this.blueExclamation = true;
    }

    /**
     * Grabs the currently active sprite based on the effects. This is used
     * for when we want to display a silhouette or a hurt sprite.
     * @returns The currently active
     */

    public getSprite(): Sprite {
        // Display the hurt sprite if the entity has one.
        if (this.hurt && this.sprite.hurtSprite) return this.sprite.hurtSprite;

        // Display the silhouette sprite if the entity has one.
        if (this.silhouette && this.sprite.silhouetteSprite) return this.sprite.silhouetteSprite;

        return this.sprite;
    }

    /**
     * Updates the sprite of the entity with a new one.
     * @param sprite The new sprite object (obtained using the sprites controller).
     */

    public setSprite(sprite: Sprite): void {
        if (this.teleporting) return;

        // Load the sprite if it hasn't been loaded yet.
        if (!sprite.loaded) {
            sprite.load();

            // Make sure we're not setting the same sprite.
            if (this.sprite?.key === sprite.key) return;
        }

        this.sprite = sprite;

        sprite.onLoad(() => {
            // Custom scales can be applied to certain entities.
            if (!this.customScale) return;

            this.sprite.offsetX *= this.customScale;
            this.sprite.offsetY *= this.customScale;
        });
    }

    /**
     * Sets the animation of the entity.
     * @param name The name of the animation to play.
     * @param speed The speed at which the animation takes to play (in ms).
     * @param count The amount of times the animation should play.
     * @param onEndCount A function to be called upon animation completion.
     */

    public setAnimation(
        name: string,
        speed = this.sprite.idleSpeed,
        count = 1,
        onEndCount?: () => void,
        withStop = false
    ): void {
        // Prevent setting animation if no sprite or it's the same animation.
        if (this.animation?.name === name) return;

        // Copy the animation data from the sprite.
        let { length, row, width, height } = this.sprite.animations[name];

        // Create a new animation instance to prevent pointer issues.
        this.animation = new Animation(name, length, row, width, height, withStop);

        // Restart the attack animation if it's already playing.
        if (name.startsWith('atk')) this.animation.reset();

        this.animation.setSpeed(speed);

        // Run the onEndCount function when the animation finishes or go to idle.
        this.animation.setCount(count, onEndCount || (() => this.idle()));
    }

    /**
     * Sets the absolute pixel coordinate position of the entity.
     * @param x The new x pixel coordinate.
     * @param y The new y pixel coordinate.
     */

    private setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Updates the grid position of the entity. Grid coordinates are pixel coordinates
     * divided by the tlesize and floored.
     * @param gridX The new grid x coordinate.
     * @param gridY The new grid y coordinate.
     */

    public setGridPosition(gridX: number, gridY: number): void {
        this.gridX = gridX;
        this.gridY = gridY;
        this.region = Utils.getRegion(gridX, gridY);

        this.setPosition(gridX * Utils.tileSize, gridY * Utils.tileSize);
    }

    /**
     * Sets the countdown to a value to start counting down from.
     * @param count New value for the countdown.
     */

    public setCountdown(count: number): void {
        this.counter = count;

        // Initialize a counter interval
        this.counterInterval = setInterval(() => {
            // Clear the counter if we've reached 0.
            if (this.counter <= 0) {
                clearInterval(this.counterInterval);
                this.counterInterval = undefined;
                return;
            }

            this.counter--;
        }, 1000);
    }

    /**
     * Sets the visibility of the entity.
     * @param visible New visibility value.
     */

    public setVisible(visible: boolean): void {
        this.visible = visible;
    }

    /**
     * Returns the distance between the current entity and another entity.
     * @param entity The entity we are finding the distance to.
     * @returns Integer value of the distance (in tiles).
     */

    public getDistance(entity: Entity): number {
        let { gridX, gridY } = this;

        return Math.abs(gridX - entity.gridX) + Math.abs(gridY - entity.gridY);
    }

    /**
     * Changes the values of the entity visibility.
     */

    private toggleVisibility(): void {
        this.setVisible(!this.visible);
    }

    /**
     * Whether or not the entity is visible and should be drawn in the renderer.
     * @returns The visibility status of the entity.
     */

    public isVisible(): boolean {
        return this.visible;
    }

    /**
     * Default value of whether or not to draw names above the entity. Overriden
     * in the subclass implementations as needed.
     * @returns Defaults to true.
     */

    public drawNames(): boolean {
        return true;
    }

    /**
     * Default value of whether or not the entity has a shadow underneath it. This
     * gets overriden by subclass implementations as needed.
     * @returns Defaults to false.
     */

    public hasShadow(): boolean {
        return false;
    }

    /**
     * Default implementation for crown.
     * @returns Defaults to false.
     */

    public hasCrown(): boolean {
        return false;
    }

    /**
     * Whether or not the entity has a counter above it.
     * @returns Whether the counter value is greater than 0.
     */

    public hasCounter(): boolean {
        return this.counter > 0;
    }

    /**
     * @returns Whether or not the entity is a player type.
     */

    public isPlayer(): this is Player {
        return this.type === Modules.EntityType.Player;
    }

    /**
     * @returns Whether or not the entity is a player type.
     */

    public isMob(): boolean {
        return this.type === Modules.EntityType.Mob;
    }

    /**
     * @returns Whether or not the entity is an NPC type.
     */

    public isNPC(): boolean {
        return this.type === Modules.EntityType.NPC;
    }

    /**
     * @returns Whether or not the entity is an item type.
     */

    public isItem(): this is Item {
        return this.type === Modules.EntityType.Item;
    }

    /**
     * @returns Whether or not the entity is a chest type.
     */

    public isChest(): boolean {
        return this.type === Modules.EntityType.Chest;
    }

    /**
     * @returns Whether or not the entity is a projectile type.
     */

    public isProjectile(): boolean {
        return this.type === Modules.EntityType.Projectile;
    }

    /**
     * @returns Whether or not the entity is a pet type.
     */

    public isPet(): this is Pet {
        return this.type === Modules.EntityType.Pet;
    }

    /**
     * @returns Whether or not the entity is an object type.
     */

    public isObject(): boolean {
        return this.type === Modules.EntityType.Object;
    }

    /**
     * @returns Whether or not the entity is a tree type.
     */

    public isTree(): boolean {
        return this.type === Modules.EntityType.Tree;
    }

    /**
     * Used for unifying multiple resources into one function. Things
     * like trees, rocks, and bushes are all considered resources.
     * @returns Whether or not the entity is a tree, a rock, or a bush.
     */

    public isResource(): boolean {
        return this.isTree();
    }

    /**
     * Default implementation for `isModerator()`
     * @returns False by default.
     */

    public isModerator(): boolean {
        return false;
    }

    /**
     * Default implementation for `isAdmin()`
     * @returns False by default.
     */

    public isAdmin(): boolean {
        return false;
    }
}
