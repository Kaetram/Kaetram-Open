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

    public width = Utils.tileSize; // Default tile size of 16 if not specified.
    public height = Utils.tileSize;

    public offsetX = 0;
    public offsetY = 0;

    public idleSpeed = 250;

    public loaded = false;
    public loading = false;
    public hasDeathAnimation = false;

    public animations: Animations = {};

    public image!: HTMLImageElement | HTMLCanvasElement;

    public hurtSprite!: Sprite;
    public silhouetteSprite!: Sprite;

    private loadCallback?(): void;

    public constructor(public data: SpriteData) {
        this.key = data.id;

        this.path = `/img/sprites/${data.id}.png`;

        let dimensions = Utils.getDefaultEquipmentDimension(this.getSubType()),
            offset = Utils.getDefaultOffset(this.getType());

        this.width = this.data.width ?? dimensions;
        this.height = this.data.height ?? dimensions;

        this.offsetX = this.data.offsetX ?? offset.x;
        this.offsetY = this.data.offsetY ?? offset.y;

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

            // Ignore drawing hurt sprites for item types and very small sprites.
            if (!this.key.includes('items') && this.image.width > 96)
                this.hurtSprite = Utils.getHurtSprite(this);

            // Load the silhouette sprite for the entity if it has one.
            if (this.hasSilhouette()) this.silhouetteSprite = Utils.getSilhouetteSprite(this);

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
            this.data.animations = Utils.getDefaultAnimations(this.getType());

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
     * The type is determined by the first element in the path of the key. So
     * if the path is `items/leather` then the type is `items`. This is used
     * for default animations.
     * @returns The type of the sprite.
     */

    private getType(): string {
        if (!this.key.includes('/')) return 'items';

        return this.key.split('/')[0];
    }

    /**
     * The subtype is the second index after splitting the path format
     * of the sprite. So for example, for the path player/weapon/sword, the
     * subtype would be the weapon. If the provided sprite doesn't have a subtype
     * we just return an empty string.
     * @return The subtype based on the sprite's key, otherwise an empty string.
     */

    private getSubType(): string {
        let blocks = this.key.split('/');

        if (blocks.length < 3) return '';

        return blocks[1];
    }

    /**
     * Checks whether or not to draw a silhouette based on the sprite type.
     * We do not need to have a silhouette for everything, only for mobs,
     * players, and npcs.
     * @returns Whether or not the sprite has a silhouette.
     */

    private hasSilhouette(): boolean {
        let type = this.getType();

        return type === 'mobs' || type === 'player' || type === 'npcs';
    }

    /**
     * Callback for when the sprite has successfully loaded. Used to load
     * additional extra information afterwards.
     */

    public onLoad(callback: () => void): void {
        this.loadCallback = callback;
    }
}
