import _ from 'lodash';

import log from '../lib/log';
import Sprite from '../entity/sprite';
import Animation from '../entity/animation';

import spriteData from '../../data/sprites.json';

import type { SpriteData } from '../entity/sprite';

export default class SpritesController {
    public sprites: { [id: string]: Sprite } = {};
    public sparksAnimation: Animation = new Animation('idle_down', 6, 0, 16, 16);

    public constructor() {
        this.sparksAnimation.setSpeed(120);
    }

    /**
     * Iterates through all the sprites in the JSON file
     * and initializes sprites based on their key and data.
     */

    public load(): void {
        for (let data of spriteData as SpriteData[]) {
            let sprite = new Sprite(data);

            sprite.loadSprite();

            this.sprites[data.id] = sprite;
        }

        log.debug('Finished loading sprite data...');
    }

    /**
     * Iterates through all the sprites loaded and sends
     * an update signal.
     */

    public updateSprites(): void {
        _.each(this.sprites, (sprite) => sprite.update());

        log.debug('Sprites updated upon scaling.');
    }
}
