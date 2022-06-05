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

    public animation!: Animation | null;

    private animations!: Animations;
    protected idleSpeed = 450;

    public shadowOffsetY = 0;
    public hidden = false;
    public targeted = false;

    public spriteLoaded = false;
    private visible = true;
    public fading = false;

    public angled = false;
    public angle = 0;

    public critical = false;
    public stunned = false;
    public terror = false;

    public hasCounter = false;

    public countdownTime = 0;
    public counter = 0;
    public fadingDuration = 1000;

    public orientation!: Modules.Orientation;

    public fadingTime!: number;
    private blinking!: number;

    public normalSprite!: Sprite;
    public hurtSprite!: Sprite;

    private readyCallback?(): void;

    public attackRange!: number;
    public mana!: number | number[];
    public maxMana!: number;
    public level = 0;
    public experience = 0;
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
    public lastUpdate = Date.now();

    public constructor(public instance = '', public type: Modules.EntityType) {}

    public fadeIn(time: number): void {
        this.fading = true;
        this.fadingTime = time;
    }

    public blink(speed = 150): void {
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

    public setSprite(sprite: Sprite | undefined): void {
        if (!sprite || (this.sprite && this.sprite.name === sprite.name)) return;

        if (this.isPlayer()) sprite.loadHurt = true;

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
        if (!this.spriteLoaded || this.animation?.name === name) return;

        let anim = this.animations[name];

        if (!anim) return;

        this.animation = anim;

        if (name.startsWith('atk')) this.animation.reset();

        this.animation.setSpeed(speed);

        this.animation.setCount(count, onEndCount || (() => this.idle()));
    }

    /**
     * Animates the character's death animation and
     * creates a callback if needed.
     * @param callback Optional parameter for when the animation finishes.
     * @param speed Optional parameter for the animation speed.
     * @param count How many times to repeat the animation.
     */

    public animateDeath(callback?: () => void, speed = 120, count = 1): void {
        this.setAnimation('death', speed, count, callback);
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

    public getAngle(): number {
        return 0;
    }

    public getTimeDiff(): number {
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

    public isPlayer(): boolean {
        return this.type === Modules.EntityType.Player;
    }

    public isMob(): boolean {
        return this.type === Modules.EntityType.Mob;
    }

    public isNPC(): boolean {
        return this.type === Modules.EntityType.NPC;
    }

    public isItem(): boolean {
        return this.type === Modules.EntityType.Item;
    }

    public isChest(): boolean {
        return this.type === Modules.EntityType.Chest;
    }

    public isProjectile(): boolean {
        return this.type === Modules.EntityType.Projectile;
    }

    public isObject(): boolean {
        return this.type === Modules.EntityType.Object;
    }
}
