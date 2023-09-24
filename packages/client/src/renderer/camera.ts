import { Modules } from '@kaetram/common/network';

import type Character from '../entity/character/character';

export const MAXIMUM_ZOOM = 8,
    DEFAULT_ZOOM = 4,
    MAX_GRID_WIDTH = 64,
    MAX_GRID_HEIGHT = 32;

export default class Camera {
    // Border is used to determine the screen size of the website (not browser).
    public border: HTMLElement = document.querySelector('#border')!;

    // x and y are absolute pixel coordinates
    public x = 0;
    public y = 0;

    // Grid x and y are the absolute coordinates divided by tileSize.
    public gridX = 0;
    public gridY = 0;

    // Grid width and height represent how many grids are visible horizontally and vertically.
    public gridWidth = 0;
    public gridHeight = 0;

    // The maximum camera position for the bottom and right edges of the map.
    private borderX = 0;
    private borderY = 0;
    public borderWidth = 0;
    public borderHeight = 0;

    // Border offset sizes (the actual dimension of the screen).
    public borderOffsetWidth = 0;
    public borderOffsetHeight = 0;

    // How zoomed in we are.
    public zoomFactor = DEFAULT_ZOOM;

    // Whether to centre the camera on a specific entity.
    private centered = true;

    // Whether to bound the camera horizontally or vertically.
    public lockX = false;
    public lockY = false;

    // The maximum and minimum zoom factors.
    public maxZoom = MAXIMUM_ZOOM;
    public minZoom = 2.6;

    private zoomCallback?: () => void;

    public constructor(
        private width: number,
        private height: number,
        private tileSize: number
    ) {
        this.update();
    }

    /**
     * Calculates the amount of tiles horizontally and vertically
     * depending on the dimensions of the screen and the zoom factor.
     * The border acts as a bounding box for when the camera approaches
     * edges of the map.
     */

    public update(): void {
        // Store the true dimensions of the border.
        this.borderOffsetWidth = this.border.offsetWidth;
        this.borderOffsetHeight = this.border.offsetHeight;

        // Calculate the actual border width using the tile size and zoom factor.
        this.borderWidth = this.border.offsetWidth / this.tileSize / this.zoomFactor;
        this.borderHeight = this.border.offsetHeight / this.tileSize / this.zoomFactor;

        /**
         * The grid width and height are defined by how many tiles we can fit into
         * the dimensions of the border. Note that the border is the size of the contents
         * visible on the website itself, not the size of the browser window. The zoom
         * factor is divided again to get the amount of grids are visible horizontally
         * and vertically after the zoom.
         */

        this.gridWidth = ~~this.borderWidth + 1;
        this.gridHeight = ~~this.borderHeight + 1;

        this.clamp();

        /**
         * The border x and y are the boundaries of how far the map can go. The maximum
         * camera position is from x = 0 and y = 0 (left/top edge of the map), to the maximum possible
         * position defined by the map width/height minus one screen size. These are proportions
         * used to bind the camera when we reach the right/bottom edge of the map.
         */

        this.borderX = (this.width - this.gridWidth) * this.tileSize;
        this.borderY = (this.height - this.gridHeight) * this.tileSize;
    }

    /**
     * Prevents the max grid width and height from exceeding the maximum proportions.
     * This is used to prevent the camera from rendering too many tiles.
     */

    private clamp(): void {
        if (this.gridWidth > MAX_GRID_WIDTH) this.gridWidth = MAX_GRID_WIDTH;
        if (this.gridHeight > MAX_GRID_HEIGHT) this.gridHeight = MAX_GRID_HEIGHT;
    }

    /**
     * Takes two grid coordinates and sets their position onto the camera.
     * We then use the grid coordinates to calculate the absolute pixel
     * coordinates by multiplying against the tileSize.
     * @param gridX The x coordinate in the grid.
     * @param gridY The y coordinate in the grid.
     */

    private setGridPosition(gridX: number, gridY: number): void {
        this.gridX = gridX;
        this.gridY = gridY;

        this.x = gridX * this.tileSize;
        this.y = gridY * this.tileSize;
    }

    /**
     * Sets the zoom factor of the camera and clamps the limits.
     * @param zoom The new zoom factor, defaults to {@linkcode DEFAULT_ZOOM} value.
     */

    public setZoom(zoom = DEFAULT_ZOOM): void {
        this.zoomFactor = zoom;

        if (isNaN(this.zoomFactor)) this.zoomFactor = DEFAULT_ZOOM;

        if (this.zoomFactor > this.maxZoom) this.zoomFactor = this.maxZoom;
        if (this.zoomFactor < this.minZoom) this.zoomFactor = this.minZoom;

        this.zoomCallback?.();
    }

    /**
     * A clip takes place when we want to move the camera to the
     * edges of the nearest tile. For example, if we decentre the
     * camera while the player is moving, this will leave
     * the camera in between tiles, we want to clip to the nearest
     * tile to prevent any issues.
     */

    public clip(): void {
        this.setGridPosition(
            Math.round(this.x / this.tileSize),
            Math.round(this.y / this.tileSize)
        );
    }

    /**
     * Toggles the centered state of the camera.
     */

    public center(): void {
        this.centered = true;
    }

    /**
     * Untoggle the camera centration state and clip
     * the camera to the nearest tile.
     */

    public decenter(): void {
        this.centered = false;

        this.clip();
    }

    /**
     * The camera is centered about the specified player character. This
     * is generally the main character playing the game (unless cutscenes)
     * will be implemented later.
     * @param character The player entity we are centering the camera on.
     */

    public centreOn(character: Character): void {
        let width = this.borderWidth / 2,
            height = this.borderHeight / 2,
            nextX = character.x - width * this.tileSize,
            nextY = character.y - height * this.tileSize;

        /**
         * We check whether the x and y coordinates that are about
         * to be calculated are within the boundaries of the map. If
         * they are, then we update the camera position both horizontally
         * and vertically.
         */

        if (nextX >= 0 && nextX <= this.borderX && !this.lockX) {
            this.x = nextX;
            this.gridX = Math.round(character.x / this.tileSize - ~~width);
        } else this.offsetX(nextX); // Bind to the x edge.

        if (nextY >= 0 && nextY <= this.borderY && !this.lockY) {
            this.y = nextY;
            this.gridY = Math.round(character.y / this.tileSize - ~~height);
        } else this.offsetY(nextY); // Bind to the y edge.
    }

    /**
     * Checks whether the camera is nearing the left or right edge of
     * the map by comparing against a tileSize or the borderX. We use
     * the `tileSize` in order to offset the camera binding to the left
     * edge by one tile. Otherwise the player will see a black border
     * alongside the left edge of the map. If the upcoming x coordinate
     * exits the boundaries, we then continuously set the x camera position
     * to either 0 (for left edge case) or the borderX (for right edge case).
     * @param nextX The camera x coordinate we are testing against going out of bounds.
     */

    private offsetX(nextX: number): void {
        if (nextX <= this.tileSize) {
            // Left edge case
            this.x = 0;
            this.gridX = 0;
        } else if (nextX >= this.borderX) {
            // The right edge case
            this.x = this.borderX;
            this.gridX = Math.round(this.borderX / this.tileSize);
        }
    }

    /**
     * Similar to `offsetX`, we check against the top of the map and the
     * bottom of the map and prevent the camera from going out of bounds.
     * @param nextY The camera y coordinate we are testing against going out of bounds.
     */

    private offsetY(nextY: number): void {
        if (nextY <= this.tileSize) {
            this.y = 0;
            this.gridY = 0;
        } else if (nextY >= this.borderY) {
            this.y = this.borderY;
            this.gridY = Math.round(this.borderY / this.tileSize);
        }
    }

    /**
     * Shifts the map horizontally or vertically (depending on the direction)
     * and updates the coordinates accordingly. The +- 3 are added in order
     * to offset the camera by a few tiles. This is done because otherwise the
     * player would get caught in a weird zoning loop where the zone that was
     * just entered would immediately trigger movement to the zone we just left.
     * @param direction The direction we are moving the camera in.
     */

    public zone(direction: Modules.Orientation): void {
        switch (direction) {
            case Modules.Orientation.Up: {
                this.setGridPosition(this.gridX, this.gridY - this.gridHeight + 3);

                break;
            }

            case Modules.Orientation.Down: {
                this.setGridPosition(this.gridX, this.gridY + this.gridHeight - 3);

                break;
            }

            case Modules.Orientation.Right: {
                this.setGridPosition(this.gridX + this.gridWidth - 3, this.gridY);

                break;
            }

            case Modules.Orientation.Left: {
                this.setGridPosition(this.gridX - this.gridWidth + 3, this.gridY);

                break;
            }
        }

        this.zoneClip();
    }

    /**
     * Clip the map to the boundaries of the map if
     * we zone somewhere outside of the limitations.
     */

    private zoneClip(): void {
        if (this.gridX < 0) this.setGridPosition(0, this.gridY);

        if (this.gridX > this.width) this.setGridPosition(this.width, this.gridY);

        if (this.gridY < 0) this.setGridPosition(this.gridX, 0);

        if (this.gridY > this.height) this.setGridPosition(this.gridX, this.height);
    }

    /**
     * Zooms in our out the camera. Depending on the zoomAmount, if it's negative
     * we zoom out, if it's positive we zoom in.
     * @param zoomAmount Float value we are zooming by.
     */

    public zoom(zoomAmount = 0): void {
        let zoom = parseFloat((this.zoomFactor + zoomAmount).toFixed(1));

        this.setZoom(zoom);
    }

    /**
     * Updates the minimum zoom when the screen is resized. Mobiles devices
     * have a smaller screen size so we allow more zooming out. Once the
     * device returns to normal proportions, we limit the zoom again.
     */

    public updateMinimumZoom(mobile = false): void {
        // Update the minimum zoom.
        this.minZoom = mobile ? 2 : 2.6;

        this.zoom();
    }

    /**
     * @returns Whether or not the camera is centered.
     */

    public isCentered(): boolean {
        return this.centered;
    }

    /**
     * Checks whether the specified x and y coordinates are in the camera's view.
     * @param x The x grid coordinate.
     * @param y The y grid coordinate.
     * @param offsetX How far to the right and left to check outside the bounds.
     * @param offsetY How far down to check outside the y bounds.
     * @returns Whether or not the coordinates are within the viewport.
     */

    public isVisible(x: number, y: number, offsetX: number, offsetY = offsetX): boolean {
        return (
            x > this.gridX - offsetX &&
            x < this.gridX + this.gridWidth + offsetX &&
            y > this.gridY - offsetY &&
            y < this.gridY + this.gridHeight + offsetY
        );
    }

    /**
     * Iterates through every grid coordinate in the view port.
     * @param callback Callback contains the grid coordinates being iterated in the view.
     * @param offset How much to look outside the width and height of the viewport.
     * @param offsetRight How much to look outside the right edge of the viewport.
     */

    public forEachVisiblePosition(
        callback: (x: number, y: number) => void,
        offset = 2,
        offsetRight = offset
    ): void {
        for (let y = this.gridY - offset, maxY = y + this.gridHeight + offsetRight; y < maxY; y++)
            for (
                let x = this.gridX - offset, maxX = x + this.gridWidth + offsetRight;
                x < maxX;
                x++
            ) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
                callback(x, y);
            }
    }

    /**
     * Callback for when the zooming has changed. Used by the renderer to recalculate
     * text dimensions and other things that are affected by the zoom.
     */

    public onZoom(callback: () => void): void {
        this.zoomCallback = callback;
    }
}
