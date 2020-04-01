import _ from 'underscore';

import Animation from '../entity/animation';
import Sprite from '../entity/sprite';
import Renderer from '../renderer/renderer';

/**
 * Class responsible for loading all the necessary sprites from the JSON.
 */

export default class Sprites {
    renderer: Renderer;
    sprites: { [key: string]: Sprite };
    sparksAnimation: Animation;
    loadedSpritesCallback: Callback;

    constructor(renderer) {
        this.renderer = renderer;

        this.sprites = {};

        this.sparksAnimation = null;

        $.getJSON('data/sprites.json', (json) => {
            this.load(json);
        });

        this.loadAnimations();
    }

    load(spriteData) {
        _.each(spriteData, (sprite: Sprite) => {
            this.sprites[sprite.id] = new Sprite(sprite, this.renderer.scale);
        });

        if (this.renderer.game.isDebug()) {
            console.info('Finished loading sprite data...');
        }

        if (this.loadedSpritesCallback) this.loadedSpritesCallback();
    }

    loadAnimations() {
        this.sparksAnimation = new Animation('idle_down', 6, 0, 16, 16);
        this.sparksAnimation.setSpeed(120);
    }

    updateSprites() {
        _.each(this.sprites, (sprite) => {
            sprite.update(this.renderer.getScale());
        });

        if (this.renderer.game.isDebug()) {
            console.info(
                `Updated sprites to scale: ${this.renderer.getScale()}`
            );
        }
    }

    onLoadedSprites(callback) {
        this.loadedSpritesCallback = callback;
    }
}
