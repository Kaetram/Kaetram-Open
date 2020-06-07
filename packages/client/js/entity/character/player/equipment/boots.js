define(['./equipment'], function(Equipment) {

    return Equipment.extend({

        init: function(name, string, count, ability, abilityLevel, power) {
            var self = this;

            self._super(name, string, count, ability, abilityLevel, power);
        },

        update: function(name, string, count, ability, abilityLevel, power) {
            this._super(name, string, count, ability, abilityLevel, power);
        }

    });

});
