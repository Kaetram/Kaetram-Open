/**
 * Very useful file used for queuing various objects,
 * most notably used in the info controller to queue
 * objects to delete
 */
import _ from 'lodash';

export default class Queue {
    constructor() {
        var self = this;

        self.queue = [];
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
        _.each(this.queue, function (object) {
            callback(object);
        });
    }
}
