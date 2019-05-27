/* global log, _ */

define(['../entity/sprite', '../entity/animation'], function(Sprite, Animation) {
    /**
     * Class responsible for loading all the necessary sprites from the JSON.
     */

    return Class.extend({

        init: function(renderer) {
            var self = this;

            self.renderer = renderer;

            self.sprites = {};

            self.sparksAnimation = null;

            $.getJSON('data/sprites.json', function(json) {
                self.load(json);
            });

            self.loadAnimations();
        },

        load: function(spriteData) {
            var self = this;

            _.each(spriteData, function(sprite) {
                self.sprites[sprite.id] = new Sprite(sprite, self.renderer.drawingScale);
            });

            log.info('Finished loading sprite data...');

            if (self.loadedSpritesCallback)
                self.loadedSpritesCallback();
        },

        loadAnimations: function() {
            var self = this;

            self.sparksAnimation = new Animation('idle_down', 6, 0, 16, 16);
            self.sparksAnimation.setSpeed(120);
        },

        updateSprites: function() {
            var self = this;

            _.each(self.sprites, function(sprite) {
                sprite.update(self.renderer.getDrawingScale());
            });

            log.info('Updated sprites to: ' + self.renderer.getDrawingScale());
        },

        onLoadedSprites: function(callback) {
            this.loadedSpritesCallback = callback;
        }

    });

});