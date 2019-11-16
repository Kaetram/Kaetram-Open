define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, intrface) {
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

            if (scale < 2)
                scale = 2;

            //11 is due to the offset of the #health in the #healthBar
            var diff = Math.floor(width * (self.player.hitPoints / self.player.maxHitPoints) - (11 * scale)),
                prevWidth = self.health.width();

            if (prevWidth > diff) {
                self.health.addClass('white');

                setTimeout(function() {
                    self.health.removeClass('white');
                }, 500);
            } else if (diff - 1 > prevWidth) {
                self.health.addClass('green');

                setTimeout(function() {
                    self.health.removeClass('green');
                }, 500);
            }

            self.health.css('width', diff + 'px');
            self.healthBarText.text(self.player.hitPoints + '/' + self.player.maxHitPoints);
        },

        calculateExpBar: function() {
            var self = this,
                scale = self.getScale(),
                width = self.expBar.width();

            if (scale < 2)
                scale = 2;

            var experience = self.player.experience - self.player.prevExperience,
                nextExperience = self.player.nextExperience - self.player.prevExperience;

            var diff = Math.floor(width * (experience / nextExperience));

            self.exp.css('width', diff + 'px');
        },

        resize: function() {
            var self = this;

            self.calculateHealthBar();
            self.calculateExpBar();
        },

        getScale: function() {
            return this.game.app.getUIScale();
        }

    });

});
