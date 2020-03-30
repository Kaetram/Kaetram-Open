/* global _ */

/**
 * Very useful file used for queuing various objects,
 * most notably used in the info controller to queue
 * objects to delete
 */

export default class Queue {
    queue: any[];
    constructor() {
        this.queue = [];
    }

    reset() {
        this.queue = [];
    }

    add(object) {
        this.queue.push(object);
    }

    getQueue() {
        return this.queue;
    }

    forEachQueue(callback) {
        _.each(this.queue, function(object) {
            callback(object);
        });
    }
}
