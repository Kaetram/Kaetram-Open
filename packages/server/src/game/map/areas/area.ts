import { Opcodes } from '@kaetram/common/network';

import type { OverlayType } from '@kaetram/common/types/map';
import type Character from '../../entity/character/character';
import type Mob from '../../entity/character/mob/mob';
import type Player from '../../entity/character/player/player';
import type Chest from '../../entity/objects/chest';

type AreaCallback = (player: Player) => void;
export default class Area {
    public polygon!: Position[];

    private entities: string[] = []; // Stores instances of mobs in the area.
    public chest: Chest | null = null;
    public items: string[] = [];

    public hasRespawned = true;
    public ignore = false; // If the area is omitted from player walk callbacks.

    // Overlay properties
    public darkness = 0;
    public type: OverlayType = 'none';
    public fog = '';
    public reason = ''; // Message displayed when player takes damage in the area.

    // Properties it can hold
    public quest = '';
    public achievement = '';
    public cameraType = '';
    public song = '';

    // Chest coordinates
    public cx!: number;
    public cy!: number;

    // Dynamic areas
    public mappedArea!: Area | undefined;
    public mapping!: number;

    // Minigame
    public minigame = '';
    public mObjectType = '';

    // Players
    public players: { [instance: string]: Player } = {};

    public maxEntities = 0;
    public spawnDelay = 0;
    public lastSpawn!: number;

    public enterCallback?: AreaCallback;
    public exitCallback?: AreaCallback;

    private spawnCallback?: () => void;
    private emptyCallback?: (attacker?: Character) => void;

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
        if (this.entities.includes(mob.instance)) return;

        this.entities.push(mob.instance);

        // Grab a spawn delay from an mob to create an offset for the chest.
        if (!this.spawnDelay) this.spawnDelay = mob.respawnDelay;

        this.spawnCallback?.();
    }

    /**
     * Adds a player to the area if it doesn't already exist.
     * @param player The player we are adding to the area.
     */

    public addPlayer(player: Player): void {
        if (player.instance in this.players) return;

        this.players[player.instance] = player;

        // TODO - Expand this to support different kinds of effects
        if (!player.snowPotion) player.setEffect(Opcodes.Effect.Freeze);
    }

    /**
     * Remove the mob from the list and creates a callback
     * if the area has been emptied.
     * @param mob The mob we are removoing.
     */

    public removeEntity(mob: Mob, attacker?: Character): void {
        let index = this.entities.indexOf(mob.instance);

        if (index > -1) this.entities.splice(index, 1);

        if (this.entities.length === 0) this.emptyCallback?.(attacker);
    }

    /**
     * Removes a player from the area.
     * @param player The player we are removing.
     */

    public removePlayer(player: Player) {
        delete this.players[player.instance];

        player.setEffect(Opcodes.Effect.None);
    }

    /**
     * Checks if the player fulfills the requirements of the area.
     * @param player The player we are checking requirements for
     * @returns Checks if the requirement is fulfilled.
     */

    public fulfillsRequirement(player: Player): boolean {
        if (this.quest) return player.quests.get(this.quest)?.isFinished();
        if (this.achievement) return player.achievements.get(this.achievement)?.isFinished();

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
        if (this.ignore) return false; // Skip ignorable areas.

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
        let inside = false;

        for (let i = 0, j = this.polygon.length - 1; i < this.polygon.length; j = i++) {
            let xi = this.polygon[i].x,
                yi = this.polygon[i].y,
                xj = this.polygon[j].x,
                yj = this.polygon[j].y,
                intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Iterates through each tile within the area.
     * @param callback The x and y coordinate currently iterating through.
     */

    public forEachTile(callback: (x: number, y: number) => void): void {
        for (let i = this.y; i < this.y + this.height; i++)
            for (let j = this.x; j < this.x + this.width; j++) callback(j, i);
    }

    /**
     * Iterates through all the players and creates a callback.
     * @param callback The player currently being iterated.
     */

    public forEachPlayer(callback: (player: Player) => void): void {
        for (let instance in this.players) callback(this.players[instance]);
    }

    /**
     * Callback for when a player enters an area.
     * @param callback Contains the player object that is entering the area.
     */

    public onEnter(callback: AreaCallback): void {
        this.enterCallback = callback;
    }

    /**
     * Callback for when a player exits an area.
     * @param callback The player that is exiting the area.
     */

    public onExit(callback: AreaCallback): void {
        this.exitCallback = callback;
    }

    /**
     * Callback for when the area has been emptied of mobs.
     */

    public onEmpty(callback: () => void): void {
        this.emptyCallback = callback;
    }

    /**
     * Callback for when a mob has spawned within the area.
     */

    public onSpawn(callback: () => void): void {
        this.spawnCallback = callback;
    }
}
