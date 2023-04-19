import Animation from './animation';

import Utils from '../utils/util';

export interface AnimationData {
    [name: string]: {
        length: number;
        row: number;
    };
}
export interface SpriteData {
    id: string;
    width?: number;
    height?: number;
    idleSpeed?: number;
    animations?: AnimationData;
    offsetX?: number;
    offsetY?: number;
}
export interface Animations {
    [name: string]: Animation;
}

export default class Sprite {
    public key = '';

    private path = '';

    public width = Utils.tileSize;
    public height = Utils.tileSize;

    public offsetX = -Utils.tileSize;
    public offsetY = -Utils.tileSize;

    public idleSpeed = 450;

    public loaded = false;
    public loading = false;
    public hasDeathAnimation = false;

    public animations: Animations = {};

    public image!: HTMLImageElement | HTMLCanvasElement;

    public hurtSprite!: Sprite;
    public silhouetteSprite!: Sprite;

    private loadCallback?(): void;

    public constructor(public data: SpriteData) {
        this.key = this.data.id;

        this.path = `/img/sprites/${this.key}.png`;

        this.width = this.data.width || this.width;
        this.height = this.data.height || this.height;

        this.offsetX = this.data.offsetX ?? this.offsetX;
        this.offsetY = this.data.offsetY ?? this.offsetY;

        this.idleSpeed = this.data.idleSpeed || this.idleSpeed;

        // Have the animations prepared for the sprite.
        this.loadAnimations();
    }

    /**
     * Loads the sprite image information for an entity. The `load` function
     * is called on a demand basis, instead of initializing all sprites when
     * we load the client, we initialize it as we find entities throughout the
     * world. This may be changed in the future.
     */

    public load(): void {
        if (this.loading || this.loaded) return;

        this.loading = true;

        this.image = new Image();

        this.image.crossOrigin = 'Anonymous';
        this.image.src = this.path;

        // Callback for when the image successfully loads.
        this.image.addEventListener('load', () => {
            this.loaded = true;

            /**
             * We ignore small sprites and item sprites when drawing hurt sprites.
             * The logic we're using is skipping keys that start with `items/*` and
             * sprites whose width is less than 96 (assumed 4 animations and a small
             * sprite of 24x24).
             */

            if (!this.key.startsWith('items/') && this.image.width > 96)
                this.hurtSprite = Utils.getHurtSprite(this);

            // Load the silhouette sprite for the entity.
            this.silhouetteSprite = Utils.getSilhouetteSprite(this);

            // Loading only done after the hurt sprite.
            this.loading = false;

            this.loadCallback?.();
        });
    }

    /**
     * Loads the animations for the said sprite. Parses through all of the animation
     * objects and creates a new animation instance for each one. We also check if the
     * sprite has a specific death animation, otherwise the generic one will be used.
     */

    private loadAnimations(): void {
        if (!this.data.animations)
            this.data.animations = Utils.getDefaultAnimations(this.key.startsWith('items/'));

        for (let name in this.data.animations) {
            let info = this.data.animations[name];

            // Use a specified death animation if it exists, set the flag to true for later use.
            if (name === 'death') this.hasDeathAnimation = true;

            // Create an animation for the sprite.
            this.animations[name] = new Animation(
                name,
                info.length,
                info.row,
                this.width,
                this.height
            );
        }
    }

    /**
     * Callback for when the sprite has successfully loaded. Used to load
     * additional extra information afterwards.
     */

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }
}
