define(['./equipment'], function(Equipment) {

    return Equipment.extend({

        init: function(name, string, count, ability, abilityLevel) {
            var self = this;

            self._super(name, string, count, ability, abilityLevel);

            self.defence = -1;
        },

        setDefence: function(defence) {
            this.defence = defence;
        },

        getDefence: function() {
            return this.defence;
        },

        update: function(name, string, count, ability, abilityLevel) {
            this._super(name, string, count, ability, abilityLevel);
        }

    });

});