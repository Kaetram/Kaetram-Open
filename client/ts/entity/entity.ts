/* global Modules, log, _ */

import EntityHandler from './entityhandler';

export default class Entity {
    id: any;
    kind: any;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    name: string;
    sprite: any;
    spriteFlipX: boolean;
    spriteFlipY: boolean;
    animations: any;
    currentAnimation: any;
    idleSpeed: number;
    shadowOffsetY: number;
    hidden: boolean;
    spriteLoaded: boolean;
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
    renderingData: { [key: string]: any };
    dirty: boolean;
    dirtyCallback: any;
    fadingTime: any;
    blinking: any;
    type: string;
    normalSprite: any;
    hurtSprite: any;
    readyCallback: any;
    constructor(id, kind) {
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

    loadDirty() {
        this.dirty = true;

        if (this.dirtyCallback) this.dirtyCallback();
    }

    fadeIn(time) {
        this.fading = true;
        this.fadingTime = time;
    }

    blink(speed) {
        this.blinking = setInterval(() => {
            this.toggleVisibility();
        }, speed);
    }

    stopBlinking() {
        if (this.blinking) clearInterval(this.blinking);

        this.setVisible(true);
    }

    setName(name) {
        this.name = name;
    }

    setSprite(sprite) {
        if (!sprite || (this.sprite && this.sprite.name === sprite.name))
            return;

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

        if (this.readyCallback) this.readyCallback();
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setGridPosition(x, y) {
        this.gridX = x;
        this.gridY = y;

        this.setPosition(x * 16, y * 16);
    }

    setAnimation(name, speed, count?, onEndCount?) {
        if (
            !this.spriteLoaded ||
            (this.currentAnimation && this.currentAnimation.name === name)
        )
            return;

        const anim = this.getAnimationByName(name);

        if (!anim) return;

        this.currentAnimation = anim;

        if (name.substr(0, 3) === 'atk') this.currentAnimation.reset();

        this.currentAnimation.setSpeed(speed);

        this.currentAnimation.setCount(
            count || 0,
            onEndCount ||
                (() => {
                    this.idle();
                })
        );
    }

    idle() {
        // throw new Error('Method not implemented.');
    }

    setCountdown(count) {
        this.counter = count;

        this.countdownTime = new Date().getTime();

        this.hasCounter = true;
    }

    setVisible(visible) {
        this.visible = visible;
    }

    setIdleSpeed(idleSpeed) {
        this.idleSpeed = idleSpeed;
    }

    hasWeapon() {
        return false;
    }

    getDistance(entity) {
        const x = Math.abs(this.gridX - entity.gridX);
        const y = Math.abs(this.gridY - entity.gridY);

        return x > y ? x : y;
    }

    getCoordDistance(toX, toY) {
        const x = Math.abs(this.gridX - toX);
        const y = Math.abs(this.gridY - toY);

        return x > y ? x : y;
    }

    inAttackRadius(entity) {
        return (
            entity &&
            this.getDistance(entity) < 2 &&
            !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)
        );
    }

    inExtraAttackRadius(entity) {
        return (
            entity &&
            this.getDistance(entity) < 3 &&
            !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)
        );
    }

    getAnimationByName(name) {
        if (name in this.animations) return this.animations[name];

        return null;
    }

    getSprite() {
        return this.sprite.name;
    }

    toggleVisibility() {
        this.setVisible(!this.visible);
    }

    isVisible() {
        return this.visible;
    }

    drawNames() {
        return true;
    }

    hasShadow() {
        return false;
    }

    hasPath() {
        return false;
    }

    onReady(callback) {
        this.readyCallback = callback;
    }

    onDirty(callback) {
        this.dirtyCallback = callback;
    }
}
