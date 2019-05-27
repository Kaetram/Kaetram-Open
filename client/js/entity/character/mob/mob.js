define(['../character'], function(Character) {

    return Character.extend({

        init: function(id, kind) {
            var self = this;

            self._super(id, kind);

            self.name = name;

            self.hitPoints = -1;
            self.maxHitPoints = -1;

            self.type = 'mob';
        },

        setHitPoints: function(hitPoints) {
            this._super(hitPoints);
        },

        setMaxHitPoints: function(maxHitPoints) {
            this._super(maxHitPoints);
        },

        idle: function() {
            this._super();
        },

        performAction: function(orientation, action) {
            this._super(orientation, action);
        },

        setSprite: function(sprite) {
            this._super(sprite);
        },

        setName: function(name) {
            this.name = name;
        },

        setGridPosition: function(x, y) {
            this._super(x, y);
        }

    });

});