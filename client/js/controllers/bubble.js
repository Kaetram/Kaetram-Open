/* global _ */

define(['jquery', '../renderer/bubbles/blob'], function($, Blob) {
    return Class.extend({
        init: function(game) {
            var self = this;

            self.game = game;
            self.bubbles = {};

            self.container = $('#bubbles');
        },

        create: function(id, message, duration) {
            var self = this;

            if (self.bubbles[id]) {
                self.bubbles[id].reset(self.game.time);
                $('#' + id + ' p').html(message);
            } else {
                var element = $(
                    "<div id='" +
                        id +
                        "' class='bubble'><p>" +
                        message +
                        "</p><div class='bubbleTip'></div></div>"
                );

                $(element).appendTo(self.container);

                self.bubbles[id] = new Blob(id, element, duration);

                return self.bubbles[id];
            }
        },

        setTo: function(entity) {
            var self = this;

            var bubble = self.get(entity.id);

            if (!bubble || !entity) return;

            var scale = self.game.renderer.getScale(),
                tileSize = 16 * scale,
                x = (entity.x - self.game.getCamera().x) * scale,
                width = parseInt(bubble.element.css('width')) + 24,
                offset = width / 2 - tileSize / 2,
                offsetY = -20,
                y;

            y =
                (entity.y - self.game.getCamera().y) * scale -
                tileSize * 2 -
                offsetY;

            bubble.element.css(
                'left',
                x - offset + (2 + self.game.renderer.scale) + 'px'
            );
            bubble.element.css('top', y + 'px');
        },

        update: function(time) {
            var self = this;

            _.each(self.bubbles, function(bubble) {
                var entity = self.game.entities.get(bubble.id);

                if (entity) self.setTo(entity);

                if (bubble.isOver(time)) {
                    bubble.destroy();
                    delete self.bubbles[bubble.id];
                }
            });
        },

        get: function(id) {
            var self = this;

            if (id in self.bubbles) return self.bubbles[id];

            return null;
        },

        clean: function() {
            var self = this;

            _.each(self.bubbles, function(bubble) {
                bubble.destroy();
            });

            self.bubbles = {};
        },

        destroy: function(id) {
            var self = this,
                bubble = self.get(id);

            if (!bubble) return;

            bubble.destroy();
            delete self.bubbles[id];
        }
    });
});
