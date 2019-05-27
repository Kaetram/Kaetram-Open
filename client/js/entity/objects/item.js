define(['../entity'], function(Entity) {

    return Entity.extend({

        init: function(id, kind, count, ability, abilityLevel) {
            var self = this;

            self._super(id, kind);

            self.count = count;
            self.ability = ability;
            self.abilityLevel = abilityLevel;

            self.dropped = false;
            self.stackable = false;

            self.type = 'item';
        },

        idle: function() {
            this.setAnimation('idle', 150);
        },

        setName: function(name) {
            this._super(name);
        },

        setAnimation: function(name, speed, count) {
            this._super(name, speed, count);
        },

        setGridPosition: function(x, y) {
            this._super(x, y);
        },

        setSprite: function(sprite) {
            this._super(sprite);
        },

        hasShadow: function() {
            return true;
        }

    });

});