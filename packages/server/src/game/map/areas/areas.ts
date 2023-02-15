import Area from './area';

import log from '@kaetram/common/util/log';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type World from '../../world';

export default abstract class Areas {
    public areas: Area[] = [];

    protected constructor(public data: ProcessedArea[], public world: World) {}

    /**
     * Parses through the mapAreas and sets their base properties (id, x, y, width, height).
     * We make a callback if necessary for each individual area should we need to set any
     * extra properties externally.
     * @param mapAreas The map areas from our processed map file.
     * @param callback Calls back the individual map area that we are currently parsing.
     */

    public load(
        mapAreas: ProcessedArea[],
        callback?: (area: Area, mapArea: ProcessedArea) => void
    ): void {
        for (let a of mapAreas) {
            let area: Area = new Area(a.id, a.x, a.y, a.width, a.height);

            // Add polygon if present.
            if (a.polygon) area.polygon = a.polygon;
            if (a.ignore) area.ignore = a.ignore;

            // Add to our list of areas.
            this.areas.push(area);

            // Callback the last element in our list alongside the processed area info
            callback?.(this.areas.at(-1)!, a);
        }
    }

    /**
     * Logs a message indicating how many dynamic areas have been loaded.
     * @param type The type of area being loaded.
     */

    public message(type: string): void {
        log.info(`Loaded ${this.areas.length} ${type} areas.`);
    }

    /**
     * Searches through our areas and returns the area matching the id
     * parameter passed.
     * @param id The id of the area
     * @returns Area with the id specified.
     */

    public get(id: number): Area | undefined {
        return this.areas.find((area: Area) => {
            return area.id === id;
        });
    }

    /**
     * Checks all the areas to see which one contains the coordinate
     * for x and y.
     * @param x Grid position x
     * @param y Grid position y
     * @returns The area that contains the points x and y.
     */

    public inArea(x: number, y: number): Area | undefined {
        return this.areas.find((area: Area) => {
            return area.contains(x, y);
        });
    }

    /**
     * Iterates through all the areas within.
     * @param callback Calls back the area.
     */

    public forEachArea(callback: (area: Area) => void): void {
        for (let area of this.areas) callback(area);
    }
}
