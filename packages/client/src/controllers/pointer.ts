import Arrow from '../renderer/pointers/arrow';
import { DEFAULT_ZOOM } from '../renderer/camera';

import { Opcodes } from '@kaetram/common/network';

import type Renderer from '../renderer/renderer';
import type Camera from '../renderer/camera';
import type EntitiesController from './entities';

export default class PointerController {
    private camera: Camera;

    private pointers: { [instance: string]: Arrow } = {};

    private bubbles: HTMLElement = document.querySelector('#bubbles')!;

    private scale = 1;

    public constructor(
        private renderer: Renderer,
        private entities: EntitiesController
    ) {
        this.camera = this.renderer.camera;
    }

    /**
     * Creates a pointer given the type specified. Some pointers are static and
     * bind to a tile on the map. Others are bounded to an entity. Lastly, some
     * are static pointers relative to the screen.
     * @param type The type of pointer we are creating (one that binds to an entity,
     * one that binds to a tile, and so on.)
     * @param instance The instance of the pointer (used as an identifier).
     * @param x (Optional) The x position of the pointer (relative or absolute).
     * @param y (Optional) The y position of the pointer (relative or absolute).
     */

    public create(type: Opcodes.Pointer, instance: string, x = -1, y = -1): void {
        // Pointer already exists for a specified instance, stop here.
        if (instance in this.pointers) return;

        // Create a new pointer.
        let pointer = new Arrow(type, instance);

        // Set the position for the pointer.
        pointer.setPosition(x, y);

        // Add the pointer to the list of pointers.
        this.pointers[instance] = pointer;

        // Append the pointer to the bubbles container.
        this.bubbles.append(pointer.element);
    }

    /**
     * Calculates the position of the pointer on the screen based on its position
     * in the game. We do some magic camera calculations here.
     * @param pointer The pointer that we are calculating the position for.
     * @param x The x position of the pointer in the game.
     * @param y The y position of the pointer in the game.
     */

    private set(pointer: Arrow, x: number, y: number): void {
        pointer.setPosition(x, y);

        let relativeX = (x - this.camera.x) * this.camera.zoomFactor,
            relativeY = (y - this.camera.y) * this.camera.zoomFactor - this.renderer.actualTileSize,
            boundaryX = relativeX / this.renderer.canvasWidth,
            boundaryY = relativeY / this.renderer.canvasHeight;

        // Reset all the styles.
        pointer.reset();

        // Store for later when we want to stack transformations.
        let transform = `scale(${this.scale})`;

        // Handle the pointer being within the boundaries of the screen.
        if (boundaryX >= 0 && boundaryX <= 1 && boundaryY >= 0 && boundaryY <= 1) {
            let offsetX = pointer.offsetWidth - this.renderer.actualTileSize / 2;

            pointer.element.style.left = `${relativeX - offsetX}px`;
            pointer.element.style.top = `${relativeY}px`;

            // Apply the transformation.
            pointer.element.style.transform = transform;

            return;
        }

        // Handle pointers outside the boundaries of the screen.
        if (boundaryX > 1) {
            // Pointer is to the right of the screen.
            pointer.element.style.right = '0';
            pointer.element.style.top = boundaryY > 1 ? '' : boundaryY < 0 ? '0' : `${relativeY}px`;
            pointer.element.style.bottom = boundaryY > 1 ? '0' : '';
            pointer.element.style.transform = `${transform} rotate(-90deg)`;
        } else if (boundaryX < 0) {
            // Pointer is to the left of the screen.
            pointer.element.style.left = '0';
            pointer.element.style.top = boundaryY > 1 ? '' : boundaryY < 0 ? '0' : `${relativeY}px`;
            pointer.element.style.bottom = boundaryY > 1 ? '0' : '';
            pointer.element.style.transform = `${transform} rotate(90deg)`;
        } else if (boundaryY > 1) {
            // Pointer is above the screen.
            pointer.element.style.bottom = '0';
            pointer.element.style.left =
                boundaryX > 1 ? '' : boundaryX < 0 ? '0' : `${relativeX}px`;
            pointer.element.style.right = boundaryX > 1 ? '0' : '';
            pointer.element.style.transform = transform;
        } else if (boundaryY < 0) {
            // Pointer is below the screen.
            pointer.element.style.top = '0';
            pointer.element.style.left =
                boundaryX > 1 ? '' : boundaryX < 0 ? '0' : `${relativeX}px`;
            pointer.element.style.right = boundaryX > 1 ? '0' : '';
            pointer.element.style.transform = `${transform} rotate(180deg)`;
        }
    }

    /**
     * Handles updating of a pointer. This is called every frame and
     * ensures that a pointer is always in the correct position. If it's
     * bound to an entity, it will always follow it. If it's bound to a location
     * it will always be in the same position regardless of how the player moves.
     */

    public update(): void {
        for (let instance in this.pointers) {
            let pointer = this.pointers[instance];

            // Location pointers just use the x and y coordinates that were given to them.
            if (pointer.type === Opcodes.Pointer.Location) {
                this.set(pointer, pointer.x, pointer.y);
                continue;
            }

            // Entity pointers use the instance that pertains to the entity.
            if (pointer.type === Opcodes.Pointer.Entity) {
                let entity = this.entities.get(instance);

                if (entity) this.set(pointer, entity.x, entity.y);
                else this.remove(instance);

                continue;
            }
        }
    }

    /**
     * Handles resizing of relative pointers (those which have a fixed position on the screen).
     */

    public resize(): void {
        this.scale = this.camera.zoomFactor / DEFAULT_ZOOM;
    }

    /**
     * Iterates through all pointers and removes them.
     */

    public clean(): void {
        for (let instance in this.pointers) this.remove(instance);
    }

    /**
     * Removes a pointer from the list of pointers and destroys it.
     * @param instance The instance of the pointer we are removing.
     */

    private remove(instance: string): void {
        let pointer = this.pointers[instance];

        pointer?.destroy();

        delete this.pointers[instance];
    }
}
