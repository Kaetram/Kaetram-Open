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

        this.load();
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
     * Grabs a sprite object based on the name string.
     * @param name The string of the sprite we're attempting to grab.
     * @returns A sprite object if found, otherwise undefined.
     */

    public get(name: string): Sprite {
        return this.sprites[name];
    }

    /**
     * @returns The death sprite used for when an entity
     * dies or sometimes when a player teleports.
     */

    public getDeath(): Sprite {
        return this.get('death');
    }
}
