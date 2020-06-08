import _ from 'underscore';
import $ from 'jquery';
import log from '../lib/log';
import Sprite from '../entity/sprite';
import Animation from '../entity/animation';

export default class SpritesController {
    constructor(renderer) {
        var self = this;

        self.renderer = renderer;

        self.sprites = {};

        self.sparksAnimation = null;

        $.getJSON('data/sprites.json', function (json) {
            self.load(json);
        });

        self.loadAnimations();
    }

    load(spriteData) {
        var self = this;

        _.each(spriteData, function (sprite) {
            self.sprites[sprite.id] = new Sprite(sprite);
        });

        if (self.renderer.game.isDebug())
            log.info('Finished loading sprite data...');

        if (self.loadedSpritesCallback) self.loadedSpritesCallback();
    }

    loadAnimations() {
        var self = this;

        self.sparksAnimation = new Animation('idle_down', 6, 0, 16, 16);
        self.sparksAnimation.setSpeed(120);
    }

    updateSprites() {
        var self = this;

        _.each(self.sprites, function (sprite) {
            sprite.update();
        });

        if (self.renderer.game.isDebug())
            log.info('Sprites updated upon scaling.');
    }

    onLoadedSprites(callback) {
        this.loadedSpritesCallback = callback;
    }
}
