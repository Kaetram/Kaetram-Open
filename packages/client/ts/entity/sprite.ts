import Animation from './animation';
import log from '../lib/log';
import spriteData from '../../data/sprites.json';

export type SpriteData = typeof spriteData[0];

export interface Animations {
    [name: string]: Animation;
}

export default class Sprite {
    sprite: SpriteData;
    name: string;
    id: string;
    loaded: boolean;
    loadHurt: boolean;
    offsetX: number;
    offsetY: number;
    offsetAngle: number;
    hurtSprite: {
        loaded: boolean;
        image?: HTMLCanvasElement;
        offsetX?: number;
        offsetY?: number;
        width?: number;
        height?: number;
        type?: string;
    };
    image: HTMLImageElement;
    filepath: string;
    loadCallback: () => void;
    animationData;
    width: number;
    height: number;
    offfsetAngle: number;
    idleSpeed: number;
    hasDeathAnimation: boolean;

    constructor(sprite: SpriteData) {
        this.sprite = sprite;

        this.id = sprite.id;

        this.loaded = false;
        this.loadHurt = false;

        this.offsetX = 0;
        this.offsetY = 0;
        this.offsetAngle = 0;

        this.hurtSprite = {
            loaded: false
        };

        this.loadSprite();
    }

    load(): void {
        this.image = new Image();
        this.image.crossOrigin = 'Anonymous';
        this.image.src = this.filepath;

        this.image.onload = () => {
            this.loaded = true;

            if (this.loadHurt) this.createHurtSprite();

            this.loadCallback?.();
        };
    }

    async loadSprite(): Promise<void> {
        const sprite = this.sprite;

        this.filepath = (await import(`../../img/sprites/${this.id}.png`)).default;
        this.animationData = sprite.animations;

        this.width = sprite.width;
        this.height = sprite.height;

        this.offsetX = sprite.offsetX !== undefined ? sprite.offsetX : -16;
        this.offsetY = sprite.offsetY !== undefined ? sprite.offsetY : -16;
        this.offfsetAngle = sprite.offsetAngle !== undefined ? sprite.offsetAngle : 0;

        this.idleSpeed = sprite.idleSpeed !== undefined ? sprite.idleSpeed : 450;
    }

    async update(): Promise<void> {
        await this.loadSprite();
        this.load();
    }

    createAnimations(): Animations {
        const animations: Animations = {};

        for (const name in this.animationData) {
            if (Object.prototype.hasOwnProperty.call(this.animationData, name)) {
                if (name === 'death')
                    // Check if sprite has a death animation
                    this.hasDeathAnimation = true;

                const a = this.animationData[name];

                animations[name] = new Animation(name, a.length, a.row, this.width, this.height);
            }
        }

        return animations;
    }

    /**
     * This is when an entity gets hit, they turn red then white.
     */
    createHurtSprite(): void {
        if (!this.loaded) this.load();

        if (this.hurtSprite.loaded) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        let spriteData: ImageData;

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
                loaded: true,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                width: this.width,
                height: this.height,
                type: 'hurt'
            };
        } catch (e) {
            log.error('Could not load hurt sprite.');
            log.error(e);
        }
    }

    onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }
}
