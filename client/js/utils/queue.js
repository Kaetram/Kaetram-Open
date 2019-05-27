/* global _ */

define(function() {

    /**
     * Very useful file used for queuing various objects,
     * most notably used in the info controller to queue
     * objects to delete
     */

    return Class.extend({

        init: function() {
            var self = this;

            self.queue = [];
        },

        reset: function() {
            this.queue = [];
        },

        add: function(object) {
            this.queue.push(object);
        },

        getQueue: function() {
            return this.queue;
        },

        forEachQueue: function(callback) {
            _.each(this.queue, function(object) {
                callback(object);
            });
        }

    });

});