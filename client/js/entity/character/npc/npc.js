define(['../character'], function(Character) {

    return Character.extend({

        init: function(id, kind) {
            var self = this;

            self._super(id, kind);

            self.talkIndex = 0;

            self.type = 'npc';
        },

        talk: function(messages) {
            var self = this,
                count = messages.length,
                message;

            if (self.talkIndex > count)
                self.talkIndex = 0;

            if (self.talkIndex < count)
                message = messages[self.talkIndex];

            self.talkIndex++;

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
