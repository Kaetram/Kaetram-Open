import Character from '../entity/character/character';
import Projectile from '../entity/objects/projectile';

import { Modules } from '@kaetram/common/network';

import type Game from '../game';
import type Renderer from './renderer';
import type Entity from '../entity/entity';
import type SpritesController from '../controllers/sprites';
import type { RendererLighting } from './renderer';

export default class Updater {
    private tileSize: number;

    private renderer: Renderer;
    private sprites: SpritesController;

    public constructor(private game: Game) {
        this.tileSize = game.map.tileSize;

        this.sprites = game.sprites;
        this.renderer = game.renderer;
    }

    public update(): void {
        // Stop updating
        if (this.game.player.dead) return;

        this.updateEntities();
        this.updateKeyboard();
        this.updateAnimations();
        this.updateInfos();
        this.updateBubbles();
        this.updateSounds();
        this.updateAnimatedTiles();
        this.updateLights();
    }

    /**
     * Iterates through all the entities and updates their animation data.
     * If an entity is moving, we process that movement and update the entity's position.
     */

    private updateEntities(): void {
        this.game.entities.forEachEntity((entity: Entity) => {
            // Nothing to render if no sprite is loaded.
            if (!entity.sprite?.loaded) return;

            this.updateFading(entity);

            entity.animation?.update(this.game.time);

            // Handle projectile instances separately.
            if (entity.isProjectile()) {
                let mDistance = entity.speed * entity.getTimeDiff(),
                    dx = entity.target.x - entity.x, // delta x current position to target
                    dy = entity.target.y - entity.y, // delta y current position to target
                    tDistance = Math.hypot(dx, dy), // pythagorean theorem uwu
                    amount = mDistance / tDistance;

                // Always angle the projectile towards the target.
                entity.updateAngle();

                if (amount > 1) amount = 1;

                // Increment the projectile's position.
                entity.x += dx * amount;
                entity.y += dy * amount;

                if (tDistance < 5) entity.impactCallback?.();

                entity.lastUpdate = this.game.time;

                return;
            }

            // Only characters receive pathing/movement updates.
            if (!(entity instanceof Character)) return;

            // If a movement transition is in progress, we just update that transition.
            if (entity.movement.inProgress) return entity.movement.step(this.game.time);

            // Do not update if no pathing is in progress.
            if (!entity.hasPath()) return;

            // Check if the type of movement is on the x or y axis.
            let isHorizontal =
                    entity.orientation === Modules.Orientation.Left ||
                    entity.orientation === Modules.Orientation.Right,
                isVertical =
                    entity.orientation === Modules.Orientation.Up ||
                    entity.orientation === Modules.Orientation.Down,
                isLeft,
                isUp;

            // Determine the specific direction for the movement.
            if (isHorizontal) isLeft = entity.orientation === Modules.Orientation.Left;
            if (isVertical) isUp = entity.orientation === Modules.Orientation.Up;

            /**
             * Here we essentially start a transition update loop for an entity. Depending
             * on the entity's movement speed, we increment the entity's x/y position by a
             * single pixel. We proceed to do this for the length of the tile size. For example
             * for a movement speed of 100, the entity will traverse a tile of size 16x16 pixels
             * in 100 milliseconds.
             */

            entity.movement.start(
                this.game.time,
                isHorizontal ? entity.x + (isLeft ? -1 : 1) : entity.y + (isUp ? -1 : 1),
                isHorizontal
                    ? entity.x + (isLeft ? -this.tileSize : this.tileSize)
                    : entity.y + (isUp ? -this.tileSize : this.tileSize),
                entity.movementSpeed,
                (value: number) => {
                    if (isHorizontal) entity.x = value;
                    if (isVertical) entity.y = value;

                    // Callback for when an entity has moved.
                    entity.moved();
                },
                () => {
                    if (isHorizontal) entity.x = entity.movement.endValue;
                    if (isVertical) entity.y = entity.movement.endValue;

                    // Callback for an entity movement.
                    entity.moved();
                    entity.nextStep();
                }
            );
        });
    }

    /**
     * Fading occurs when an entity first spawns into
     * the world. It essentially gradually increases the
     * alpha of the entity until it is fully visible
     * when it first spawns into the world.
     * @param entity The entity we are fading in for.
     */

    private updateFading(entity: Entity): void {
        if (!entity.fading) return;

        let { time } = this.game,
            dt = time - entity.fadingTime;

        if (dt > entity.fadingDuration) {
            entity.fading = false;
            entity.fadingAlpha = 1;
        } else entity.fadingAlpha = dt / entity.fadingDuration;
    }

    /**
     * Updater for key input. When we toggle an arrow key
     * or WSAD key, we monitor the status of the move conditionals
     * within the player character. Depending on which one is active,
     * we change the player's current position and let the input
     * controller handle the movement itself.
     */

    private updateKeyboard(): void {
        let { player, input } = this.game,
            position = {
                x: -1,
                y: -1,
                gridX: player.gridX,
                gridY: player.gridY
            };

        /**
         * Disables updating when the player is already moving as to not spam
         * packets. If the player is frozen the input is ignored.
         */
        if (player.moving || player.teleporting || player.frozen || !player.hasKeyboardMovement())
            return;

        if (player.moveUp) position.gridY--;
        else if (player.moveDown) position.gridY++;
        else if (player.moveRight) position.gridX++;
        else if (player.moveLeft) position.gridX--;

        input.keyMove(position);
    }

    /**
     * Updates the target animation (spinning tile selected animation) and
     * the sparks animation displayed around items.
     */

    private updateAnimations(): void {
        let target = this.game.input.targetAnimation;

        if (target && this.game.input.selectedCellVisible) target.update(this.game.time);

        // Iterate through the preloaded animation sprites and update them.
        for (let animation of this.sprites?.preloadedAnimations || [])
            animation.update(this.game.time);
    }

    /**
     * Runs the info update with the current game time.
     */

    private updateInfos(): void {
        this.game.info.update(this.game.time);
    }

    /**
     * Updates the bubbles displayed around entities
     * and posts the current game time.
     */

    private updateBubbles(): void {
        this.game.bubble?.update(this.game.time);

        this.game.pointer?.update();
    }

    /**
     * Updates the music controller's directional audio.
     */

    private updateSounds(): void {
        this.game.audio.updatePlayerListener();
    }

    /**
     * Responsible for iterating through the tile ids of all animated tiles
     * and updating their animation. Whenever a tile has not been drawn for
     * a certain amount of time it is marked as unused and removed from the
     * renderer.
     */

    private updateAnimatedTiles(): void {
        /**
         * If we're using WebGL then animated tiles are handled on a per-layer
         * basis during the draw calls. Otherwise, we update them here for
         * Canvas2D rendering. We also disable animated tiles if the renderer
         * says so.
         */
        if (!this.renderer.isCanvas() || !this.renderer.animateTiles) return;

        // Update the animated tiles.
        for (let identifier in this.renderer.animatedTiles) {
            let tile = this.renderer.animatedTiles[identifier];

            // Update the tile's frame to the postAnimationData if it is expired.
            if (tile.expired) this.game.map.data[tile.index] = tile.postAnimationData!;

            // Delete the tile and continue if it's unused or expired.
            if (tile.unused || tile.expired) {
                delete this.renderer.animatedTiles[identifier];
                delete this.renderer.animatedTileIndexes[identifier];

                continue;
            }

            tile.animate(this.game.time);
        }
    }

    /**
     * Goes through each light source and flickers the light
     * to give the effect of a candle or torch. We essentially
     * just change the light's radius by a small amount.
     */

    private updateLights(): void {
        this.renderer.forEachLighting((lighting: RendererLighting) => {
            let { light } = lighting;

            // -1 intensity means that the light doesn't flicker.
            if (light.flickerIntensity < 0) return;

            light.distance =
                light.scaledDistance +
                Math.sin((this.game.time + light.offset) / light.flickerSpeed) *
                    light.scaledFlickerIntensity;
        });
    }
}
