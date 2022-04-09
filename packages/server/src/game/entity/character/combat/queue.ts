import type { HitData } from '@kaetram/common/types/info';
import type Hit from './hit';

/**
 * A class for queuing up upcoming hits of an entity.
 */

export default class Queue {
    // Our queue of hits.
    private hits: Hit[] = [];

    /**
     * Add a hit to our array of hits.
     * @param hit
     */

    public add(hit: Hit): void {
        this.hits.push(hit);
    }

    /**
     * @returns True if any hits are present in our queue.
     */

    public hasQueue(): boolean {
        return this.hits.length > 0;
    }

    /**
     * Removes all hits from our list.
     */

    public clear(): void {
        this.hits = [];
    }

    /**
     * Grabs the latest hit from the queue and removes it.
     * @returns A hit object.
     */

    public getHit(): Hit {
        return this.hits.shift()!;
    }
}
