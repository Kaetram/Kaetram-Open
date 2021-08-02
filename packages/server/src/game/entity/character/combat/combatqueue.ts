import type { HitData } from '@kaetram/common/types/info';
import type Hit from './hit';

export default class CombatQueue {
    private hitQueue: Hit[] = [];

    public add(hit: Hit): void {
        this.hitQueue.push(hit);
    }

    public hasQueue(): boolean {
        return this.hitQueue.length > 0;
    }

    public clear(): void {
        this.hitQueue = [];
    }

    public getHit(): HitData | null {
        if (this.hitQueue.length === 0) return null;

        return this.hitQueue.shift()!.getData();
    }
}
