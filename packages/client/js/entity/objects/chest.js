define(['../entity'], function(Entity) {

    return Entity.extend({

        init: function(id, kind) {
            var self = this;

            self._super(id, kind);

            self.type = 'chest';
        },

        idle: function() {
            this.setAnimation('idle_down', 150);
        },

        setName: function(name) {
            this._super(name);
        },

        setAnimation: function(name, speed, count, onEndCount) {
            this._super(name, speed, count, onEndCount);
        },

        setGridPosition: function(x, y) {
            this._super(x, y);
        },

        setSprite: function(sprite) {
            this._super(sprite);
        }

    });

});