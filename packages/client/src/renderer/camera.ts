import App from '../app';
import Player from '../entity/character/player/player';
import Entity from '../entity/entity';
import Map from '../map/map';
import * as Modules from '@kaetram/common/src/modules';
import Renderer from './renderer';

export default class Camera {
    renderer: Renderer;
    map: Map;
    app: App;
    offset: number;
    x: number;
    y: number;
    dX: number;
    dY: number;
    gridX: number;
    gridY: number;
    prevGridX: number;
    prevGridY: number;
    tileSize: number;
    speed: number;
    panning: boolean;
    centered: boolean;
    player: Player | null;
    lockX: boolean;
    lockY: boolean;
    gridWidth: number;
    gridHeight: number;
    borderX: number;
    borderY: number;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.map = renderer.map;
        this.app = renderer.game.app;

        this.offset = 0.5;
        this.x = 0;
        this.y = 0;

        this.dX = 0;
        this.dY = 0;

        this.gridX = 0;
        this.gridY = 0;

        this.prevGridX = 0;
        this.prevGridY = 0;

        this.tileSize = this.renderer.tileSize;

        this.speed = 1;
        this.panning = false;
        this.centered = true;
        this.player = null;

        this.lockX = false;
        this.lockY = false;

        this.update();
    }

    update(): void {
        const scale = this.renderer.getScale(),
            borderWidth = this.app.border.width(),
            borderHeight = this.app.border.height(),
            factorWidth = Math.ceil(borderWidth / this.tileSize / scale),
            factorHeight = Math.ceil(borderHeight / this.tileSize / scale);

        this.gridWidth = factorWidth;
        this.gridHeight = factorHeight;

        this.borderX = this.map.width * this.tileSize - this.gridWidth * this.tileSize;
        this.borderY = this.map.height * this.tileSize - this.gridHeight * this.tileSize;
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;

        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        this.gridX = Math.floor(x / 16);
        this.gridY = Math.floor(y / 16);
    }

    clip(): void {
        this.setGridPosition(Math.round(this.x / 16), Math.round(this.y / 16));
    }

    center(): void {
        if (this.centered) return;

        this.centered = true;
        this.centreOn(this.player);

        this.renderer.verifyCentration();
    }

    decenter(): void {
        if (!this.centered) return;

        this.clip();
        this.centered = false;

        this.renderer.verifyCentration();
    }

    setGridPosition(x: number, y: number): void {
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        this.gridX = x;
        this.gridY = y;

        this.x = this.gridX * 16;
        this.y = this.gridY * 16;
    }

    setPlayer(player: Player | null): void {
        this.player = player;

        this.centreOn(this.player);
    }

    handlePanning(direction: number): void {
        if (!this.panning) return;

        switch (direction) {
            case Modules.Keys.Up:
                this.setPosition(this.x, this.y - 1);
                break;

            case Modules.Keys.Down:
                this.setPosition(this.x, this.y + 1);
                break;

            case Modules.Keys.Left:
                this.setPosition(this.x - 1, this.y);
                break;

            case Modules.Keys.Right:
                this.setPosition(this.x + 1, this.y);
                break;
        }
    }

    centreOn(player: Player): void {
        if (!player) return;

        const width = Math.floor(this.gridWidth / 2),
            height = Math.floor(this.gridHeight / 2),
            nextX = player.x - width * this.tileSize,
            nextY = player.y - height * this.tileSize;

        if (nextX >= 0 && nextX <= this.borderX && !this.lockX) {
            this.x = nextX;
            this.gridX = Math.round(player.x / 16) - width;
        } else this.offsetX(nextX);

        if (nextY >= 0 && nextY <= this.borderY && !this.lockY) {
            this.y = nextY;
            this.gridY = Math.round(player.y / 16) - height;
        } else this.offsetY(nextY);
    }

    forceCentre(entity: Entity): void {
        if (!entity) return;

        const width = Math.floor(this.gridWidth / 2),
            height = Math.floor(this.gridHeight / 2);

        this.x = entity.x - width * this.tileSize;
        this.gridX = Math.round(entity.x / 16) - width;

        this.y = entity.y - height * this.tileSize;
        this.gridY = Math.round(entity.y / 16) - height;
    }

    offsetX(nextX: number): void {
        if (nextX <= 16) {
            this.x = 0;
            this.gridX = 0;
        } else if (nextX >= this.borderX) {
            this.x = this.borderX;
            this.gridX = Math.round(this.borderX / 16);
        }
    }

    offsetY(nextY: number): void {
        if (nextY <= 16) {
            this.y = 0;
            this.gridY = 0;
        } else if (nextY >= this.borderY) {
            this.y = this.borderY;
            this.gridY = Math.round(this.borderY / 16);
        }
    }

    zone(direction: number): void {
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
     * Clip the map to the boundaries of the map if
     * we zone somewhere out of the limitations.
     */
    zoneClip(): void {
        if (this.gridX < 0) this.setGridPosition(0, this.gridY);

        if (this.gridX > this.map.width) this.setGridPosition(this.map.width, this.gridY);

        if (this.gridY < 0) this.setGridPosition(this.gridX, 0);

        if (this.gridY > this.map.height) this.setGridPosition(this.gridX, this.map.height);
    }

    forEachVisiblePosition(callback: (x: number, y: number) => void, offset?: number): void {
        offset ||= 1;

        for (let y = this.gridY - offset, maxY = y + this.gridHeight + offset * 2; y < maxY; y++)
            for (let x = this.gridX - offset, maxX = x + this.gridWidth + offset * 2; x < maxX; x++)
                callback(x, y);
    }

    isVisible(x: number, y: number, offset: number, offset2: number): boolean {
        return (
            x > this.gridX - offset &&
            x < this.gridX + this.gridWidth &&
            y > this.gridY - offset &&
            y < this.gridY + this.gridHeight + offset2
        );
    }
}
