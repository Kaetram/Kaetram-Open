var cls = require('../../server/js/lib/class'),
    Player = require('../../server/js/game/entity/character/player/player'),
    Creator = require('../../server/js/database/creator'),
    Utils = require('../../server/js/util/utils'),
    _ = require('underscore');

module.exports = Bot = cls.Class.extend({

    init: function(world, count) {
        var self = this;

        self.world = world;
        self.count = count;

        self.creator = new Creator(null);

        self.players = [];

        self.load();
    },

    load: function() {
        var self = this;

        for (var i = 0; i < self.count; i++) {
            var connection = {
                id: i,
                listen: function() {},
                onClose: function() {}
            },
            player = new Player(self.world, self.world.database, connection, -1);

            self.world.addPlayer(player);

            player.username = 'Bot' + i;

            player.load(self.creator.getPlayerData(player));

            player.intro();

            player.walkRandomly();

            self.players.push(player);

        }
    }


});