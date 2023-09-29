import Character from '../entity/character/character';

import type Entity from '../entity/entity';
import type Map from './map';

export default class Grids {
    // Grid used for rendering entities.
    public renderingGrid: { [id: string]: Entity }[][] = [];

    public constructor(private map: Map) {}

    /**
     * Adds an entity to the rendering grid.
     * @param entity The entity we are adding to the rendering grid.
     */

    public addToRenderingGrid(entity: Entity): void {
        let { instance, gridX: x, gridY: y } = entity;

        // Ensure the position is valid.
        if (!this.map.isOutOfBounds(x, y)) this.renderingGrid[y][x][instance] = entity;
    }

    /**
     * Removes an entity from the rendering grid.
     * @param entity The entity parameter we are extracting instance, gridX, and gridY from.
     */

    public removeFromRenderingGrid(entity: Entity): void {
        // Clear the entity from all the paths it may be on.
        if (entity instanceof Character && entity.hasPath())
            for (let tile of entity.path!)
                delete this.renderingGrid[tile[1]][tile[0]][entity.instance];

        delete this.renderingGrid[entity.gridY][entity.gridX][entity.instance];
    }

    /**
     * Looks about a grid coordinate for entities and returns them.
     * @param gridX The x grid coordinate we are looking around.
     * @param gridY The y grid coordinate we are looking around.
     * @param radius How many tiles we are looking around.
     */

    public getEntitiesAround(gridX: number, gridY: number, radius = 2): Entity[] {
        let entities: Entity[] = [];

        for (let i = gridY - radius; i < gridY + radius; i++)
            for (let j = gridX - radius; j < gridX + radius; j++)
                if (this.map.isOutOfBounds(j, i)) continue;
                else entities = [...entities, ...Object.values(this.renderingGrid[i][j])];

        return entities;
    }
}
