import _ from 'lodash';

/**
 * Very useful class used for queuing various objects,
 * most notably used in the info controller to queue
 * objects to delete
 */
export default class Queue {
    private queue: string[] = [];

    public reset(): void {
        this.queue = [];
    }

    public add(object: string): void {
        this.queue.push(object);
    }

    public forEachQueue(callback: (object: string) => void): void {
        _.each(this.queue, callback);
    }
}
