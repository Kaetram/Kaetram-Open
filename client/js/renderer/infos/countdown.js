/* global Modules */

define(function() {

    return Class.extend({

        init: function(id, time) {
            var self = this;

            self.id = id;
            self.time = time;
            self.string = null;

            self.lastTime = 0;
            self.updateTime = 1000; //Update every second.
        },

        tick: function() {
            var self = this;

            if (time < 1)
                return;

            // Originally was gonna do this in the renderer
            // But it's best to update the string here.

            self.string = self.getStringFormat();

            time--;
        },

        update: function(time) {
            var self = this;

            if (time - self.lastTime > self.updateTime) {
                self.lastTime = time;
            }
        },

        getStringFormat: function() {
            var self = this;

            if (self.time < 60)
                return '00:' + self.time;

            var minutes = Math.floor(self.time / 60),
                seconds = self.time - (minutes * 60);

            if (minutes < 10)
                return '0' + minutes + ':' + seconds;

            return minutes + ':' + seconds;
        }

    });

});
