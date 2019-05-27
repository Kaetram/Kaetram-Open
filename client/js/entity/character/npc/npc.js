define(['../character'], function(Character) {

    return Character.extend({

        init: function(id, kind) {
            var self = this;

            self._super(id, kind);

            self.index = 0;

            self.type = 'npc';
        },

        talk: function(messages) {
            var self = this,
                count = messages.length,
                message;

            if (self.index > count)
                self.index = 0;

            if (self.index < count)
                message = messages[self.index];

            self.index++;

            return message;
        },

        idle: function() {
            this._super();
        },

        setSprite: function(sprite) {
            this._super(sprite);
        },

        setName: function(name) {
            this._super(name);
        },

        setGridPosition: function(x, y) {
            this._super(x, y);
        }

    });

});