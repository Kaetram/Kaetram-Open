define(['../../utils/timer'], function(Timer) {

    return Class.extend({

        init: function(id, time, element, duration) {
            var self = this;

            self.id = id;
            self.time = time;
            self.element = element;
            self.duration = duration || 5000;

            self.timer = new Timer(self.time, self.duration);
        },

        setClickable: function() {
            this.element.css('pointer-events', 'auto');
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