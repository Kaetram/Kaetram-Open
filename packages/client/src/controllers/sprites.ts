import _ from 'lodash';

import spriteData from '../../data/sprites.json';
import Animation from '../entity/animation';
import Sprite from '../entity/sprite';
import log from '../lib/log';

import type { SpriteData } from '../entity/sprite';

export default class SpritesController {
    public sprites: { [id: string]: Sprite } = {};
    public sparksAnimation!: Animation;

    public constructor() {
        this.loadAnimations();
    }

    public load(): void {
        let sprites = spriteData as SpriteData[];

        for (let data of sprites) {
            let sprite = new Sprite(data);

            sprite.loadSprite();

            this.sprites[data.id] = sprite;
        }

        log.debug('Finished loading sprite data...');
    }

    private loadAnimations(): void {
        this.sparksAnimation = new Animation('idle_down', 6, 0, 16, 16);
        this.sparksAnimation.setSpeed(120);
    }

    public updateSprites(): void {
        _.each(this.sprites, (sprite) => sprite.update());

        log.debug('Sprites updated upon scaling.');
    }
}
