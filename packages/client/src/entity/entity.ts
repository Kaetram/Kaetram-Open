import { Modules } from '@kaetram/common/network';

import type Animation from './animation';
import type Sprite from './sprite';
import type { Animations } from './sprite';

export interface EntityRenderingData {
    scale: number;
    angle: number;

    sprite: Sprite;
    width: number;
    height: number;

    ox: number;
    oy: number;

    shadowWidth: number;
    shadowHeight: number;
    shadowOffsetY: number;
}

export default abstract class Entity {
    public x = 0;
    public y = 0;
    public gridX = 0;
    public gridY = 0;

    public name = '';

    public sprite!: Sprite;

    public spriteFlipX = false;
    public spriteFlipY = false;

    private animations!: Animations;
    public currentAnimation!: Animation | null;
    protected idleSpeed = 450;

    public shadowOffsetY = 0;
    public hidden = false;

    public spriteLoaded = false;
    private visible = true;
    public fading = false;

    public angled = false;
    public angle = 0;

    public critical = false;
    public stunned = false;
    public terror = false;

    // public nonPathable = false;
    public hasCounter = false;

    public countdownTime = 0;
    public counter = 0;
    public fadingDuration = 1000;

    public orientation!: Modules.Orientation;

    public renderingData = {
        scale: -1,
        angle: 0
    } as EntityRenderingData;

    // private dirty = false;
    // private dirtyCallback?: () => void;

    public fadingTime!: number;
    private blinking!: number;

    public normalSprite!: Sprite;
    public hurtSprite!: Sprite;

    private readyCallback?(): void;

    public attackRange!: number;
    public mana!: number | number[];
    public maxMana!: number;
    public experience!: number;
    public level!: number;
    public movementSpeed!: number;
    public frozen!: boolean;
    public teleporting!: boolean;
    public dead!: boolean;
    public hitPoints!: number | number[];
    public pvp!: boolean;
    public nameColour!: string;
    public customScale!: number;
    public nextGridX!: number;
    public nextGridY!: number;
    public fadingAlpha!: number;

    protected constructor(public id: string, public type: string) {
        // this.loadDirty();
    }

    // /**
    //  * This is important for when the client is
    //  * on a mobile screen. So the sprite has to be
    //  * handled differently.
    //  */
    // protected loadDirty(): void {
    //     this.dirty = true;

    //     this.dirtyCallback?.();
    // }

    public fadeIn(time: number): void {
        this.fading = true;
        this.fadingTime = time;
    }

    public blink(speed: number): void {
        this.blinking = window.setInterval(() => this.toggleVisibility(), speed);
    }

    protected stopBlinking(): void {
        let { blinking } = this;

        if (blinking) clearInterval(blinking);

        this.setVisible(true);
    }

    public idle(): void {
        //
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setSprite(sprite: Sprite | undefined): void {
        if (!sprite || (this.sprite && this.sprite.name === sprite.name)) return;

        let { type } = this;

        if (type === 'player') sprite.loadHurt = true;

        if (!sprite.loaded) sprite.load();

        sprite.name = sprite.id;

        this.sprite = sprite;

        this.normalSprite = this.sprite;
        this.animations = sprite.createAnimations();

        sprite.onLoad(() => {
            if (sprite.loadHurt) this.hurtSprite = sprite.hurtSprite;
        });

        this.spriteLoaded = true;

        this.readyCallback?.();
    }

    public setAnimation(name: string, speed: number, count = 0, onEndCount?: () => void): void {
        let { spriteLoaded, animations } = this;

        if (!spriteLoaded || this.currentAnimation?.name === name) return;

        let anim = animations[name];

        if (!anim) return;

        this.currentAnimation = anim;

        let { currentAnimation } = this;

        if (name.startsWith('atk')) currentAnimation.reset();

        currentAnimation.setSpeed(speed);

        currentAnimation.setCount(count, onEndCount || (() => this.idle()));
    }

    private setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    public setGridPosition(x: number, y: number): void {
        this.gridX = x;
        this.gridY = y;

        this.setPosition(x * 16, y * 16);
    }

    public setCountdown(count: number): void {
        this.counter = count;

        this.countdownTime = Date.now();

        this.hasCounter = true;
    }

    private setVisible(visible: boolean): void {
        this.visible = visible;
    }

    public setIdleSpeed(idleSpeed: number): void {
        this.idleSpeed = idleSpeed;
    }

    public hasWeapon(): boolean {
        return false;
    }

    public getDistance(entity: Entity): number {
        let { gridX, gridY } = this,
            x = Math.abs(gridX - entity.gridX),
            y = Math.abs(gridY - entity.gridY);

        return x > y ? x : y;
    }

    // getCoordDistance(toX: number, toY: number): number {
    //     let x = Math.abs(this.gridX - toX);
    //     let y = Math.abs(this.gridY - toY);

    //     return x > y ? x : y;
    // }

    // inAttackRadius(entity: Entity): boolean {
    //     return (
    //         entity &&
    //         this.getDistance(entity) < 2 &&
    //         !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)
    //     );
    // }

    // inExtraAttackRadius(entity: Entity): boolean {
    //     return (
    //         entity &&
    //         this.getDistance(entity) < 3 &&
    //         !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)
    //     );
    // }

    // getSprite(): string {
    //     return this.sprite.name;
    // }

    public getAngle(): number {
        return 0;
    }

    private toggleVisibility(): void {
        this.setVisible(!this.visible);
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public drawNames(): boolean {
        return true;
    }

    public hasShadow(): boolean {
        return false;
    }

    public hasPath(): boolean {
        return false;
    }

    // onReady(callback: () => void): void {
    //     this.readyCallback = callback;
    // }

    // onDirty(callback: () => void): void {
    //     this.dirtyCallback = callback;
    // }
}
