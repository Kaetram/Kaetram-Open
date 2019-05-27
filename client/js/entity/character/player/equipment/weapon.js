define(['./equipment'], function(Equipment) {

    return Equipment.extend({

        init: function(name, string, count, ability, abilityLevel) {
            var self = this;

            self._super(name, string, count, ability, abilityLevel);

            self.level = -1;
            self.damage = -1;
            self.ranged = false;
        },

        exists: function() {
            return this._super();
        },

        setDamage: function(damage) {
            this.damage = damage;
        },

        setLevel: function(level) {
            this.level = level;
        },

        getDamage: function() {
            return this.damage;
        },

        getLevel: function() {
            return this.level;
        },

        getString: function() {
            return this._super();
        },

        update: function(name, string, count, ability, abilityLevel) {
            this._super(name, string, count, ability, abilityLevel);
        }

    });

});