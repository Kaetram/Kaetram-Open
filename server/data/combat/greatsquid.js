var Combat = require('../../js/game/entity/character/combat/combat'),
    Modules = require('../../js/util/modules');

module.exports = GreatSquid = Combat.extend({

    init: function(character) {
        var self = this;

        character.spawnDistance = 15;

        self._super(character);

        self.character = character;

        self.lastTerror = new Date().getTime();

    },

    hit: function(character, target, hitInfo) {
        var self = this;

        if (self.canUseTerror()) {
            hitInfo.type = Modules.Hits.Stun;

            self.lastTerror = new Date().getTime();
        }

        self._super(character, target, hitInfo);
    },

    canUseTerror: function() {
        return new Date().getTime() - this.lastTerror > 15000;
    }


});
