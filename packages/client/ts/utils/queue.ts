import _ from 'lodash';

/**
 * Very useful class used for queuing various objects,
 * most notably used in the info controller to queue
 * objects to delete
 */
export default class Queue {
    queue: unknown[];

    constructor() {
        this.queue = [];
    }

    reset(): void {
        this.queue = [];
    }

    add(object: unknown): void {
        this.queue.push(object);
    }

    getQueue(): unknown[] {
        return this.queue;
    }

    forEachQueue(callback: (object: never) => void): void {
        _.each(this.queue, (object) => {
            callback(object as never);
        });
    }
}
