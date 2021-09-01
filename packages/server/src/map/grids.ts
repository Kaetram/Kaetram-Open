import _ from 'lodash';

import type Entity from '../game/entity/entity';
import type Map from './map';

export default class Grids {
    private entityGrid: { [instance: string]: Entity }[][] = [];

    public constructor(private map: Map) {
        this.load();
    }
    private load(): void {
        for (let i = 0; i < this.map.height; i++) {
            this.entityGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) this.entityGrid[i][j] = {};
        }
    }

    public updateEntityPosition(entity: Entity): void {
        if (entity && entity.oldX === entity.x && entity.oldY === entity.y) return;

        this.removeFromEntityGrid(entity, entity.oldX, entity.oldY);
        this.addToEntityGrid(entity, entity.x, entity.y);

        entity.updatePosition();
    }

    public addToEntityGrid(entity: Entity, x: number, y: number): void {
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

    public removeFromEntityGrid(entity: Entity, x: number, y: number): void {
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

    public getSurroundingEntities(
        entity: Entity,
        radius: number,
        include = false
    ): Entity[] | void {
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

    private checkBounds(x: number, y: number, radius: number): boolean {
        return (
            x + radius < this.map.width &&
            x - radius > 0 &&
            y + radius < this.map.height &&
            y - radius > 0
        );
    }
}
