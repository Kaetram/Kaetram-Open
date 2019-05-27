define(function() {

    return Class.extend({

        init: function(start, duration) {
            var self = this;

            self.time = start;
            self.duration = duration;
        },

        isOver: function(time) {
            var self = this,
                over = false;

            if (time - self.time > self.duration) {
                over = true;
                self.time = time;
            }

            return over;
        }

    });

});