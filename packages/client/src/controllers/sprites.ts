import log from '../lib/log';
import Sprite from '../entity/sprite';
import spriteData from '../../data/sprites.json';

import type Animation from '../entity/animation';
import type { SpriteData } from '../entity/sprite';

export default class SpritesController {
    public sprites: { [id: string]: Sprite } = {};
    public preloadedAnimations: Animation[] = []; // Used for updating.

    public constructor() {
        this.load();
    }

    /**
     * Iterates through all the sprites in the JSON file
     * and initializes sprites based on their key and data.
     */

    public load(): void {
        for (let data of spriteData as SpriteData[]) {
            let sprite = new Sprite(data);

            this.sprites[sprite.key] = sprite;

            // Some sprites are required to be preloaded.
            if (sprite.preload) {
                sprite.load();

                let idleDown = sprite.animations.idle_down;

                // Some of the preloaded sprites have animations that we can use.
                if (idleDown?.length > 1) {
                    this.preloadedAnimations.push(idleDown);

                    idleDown.setSpeed(sprite.idleSpeed || 200);
                }
            }
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
