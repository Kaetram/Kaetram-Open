define(function() {

    /**
     * The children of these classes are responsible for
     * clear and concise ways of organizing stats of weapons
     * in the client side. This does not dictate the damage,
     * defense or bonus stats, it's just for looks.
     */

    return Class.extend({

        init: function(name, string, count, ability, abilityLevel) {
            var self = this;

            self.name = name;
            self.string = string;
            self.count = count;
            self.ability = ability;
            self.abilityLevel = abilityLevel;
        },

        exists: function() {
            return this.name !== null && this.name !== 'null';
        },

        getName: function() {
            return this.name;
        },

        getString: function() {
            return this.string;
        },

        getCount: function() {
            return this.count;
        },

        getAbility: function() {
            return this.ability;
        },

        getAbilityLevel: function() {
            return this.abilityLevel;
        },

        update: function(name, string, count, ability, abilityLevel) {
            var self = this;

            self.name = name;
            self.string = string;
            self.count = count;
            self.ability = ability;
            self.abilityLevel = abilityLevel;
        }

    });

});