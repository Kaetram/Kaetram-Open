/* global _, Modules */

define(['jquery'], function($) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;

            self.mapFrame = $('#mapFrame');
            self.warp = $('#warpButton');
            self.close = $('#closeMapFrame');

            self.warpCount = 0;

            self.load();
        },

        load: function() {
            var self = this,
                scale = self.getScale();

            self.warp.click(function() {
                self.toggle();
            });

            self.close.click(function() {
                self.hide();
            });

            for (var i = 1; i < 7; i++) {
                var warp = self.mapFrame.find('#warp' + i);

                if (warp)
                    warp.click(function(event) {

                        self.hide();

                        self.game.socket.send(Packets.Warp, [event.currentTarget.id.substring(4)]);

                    })
            }

        },

        toggle: function() {
            var self = this;

            /**
             * Just so it fades out nicely.
             */

            if (self.isVisible())
                self.hide();
            else
                self.display();
        },

        getScale: function() {
            return this.game.getScaleFactor();
        },

        isVisible: function() {
            return this.mapFrame.css('display') === 'block';
        },

        display: function() {
            this.mapFrame.fadeIn('slow');
        },

        hide: function() {
            this.mapFrame.fadeOut('fast');
        }

    });

});