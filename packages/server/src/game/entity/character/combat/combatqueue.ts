import type Hit from './hit';
import type { HitData } from './hit';

export default class CombatQueue {
    hitQueue: Hit[] = [];

    add(hit: Hit): void {
        this.hitQueue.push(hit);
    }

    hasQueue(): boolean {
        return this.hitQueue.length > 0;
    }

    clear(): void {
        this.hitQueue = [];
    }

    getHit(): HitData | null {
        if (this.hitQueue.length === 0) return null;

        return this.hitQueue.shift()!.getData();
    }
}
