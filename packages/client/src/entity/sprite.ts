import spriteData from '../../data/sprites.json';
import log from '../lib/log';
import Animation from './animation';

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
    public id = this.sprite.id;

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

    public constructor(private sprite: SpriteData) {}

    public load(): void {
        this.image = new Image();

        const { image, filepath } = this;

        image.crossOrigin = 'Anonymous';
        image.src = filepath;

        image.addEventListener('load', () => {
            const { loadHurt } = this;

            this.loaded = true;

            if (loadHurt) this.createHurtSprite();

            this.loadCallback?.();
        });
    }

    public async loadSprite(): Promise<void> {
        const { sprite, id } = this;

        const { default: path } = await import(`../../img/sprites/${id}.png`);

        this.filepath = path;
        this.animationData = sprite.animations;

        this.width = sprite.width;
        this.height = sprite.height;

        this.offsetX = sprite.offsetX ?? -16;
        this.offsetY = sprite.offsetY ?? -16;
        // this.offsetAngle = sprite.offsetAngle ?? 0;

        this.idleSpeed = sprite.idleSpeed ?? 450;
    }

    public async update(): Promise<void> {
        await this.loadSprite();

        this.load();
    }

    public createAnimations(): Animations {
        const { animationData, width, height } = this;

        const animations: Animations = {};

        for (const name in animationData) {
            if (!Object.prototype.hasOwnProperty.call(animationData, name)) continue;

            if (name === 'death')
                // Check if sprite has a death animation
                this.hasDeathAnimation = true;

            const { length, row } = animationData[name];

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

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
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
            } as Sprite;
        } catch (error) {
            log.error('Could not load hurt sprite.', error);
        }
    }

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }
}
