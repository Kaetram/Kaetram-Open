import _ from 'lodash';

import Entity from '../game/entity/entity';
import Map from './map';

export default class Grids {
    map: Map;

    entityGrid: { [instance: string]: Entity }[][];

    constructor(map: Map) {
        this.map = map;

        this.entityGrid = [];

        this.load();
    }

    load(): void {
        for (let i = 0; i < this.map.height; i++) {
            this.entityGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) this.entityGrid[i][j] = {};
        }
    }

    updateEntityPosition(entity: Entity): void {
        if (entity && entity.oldX === entity.x && entity.oldY === entity.y) return;

        this.removeFromEntityGrid(entity, entity.oldX, entity.oldY);
        this.addToEntityGrid(entity, entity.x, entity.y);

        entity.updatePosition();
    }

    addToEntityGrid(entity: Entity, x: number, y: number): void {
        if (
            entity &&
            x > 0 &&
            y > 0 &&
            x < this.map.width &&
            x < this.map.height &&
            this.entityGrid[y][x]
        )
            this.entityGrid[y][x][entity.instance] = entity;
    }

    removeFromEntityGrid(entity: Entity, x: number, y: number): void {
        if (
            entity &&
            x > 0 &&
            y > 0 &&
            x < this.map.width &&
            y < this.map.height &&
            this.entityGrid[y][x] &&
            entity.instance in this.entityGrid[y][x]
        )
            delete this.entityGrid[y][x][entity.instance];
    }

    getSurroundingEntities(entity: Entity, radius?: number, include?: boolean): Entity[] {
        let entities: Entity[] = [];

        if (!this.checkBounds(entity.x, entity.y, radius)) return;

        for (let i = -radius; i < radius + 1; i++)
            for (let j = -radius; j < radius + 1; j++) {
                let pos = this.entityGrid[entity.y + i][entity.x + j];

                if (_.size(pos) > 0)
                    _.each(pos, (pEntity: Entity) => {
                        if (!include && pEntity.instance !== entity.instance)
                            entities.push(pEntity);
                    });
            }

        return entities;
    }

    checkBounds(x: number, y: number, radius?: number): boolean {
        return (
            x + radius < this.map.width &&
            x - radius > 0 &&
            y + radius < this.map.height &&
            y - radius > 0
        );
    }
}
