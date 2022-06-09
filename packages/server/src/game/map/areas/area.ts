import log from '@kaetram/common/util/log';
import type Mob from '../../entity/character/mob/mob';
import type Player from '../../entity/character/player/player';
import type Chest from '../../entity/objects/chest';

type Position = { x: number; y: number };

export default class Area {
    public polygon!: Position[];

    private entities: Mob[] = [];
    public chest: Chest | null = null;
    public items: string[] = [];

    public hasRespawned = true;

    // Overlay properties
    public darkness!: number;
    public type!: string;
    public fog!: string;

    // Properties it can hold
    public quest!: string;
    public achievement!: string;
    public cameraType!: string;
    public song!: string;

    // Door coordinates
    public tx!: number;
    public ty!: number;

    // Chest coordinates
    public cx!: number;
    public cy!: number;

    // Dynamic areas
    public mappedArea!: Area | undefined;
    public mapping!: number;

    public maxEntities = 0;
    public spawnDelay = 0;
    public lastSpawn!: number;

    private spawnCallback?(): void;
    private emptyCallback?(): void;

    public constructor(
        public id: number,
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    /**
     * Adds a mob to the area.
     * @param mob Mob we are adding to the area.
     */

    public addEntity(mob: Mob): void {
        if (!this.entities.includes(mob)) return;

        this.entities.push(mob);
        mob.area = this;

        // Grab a spawn delay from an mob to create an offset for the chest.
        if (!this.spawnDelay) this.spawnDelay = mob.respawnDelay;

        this.spawnCallback?.();
    }

    /**
     * Remove the mob from the list and creates a callback
     * if the area has been emptied.
     * @param mob The mob we are removoing.
     */

    public removeEntity(mob: Mob): void {
        let index = this.entities.indexOf(mob);

        if (index > -1) this.entities.splice(index, 1);

        if (this.entities.length === 0) this.emptyCallback?.();
    }

    /**
     * Checks if the player fulfills the requirements of the area.
     * @param player The player we are checking requirements for
     * @returns Checks if the requirement is fulfilled.
     */

    public fulfillsRequirement(player: Player): boolean {
        if (this.quest) return player.quests!.get(this.quest)?.isFinished();

        // if (this.achievement && this.quest)
        //     return player.finishedAchievement(this.achievement) && player.finishedQuest(this.quest);

        // if (this.achievement) return player.finishedAchievement(this.achievement);
        // if (this.quest) return player.finishedQuest(this.quest);

        return false;
    }

    /**
     * Takes a tile for a dynamic area and maps it to its counterpart. A mapped
     * tile is simply the other state of the dynamic tile. Take for example a door:
     * a closed door's mapped tile is the open door version of it. This is done
     * straight through Tiled editor.
     * @param x The tile's x coordinate
     * @param y The tile's y coordinate
     * @returns Position (x and y) of the mapped tile.
     */

    public getMappedTile(x: number, y: number): Position | undefined {
        if (!this.mappedArea) return;

        // The x and y relative to the area rather than globally.
        let relativeX = Math.abs(this.x - x),
            relativeY = Math.abs(this.y - y);

        return {
            x: this.mappedArea.x + relativeX,
            y: this.mappedArea.y + relativeY
        };
    }

    /**
     * Returns whether or not the area has a mapping counterpart.
     * Since the dynamic tiles areas are split into a original and a
     * mapped counterpart, only the original contains information about
     * where to map.
     */

    public isMappingArea(): boolean {
        return !!this.mappedArea;
    }

    /**
     * Checks whether or not the area shape is a polygon or rectangle and
     * uses the respective function to check if the x and y are contained
     * within the area.
     */

    public contains(x: number, y: number): boolean {
        return this.polygon ? this.inPolygon(x, y) : this.inRectangularArea(x, y);
    }

    /**
     * Checks if the x and y position are within the bounding rectangle of the area.
     * @param x The x position in the grid space.
     * @param y The y position in the grid space.
     * @returns If the x and y are contained within the area's rectangle.
     */

    private inRectangularArea(x: number, y: number): boolean {
        return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height;
    }

    /**
     * Checks if the specified grid point is contained with the area's polygon.
     * @param x The x grid point we are checking.
     * @param y The y grid point we are checking.
     * @returns If the x and y are contained within the polygon dimensions.
     */

    private inPolygon(x: number, y: number): boolean {
        for (let i = 0, j = this.polygon.length - 1; i < this.polygon.length; j = i++) {
            let xi = this.polygon[i].x,
                yi = this.polygon[i].y,
                xj = this.polygon[j].x,
                yj = this.polygon[j].y,
                intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) return true;
        }

        return false;
    }

    public onEmpty(callback: () => void): void {
        this.emptyCallback = callback;
    }

    public onSpawn(callback: () => void): void {
        this.spawnCallback = callback;
    }
}
