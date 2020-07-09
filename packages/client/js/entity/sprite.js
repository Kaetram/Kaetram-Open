import Animation from './animation';
import log from '../lib/log';

export default class Sprite {
    constructor(sprite) {
        var self = this;

        self.sprite = sprite;

        self.id = sprite.id;

        self.loaded = false;
        self.loadHurt = false;

        self.offsetX = 0;
        self.offsetY = 0;
        self.offsetAngle = 0;

        self.hurtSprite = {
            loaded: false,
        };

        self.loadSprite();
    }

    load() {
        var self = this;

        self.image = new Image();
        self.image.crossOrigin = 'Anonymous';
        self.image.src = self.filepath;

        self.image.onload = function() {
            self.loaded = true;

            if (self.loadHurt) self.createHurtSprite();

            if (self.loadCallback) self.loadCallback();
        };
    }

    loadSprite() {
        var self = this,
            sprite = self.sprite;

        self.filepath = 'img/sprites/' + self.id + '.png';
        self.animationData = sprite.animations;

        self.width = sprite.width;
        self.height = sprite.height;

        self.offsetX = sprite.offsetX !== undefined ? sprite.offsetX : -16;
        self.offsetY = sprite.offsetY !== undefined ? sprite.offsetY : -16;
        self.offfsetAngle = sprite.offsetAngle !== undefined ? sprite.offsetAngle : 0;

        self.idleSpeed = sprite.idleSpeed !== undefined ? sprite.idleSpeed : 450;
    }

    update() {
        var self = this;

        self.loadSprite();
        self.load();
    }

    createAnimations() {
        var self = this,
            animations = {};

        for (var name in self.animationData) {
            if (self.animationData.hasOwnProperty(name)) {
                if (name === 'death')
                    // Check if sprite has a death animation
                    self.hasDeathAnimation = true;

                var a = self.animationData[name];

                animations[name] = new Animation(name, a.length, a.row, self.width, self.height);
            }
        }

        return animations;
    }

    /**
     * This is when an entity gets hit, they turn red then white.
     */

    createHurtSprite() {
        var self = this;

        if (!self.loaded) self.load();

        if (self.hurtSprite.loaded) return;

        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d'),
            spriteData,
            data;

        canvas.width = self.image.width;
        canvas.height = self.image.height;

        try {
            context.drawImage(self.image, 0, 0, self.image.width, self.image.height);

            spriteData = context.getImageData(0, 0, self.image.width, self.image.height);

            for (var i = 0; i < spriteData.data.length; i += 4) {
                spriteData.data[i] = 255;
                spriteData.data[i + 1] = spriteData.data[i + 2] = 75;
            }

            context.putImageData(spriteData, 0, 0);

            self.hurtSprite = {
                image: canvas,
                loaded: true,
                offsetX: self.offsetX,
                offsetY: self.offsetY,
                width: self.width,
                height: self.height,
                type: 'hurt',
            };
        } catch (e) {
            log.error('Could not load hurt sprite.');
            log.error(e);
        }
    }

    onLoad(callback) {
        this.loadCallback = callback;
    }
}
