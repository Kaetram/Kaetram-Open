define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;
            self.player = game.player;

            self.health = $('#health');
            self.healthBar = $('#healthBar');
            self.healthBarText = $('#healthBarText');

            self.exp = $('#exp');
            self.expBar = $('#expBar');

            self.load();
        },

        load: function() {
            var self = this;

            self.player.onHitPoints(function() {
                self.calculateHealthBar();
            });

            self.player.onMaxHitPoints(function() {
                self.calculateHealthBar();
            });

            self.player.onExperience(function() {
                self.calculateExpBar();
            });

        },

        calculateHealthBar: function() {
            var self = this,
                scale = self.getScale(),
                width = self.healthBar.width();

            //11 is due to the offset of the #health in the #healthBar
            var diff = Math.floor(width * (self.player.hitPoints / self.player.maxHitPoints) - (11 * scale)),
                prevWidth = self.health.width();

            if (self.player.poison)
                self.toggle('poison');
            else
                self.toggle(diff - 1 > prevWidth ? 'green' : 'white');

            if (diff > width)
                diff = width;

            self.health.css('width', diff + 'px');
            self.healthBarText.text(self.player.hitPoints + '/' + self.player.maxHitPoints);
        },

        calculateExpBar: function() {
            var self = this,
                scale = self.getScale(),
                width = self.expBar.width();

            var experience = self.player.experience - self.player.prevExperience,
                nextExperience = self.player.nextExperience - self.player.prevExperience,
                diff = Math.floor(width * (experience / nextExperience));

            self.exp.css('width', diff + 'px');
        },

        resize: function() {
            var self = this;

            self.calculateHealthBar();
            self.calculateExpBar();
        },

        getScale: function() {
            var self = this,
                scale = self.game.app.getUIScale();

            if (scale < 2)
                scale = 2;

            return scale;
        },

        toggle: function(tClass) {
            let self = this;

            self.health.addClass(tClass);

            setTimeout(function() {
                self.health.removeClass(tClass);
            }, 500);
        }

    });

});
