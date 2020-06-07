/* global _, Modules */

define(['jquery'], function($) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;

            self.mapFrame = $('#mapFrame');
            self.button = $('#warpButton');
            self.close = $('#closeMapFrame');

            self.warpCount = 0;

            self.load();
        },

        load: function() {
            var self = this;

            self.button.click(function() {
                self.open();
            });

            self.close.click(function() {
                self.hide();
            });

            for (var i = 1; i < 7; i++) {
                var warp = self.mapFrame.find('#warp' + i);

                if (warp) {
                    warp.click(function(event) {

                        self.hide();

                        self.game.socket.send(Packets.Warp, [event.currentTarget.id.substring(4)]);

                    });
                }

                self.warpCount++;
            }

        },

        open: function() {
            var self = this;

            self.game.interface.hideAll();

            self.toggle();

            self.game.socket.send(Packets.Click, ['warp', self.button.hasClass('active')]);
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

        isVisible: function() {
            return this.mapFrame.css('display') === 'block';
        },

        display: function() {
            var self = this;

            self.mapFrame.fadeIn('slow');
            self.button.addClass('active');
        },

        hide: function() {
            var self = this;

            self.mapFrame.fadeOut('fast');
            self.button.removeClass('active');
        },

        clear: function() {
            var self = this;

            for (var i = 0; i < self.warpCount; i++)
                self.mapFrame.find('#warp' + i).unbind('click');

            if (self.close)
                self.close.unbind('click');

            if (self.button)
                self.button.unbind('click');
        }

    });

});
