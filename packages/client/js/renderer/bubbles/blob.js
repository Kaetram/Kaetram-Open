define(['../../utils/timer'], function(Timer) {

    return Class.extend({

        init: function(id, element, duration, isObject, info) {
            var self = this;

            self.id = id;
            self.element = element;
            self.duration = duration || 5000;

            self.time = new Date().getTime();
            self.timer = new Timer(self.time, self.duration);

            if (isObject) {
                self.type = 'object';
                self.info = info;
            }
        },

        isOver: function(time) {
            return this.timer.isOver(time);
        },

        reset: function(time) {
            this.timer.time = time;
        },

        destroy: function() {
            $(this.element).remove();
        }

    });

});
