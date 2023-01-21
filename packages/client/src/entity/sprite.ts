import Animation from './animation';

import log from '../lib/log';
import Utils from '../utils/util';

import type spriteData from '../../data/sprites.json';

interface AnimationData {
    [name: string]: {
        length: number;
        row: number;
    };
}

export type SpriteData = typeof spriteData[0] & {
    animations: AnimationData;
};

export interface Animations {
    [name: string]: Animation;
}

export default class Sprite {
    public id;

    public name!: string;
    public type!: string;

    public loaded = false;
    public loadHurt = false;

    public offsetX = 0;
    public offsetY = 0;
    // private offsetAngle!: number;

    public hurtSprite = {
        loaded: false
    } as Sprite;

    public image!: HTMLImageElement | HTMLCanvasElement;
    private filepath!: string;

    private loadCallback?(): void;

    public animationData!: AnimationData;

    public width!: number;
    public height!: number;

    public idleSpeed!: number;
    public hasDeathAnimation!: boolean;

    public constructor(private sprite: SpriteData) {
        this.id = sprite.id;
    }

    public load(): void {
        this.image = new Image();

        let { image, filepath } = this;

        image.crossOrigin = 'Anonymous';
        image.src = filepath;

        image.addEventListener('load', () => {
            let { loadHurt } = this;

            this.loaded = true;

            if (loadHurt) this.createHurtSprite();

            this.loadCallback?.();
        });
    }

    public loadSprite(): void {
        let { sprite, id } = this,
            path = `/img/sprites/${id}.png`;

        this.filepath = path;
        this.animationData = sprite.animations;

        this.width = sprite.width ?? Utils.tileSize;
        this.height = sprite.height ?? Utils.tileSize;

        this.offsetX = sprite.offsetX ?? -Utils.tileSize;
        this.offsetY = sprite.offsetY ?? -Utils.tileSize;
        // this.offsetAngle = sprite.offsetAngle ?? 0;

        this.idleSpeed = sprite.idleSpeed || 450;
    }

    public createAnimations(): Animations {
        let { animationData, width, height } = this,
            animations: Animations = {};

        for (let name in animationData) {
            if (!Object.prototype.hasOwnProperty.call(animationData, name)) continue;

            if (name === 'death')
                // Check if sprite has a death animation
                this.hasDeathAnimation = true;

            let { length, row } = animationData[name];

            animations[name] = new Animation(name, length, row, width, height);
        }

        return animations;
    }

    /**
     * This is when an entity gets hit, they turn red then white.
     */
    private createHurtSprite(): void {
        if (!this.loaded) this.load();

        if (this.hurtSprite.loaded) return;

        let canvas = document.createElement('canvas'),
            context = canvas.getContext('2d')!,
            spriteData: ImageData;

        canvas.width = this.image.width;
        canvas.height = this.image.height;

        try {
            context.drawImage(this.image, 0, 0, this.image.width, this.image.height);

            spriteData = context.getImageData(0, 0, this.image.width, this.image.height);

            for (let i = 0; i < spriteData.data.length; i += 4) {
                spriteData.data[i] = 255;
                spriteData.data[i + 1] = spriteData.data[i + 2] = 75;
            }

            context.putImageData(spriteData, 0, 0);

            this.hurtSprite = {
                image: canvas,
                name: 'hurt',
                loaded: true,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                width: this.width,
                height: this.height,
                type: 'hurt'
            } as Sprite;
        } catch (error) {
            log.error('Could not load hurt sprite.', error);
        }
    }

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }
}
