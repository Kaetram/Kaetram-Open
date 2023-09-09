import Blob from '../renderer/bubbles/blob';
import { DEFAULT_ZOOM } from '../renderer/camera';

import type Camera from '../renderer/camera';
import type Renderer from '../renderer/renderer';
import type EntitiesController from './entities';

export default class BubbleController {
    private camera: Camera;

    private container: HTMLElement = document.querySelector('#bubbles')!;

    // Each entity's instance is associated with a bubble for the duration of a bubble.
    private bubbles: { [instance: string]: Blob } = {};

    private scale = 1;

    public constructor(
        private renderer: Renderer,
        private entities: EntitiesController
    ) {
        this.camera = this.renderer.camera;
    }

    /**
     * This creates the blob that will be used to display text. The bubble
     * is created above an entity (or static object if specified), and for the
     * duration of its existence, is updated if another `create` is called.
     *
     * @param instance - An identifier for the bubble we are creating.
     * @param message - A string of the text we are displaying.
     * @param duration - How long the bubble will display for.
     * @param position - Position containing x and y coordinates. Uses those and marks the bubble as static.
     */
    public create(instance: string, message: string, duration = 5000, position?: Position): void {
        let bubble = this.bubbles[instance];

        // Just update the bubble if it already exists.
        if (bubble) return bubble.update(message, Date.now());

        // Create a new bubble.
        this.bubbles[instance] = new Blob(instance, message, duration, position);

        // Add the newly created bubble element to the container of bubbles.
        this.container.append(this.bubbles[instance].element);
    }

    /**
     * Sets a bubble to an instance and the position associated
     * with it. The instance is any entity's instance, and
     * the x and y are absolute values in pixels.
     * @param instance The instance to store the bubble as.
     * @param x The x position of the bubble.
     * @param y The y position of the bubble.
     */

    public setTo(instance: string, x: number, y: number): void {
        let bubble = this.bubbles[instance];

        // Update the position of the bubble.
        bubble.setPosition(x, y);

        let { offsetWidth, offsetHeight, style } = bubble.element,
            relativeX = (x - this.camera.x) * this.camera.zoomFactor,
            relativeY = (y - this.camera.y) * this.camera.zoomFactor - this.renderer.actualTileSize,
            offsetX = offsetWidth / 2 - this.renderer.actualTileSize / 2 - 6,
            offsetY = offsetHeight * this.scale,
            boundaryY = relativeY / this.renderer.canvasHeight;

        // Assign the CSS values based on our calculations.
        style.left = `${relativeX - offsetX}px`;
        style.top = `${relativeY - offsetY}px`;

        // Clip the bubble blob if it is outside of the screen.
        if (boundaryY < 0.1) style.top = '0';
    }

    /**
     * Update function for the bubbles. Iterates through all the bubbles
     * and updates their positioning relative to the screen. This gets called
     * every frame so that the bubbles are following the entity adequately
     * as it moves or the camera moves.
     * @param time The current game time.
     */

    public update(time: number): void {
        for (let bubble of Object.values(this.bubbles)) {
            let entity = this.entities.get(bubble.instance);

            // If there is an entity, we set the bubble to its position.
            if (entity) this.setTo(entity.instance, entity.x, entity.y);

            // If the bubble is static its position is always the specified one.
            if (bubble.static) this.setTo(bubble.instance, bubble.position!.x, bubble.position!.y);

            // Destroy once the timer runs out.
            if (bubble.isOver(time)) this.destroy(bubble);
        }
    }

    /**
     * Handles resizing the bubbles currently visible and updating the zoom scaling relative
     * to the default scale.
     */

    public resize(): void {
        this.scale = DEFAULT_ZOOM / this.camera.zoomFactor;
    }

    /**
     * Removes a bubble based on its instance. Checks if it exists
     * first then calls the destroy command with the bubble.
     * @param instance The instance of the bubble we are checking.
     */

    public clear(instance: string): void {
        if (this.bubbles[instance]) this.destroy(this.bubbles[instance]);
    }

    /**
     * Destroys the bubble and removes it from our dictionary.
     * @param bubble The bubble we are unloading.
     */

    public destroy(bubble: Blob): void {
        bubble.destroy();
        delete this.bubbles[bubble.instance];
    }

    /**
     * Clears all the bubbles from the screen.
     */

    public clean(): void {
        for (let bubble of Object.values(this.bubbles)) bubble.destroy();

        this.bubbles = {};
    }
}
