import { Modules } from '@kaetram/common/network';
import App from '../app';

import Player from '../entity/character/player/player';
import Entity from '../entity/entity';
import Map from '../map/map';

const MAXIMUM_ZOOM = 6,
    MINIMUM_ZOOM = 2.6;

export default class Camera {
    // offset = 0.5;

    public x = 0;
    public y = 0;
    // dX = 0;
    // dY = 0;
    public gridX = 0;
    public gridY = 0;
    // private prevGridX = 0;
    // private prevGridY = 0;

    public zoomFactor = 3;

    private tileSize;

    // speed = 1;
    // private panning = false;
    public centered = true;
    private player: Player | null = null;
    public lockX = false;
    public lockY = false;

    public gridWidth!: number;
    public gridHeight!: number;
    private borderX!: number;
    private borderY!: number;

    public constructor(private app: App, private map: Map) {
        this.tileSize = map.tileSize;

        this.update();
    }

    public update(): void {
        let { app, tileSize, map, zoomFactor } = this,
            borderWidth = app.border.width()!,
            borderHeight = app.border.height()!,
            factorWidth = Math.ceil(borderWidth / tileSize / zoomFactor),
            factorHeight = Math.ceil(borderHeight / tileSize / zoomFactor);

        this.gridWidth = factorWidth;
        this.gridHeight = factorHeight;

        let { gridWidth, gridHeight } = this;

        this.borderX = map.width * tileSize - gridWidth * tileSize;
        this.borderY = map.height * tileSize - gridHeight * tileSize;
    }

    public clip(): void {
        this.setGridPosition(Math.round(this.x / 16), Math.round(this.y / 16));
    }

    public center(): void {
        if (this.centered) return;

        this.centered = true;
        this.centreOn(this.player);

        this.renderer.verifyCentration();
    }

    public decenter(): void {
        if (!this.centered) return;

        this.clip();
        this.centered = false;

        this.renderer.verifyCentration();
    }

    private setGridPosition(x: number, y: number): void {
        this.gridX = x;
        this.gridY = y;

        this.x = this.gridX * this.tileSize;
        this.y = this.gridY * this.tileSize;
    }

    public setPlayer(player: Player): void {
        this.player = player;

        this.centreOn(this.player);
    }

    public centreOn(player: Player | null): void {
        if (!player) return;

        let { gridWidth, gridHeight, tileSize, borderX, borderY, lockX, lockY } = this,
            width = Math.floor(gridWidth / 2),
            height = Math.floor(gridHeight / 2),
            nextX = player.x - width * tileSize,
            nextY = player.y - height * tileSize;

        if (nextX >= 0 && nextX <= borderX && !lockX) {
            this.x = nextX;
            this.gridX = Math.round(player.x / 16) - width;
        } else this.offsetX(nextX);

        if (nextY >= 0 && nextY <= borderY && !lockY) {
            this.y = nextY;
            this.gridY = Math.round(player.y / 16) - height;
        } else this.offsetY(nextY);
    }

    public forceCentre(entity: Entity): void {
        if (!entity) return;

        let { gridWidth, gridHeight, tileSize } = this,
            width = Math.floor(gridWidth / 2),
            height = Math.floor(gridHeight / 2);

        this.x = entity.x - width * tileSize;
        this.gridX = Math.round(entity.x / 16) - width;

        this.y = entity.y - height * tileSize;
        this.gridY = Math.round(entity.y / 16) - height;
    }

    private offsetX(nextX: number): void {
        if (nextX <= 16) {
            this.x = 0;
            this.gridX = 0;
        } else if (nextX >= this.borderX) {
            this.x = this.borderX;
            this.gridX = Math.round(this.borderX / 16);
        }
    }

    private offsetY(nextY: number): void {
        let { borderY } = this;

        if (nextY <= 16) {
            this.y = 0;
            this.gridY = 0;
        } else if (nextY >= borderY) {
            this.y = borderY;
            this.gridY = Math.round(borderY / 16);
        }
    }

    public zone(direction: Modules.Orientation): void {
        switch (direction) {
            case Modules.Orientation.Up:
                this.setGridPosition(this.gridX, this.gridY - this.gridHeight + 3);

                break;

            case Modules.Orientation.Down:
                this.setGridPosition(this.gridX, this.gridY + this.gridHeight - 3);

                break;

            case Modules.Orientation.Right:
                this.setGridPosition(this.gridX + this.gridWidth - 3, this.gridY);

                break;

            case Modules.Orientation.Left:
                this.setGridPosition(this.gridX - this.gridWidth + 3, this.gridY);

                break;
        }

        this.zoneClip();
    }

    /**
     * Zooms in our out the camera. Depending on the zoomAmount, if it's negative
     * we zoom out, if it's positive we zoom in. The function also checks
     * maximum zoom.
     * @param zoomAmount Float value we are zooming by.
     */

    public zoom(zoomAmount: number): void {
        this.zoomFactor += zoomAmount;

        if (this.zoomFactor > MAXIMUM_ZOOM) this.zoomFactor = MAXIMUM_ZOOM;
        if (this.zoomFactor < MINIMUM_ZOOM) this.zoomFactor = MINIMUM_ZOOM;

        this.zoomFactor = parseFloat(this.zoomFactor.toFixed(1));
    }

    /**
     * Clip the map to the boundaries of the map if
     * we zone somewhere out of the limitations.
     */
    private zoneClip(): void {
        let { width, height } = this.map;

        if (this.gridX < 0) this.setGridPosition(0, this.gridY);

        if (this.gridX > width) this.setGridPosition(width, this.gridY);

        if (this.gridY < 0) this.setGridPosition(this.gridX, 0);

        if (this.gridY > height) this.setGridPosition(this.gridX, height);
    }

    public forEachVisiblePosition(callback: (x: number, y: number) => void, offset?: number): void {
        let { gridX, gridY, gridWidth, gridHeight } = this;

        offset ||= 1;

        for (let y = gridY - offset, maxY = y + gridHeight + offset * 2; y < maxY; y++)
            for (let x = gridX - offset, maxX = x + gridWidth + offset * 2; x < maxX; x++)
                callback(x, y);
    }

    public isVisible(x: number, y: number, offset: number, offset2: number): boolean {
        let { gridX, gridY, gridWidth, gridHeight } = this;

        return (
            x > gridX - offset &&
            x < gridX + gridWidth &&
            y > gridY - offset &&
            y < gridY + gridHeight + offset2
        );
    }
}
