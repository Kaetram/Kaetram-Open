import _ from 'lodash';

/**
 * Very useful class used for queuing various objects,
 * most notably used in the info controller to queue
 * objects to delete
 */
export default class Queue {
    queue: string[];

    constructor() {
        this.queue = [];
    }

    reset(): void {
        this.queue = [];
    }

    add(object: string): void {
        this.queue.push(object);
    }

    getQueue(): string[] {
        return this.queue;
    }

    forEachQueue(callback: (object: string) => void): void {
        _.each(this.queue, callback);
    }
}
