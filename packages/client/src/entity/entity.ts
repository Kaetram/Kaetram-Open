import Animation from './animation';
import EntityHandler from './entityhandler';
import Sprite, { Animations } from './sprite';

export interface EntityRenderingData {
    scale: number;
    angle: number;

    sprite?: Sprite;
    width?: number;
    height?: number;
    ox?: number;
    oy?: number;
    shadowWidth?: number;
    shadowHeight?: number;
    shadowOffsetY?: number;
}

export default class Entity {
    id: string;
    kind: number;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    name: string;
    sprite: Sprite;
    spriteFlipX: boolean;
    spriteFlipY: boolean;
    animations: Animations;
    currentAnimation: Animation;
    idleSpeed: number;
    shadowOffsetY: number;
    hidden: boolean;
    spriteLoaded: boolean;
    orientation: number;
    visible: boolean;
    fading: boolean;
    handler: EntityHandler;
    angled: boolean;
    angle: number;
    critical: boolean;
    stunned: boolean;
    terror: boolean;
    nonPathable: boolean;
    hasCounter: boolean;
    countdownTime: number;
    counter: number;
    renderingData: EntityRenderingData;
    dirty: boolean;
    dirtyCallback: () => void;
    fadingTime: number;
    blinking: number;
    type: string;
    normalSprite;
    hurtSprite;
    readyCallback: () => void;
    attackRange: number;
    mana: number;
    maxMana: number;
    experience: number;
    level: number;
    movementSpeed: number;
    frozen: boolean;
    teleporting: boolean;
    dead: boolean;
    hitPoints: number;
    pvp: boolean;
    nameColour: string;
    customScale: number;
    nextGridX: number;
    nextGridY: number;
    fadingAlpha: number;

    fadingDuration: number;

    constructor(id: string, kind: number) {
        this.id = id;
        this.kind = kind;

        this.x = 0;
        this.y = 0;
        this.gridX = 0;
        this.gridY = 0;

        this.name = '';

        this.sprite = null;
        this.spriteFlipX = false;
        this.spriteFlipY = false;

        this.animations = null;
        this.currentAnimation = null;
        this.idleSpeed = 450;

        this.shadowOffsetY = 0;
        this.hidden = false;

        this.spriteLoaded = false;
        this.visible = true;
        this.fading = false;
        this.handler = new EntityHandler(this);

        this.angled = false;
        this.angle = 0;

        this.critical = false;
        this.stunned = false;
        this.terror = false;

        this.nonPathable = false;
        this.hasCounter = false;

        this.countdownTime = 0;
        this.counter = 0;

        this.fadingDuration = 1000;

        this.renderingData = {
            scale: -1,
            angle: 0
        };

        this.loadDirty();
    }

    /**
     * This is important for when the client is
     * on a mobile screen. So the sprite has to be
     * handled differently.
     */
    loadDirty(): void {
        this.dirty = true;

        this.dirtyCallback?.();
    }

    fadeIn(time: number): void {
        this.fading = true;
        this.fadingTime = time;
    }

    blink(speed: number): void {
        this.blinking = window.setInterval(() => {
            this.toggleVisibility();
        }, speed);
    }

    stopBlinking(): void {
        if (this.blinking) clearInterval(this.blinking);

        this.setVisible(true);
    }

    idle(o?: number): void {
        o ? o : this.orientation;
    }

    setName(name: string): void {
        this.name = name;
    }

    setSprite(sprite: Sprite): void {
        if (!sprite || (this.sprite && this.sprite.name === sprite.name)) return;

        if (this.type === 'player') sprite.loadHurt = true;

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

    setAnimation(name: string, speed: number, count?: number, onEndCount?: () => void): void {
        if (!this.spriteLoaded || (this.currentAnimation && this.currentAnimation.name === name))
            return;

        const anim = this.getAnimationByName(name);

        if (!anim) return;

        this.currentAnimation = anim;

        if (name.substr(0, 3) === 'atk') this.currentAnimation.reset();

        this.currentAnimation.setSpeed(speed);

        this.currentAnimation.setCount(count ? count : 0, onEndCount || (() => this.idle()));
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    setGridPosition(x: number, y: number): void {
        this.gridX = x;
        this.gridY = y;

        this.setPosition(x * 16, y * 16);
    }

    setCountdown(count: number): void {
        this.counter = count;

        this.countdownTime = new Date().getTime();

        this.hasCounter = true;
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
    }

    setIdleSpeed(idleSpeed: number): void {
        this.idleSpeed = idleSpeed;
    }

    hasWeapon(): boolean {
        return false;
    }

    getDistance(entity: Entity): number {
        const x = Math.abs(this.gridX - entity.gridX),
            y = Math.abs(this.gridY - entity.gridY);

        return x > y ? x : y;
    }

    getCoordDistance(toX: number, toY: number): number {
        const x = Math.abs(this.gridX - toX),
            y = Math.abs(this.gridY - toY);

        return x > y ? x : y;
    }

    inAttackRadius(entity: Entity): boolean {
        return (
            entity &&
            this.getDistance(entity) < 2 &&
            !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)
        );
    }

    inExtraAttackRadius(entity: Entity): boolean {
        return (
            entity &&
            this.getDistance(entity) < 3 &&
            !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)
        );
    }

    getAnimationByName(name: string): Animation {
        if (name in this.animations) return this.animations[name];

        return null;
    }

    getSprite(): string {
        return this.sprite.name;
    }

    getAngle(): number {
        return 0;
    }

    toggleVisibility(): void {
        this.setVisible(!this.visible);
    }

    isVisible(): boolean {
        return this.visible;
    }

    drawNames(): boolean {
        return true;
    }

    hasShadow(): boolean {
        return false;
    }

    hasPath(): boolean {
        return false;
    }

    onReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    onDirty(callback: () => void): void {
        this.dirtyCallback = callback;
    }
}
