import { Modules } from '@kaetram/common/network';

/**
 * Zoning controller keeps track of the current orientation.
 */

export default class ZoningController {
    public direction!: Modules.Orientation | null;

    public reset(): void {
        this.direction = null;
    }

    public setUp(): void {
        this.direction = Modules.Orientation.Up;
    }

    public setDown(): void {
        this.direction = Modules.Orientation.Down;
    }

    public setRight(): void {
        this.direction = Modules.Orientation.Right;
    }

    public setLeft(): void {
        this.direction = Modules.Orientation.Left;
    }

    public getDirection(): Modules.Orientation {
        return this.direction!;
    }
}
