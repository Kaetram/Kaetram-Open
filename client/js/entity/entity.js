/* global Modules, log, _ */

define(['./entityhandler'], function(EntityHandler) {

    return Class.extend({

        init: function(id, kind) {
            var self = this;

            self.id = id;
            self.kind = kind;

            self.x = 0;
            self.y = 0;
            self.gridX = 0;
            self.gridY = 0;

            self.name = '';

            self.sprite = null;
            self.spriteFlipX = false;
            self.spriteFlipY = false;

            self.animations = null;
            self.currentAnimation = null;
            self.idleSpeed = 450;

            self.shadowOffsetY = 0;
            self.hidden = false;

            self.spriteLoaded = false;
            self.visible = true;
            self.fading = false;
            self.handler = new EntityHandler(self);

            self.angled = false;
            self.angle = 0;

            self.critical = false;
            self.stunned = false;
            self.terror = false;

            self.nonPathable = false;
            self.hasCounter = false;

            self.countdownTime = 0;
            self.counter = 0;

            self.renderingData = {
                scale: -1,
                angle: 0
            };

            self.loadDirty();
        },

        /**
         * This is important for when the client is
         * on a mobile screen. So the sprite has to be
         * handled differently.
         */

        loadDirty: function() {
            var self = this;

            self.dirty = true;

            if (self.dirtyCallback)
                self.dirtyCallback();
        },

        fadeIn: function(time) {
            var self = this;

            self.fading = true;
            self.fadingTime = time;
        },

        blink: function(speed) {
            var self = this;

            self.blinking = setInterval(function() {
                self.toggleVisibility();
            }, speed);
        },

        stopBlinking: function() {
            var self = this;

            if (self.blinking)
                clearInterval(self.blinking);

            self.setVisible(true);
        },

        setName: function(name) {
            this.name = name;
        },

        setSprite: function(sprite) {
            var self = this;

            if (!sprite || (self.sprite && self.sprite.name === sprite.name))
                return;

            if (!sprite.loaded)
                sprite.load();

            sprite.name = sprite.id;

            self.sprite = sprite;

            self.normalSprite = self.sprite;
            self.hurtSprite = sprite.getHurtSprite();
            self.animations = sprite.createAnimations();
            self.spriteLoaded = true;

            if (self.readyCallback)
                self.readyCallback();
        },

        setPosition: function(x, y) {
            var self = this;

            self.x = x;
            self.y = y;
        },

        setGridPosition: function(x, y) {
            var self = this;

            self.gridX = x;
            self.gridY = y;

            self.setPosition(x * 16, y * 16);
        },

        setAnimation: function(name, speed, count, onEndCount) {
            var self = this;

            if (!self.spriteLoaded || (self.currentAnimation && self.currentAnimation.name === name))
                return;

            var anim = self.getAnimationByName(name);

            if (!anim)
                return;

            self.currentAnimation = anim;

            if (name.substr(0, 3) === 'atk')
                self.currentAnimation.reset();

            self.currentAnimation.setSpeed(speed);

            self.currentAnimation.setCount(count ? count : 0, onEndCount || function() {
                self.idle();
            });
        },

        setCountdown: function(count) {
            var self = this;

            self.counter = count;

            self.countdownTime = new Date().getTime();

            self.hasCounter = true;

        },

        setVisible: function(visible) {
            this.visible = visible
        },

        setIdleSpeed: function(idleSpeed) {
            this.idleSpeed = idleSpeed;
        },

        hasWeapon: function() {
            return false;
        },

        getDistance: function(entity) {
            var self = this,
                x = Math.abs(self.gridX - entity.gridX),
                y = Math.abs(self.gridY - entity.gridY);

            return x > y ? x : y;
        },

        getCoordDistance: function(toX, toY) {
            var self = this,
                x = Math.abs(self.gridX - toX),
                y = Math.abs(self.gridY - toY);

            return x > y ? x : y;
        },

        inAttackRadius: function(entity) {
            return entity && this.getDistance(entity) < 2 && !(this.gridX !== entity.gridX && this.gridY !== entity.gridY);
        },

        inExtraAttackRadius: function(entity) {
            return entity && this.getDistance(entity) < 3 && !(this.gridX !== entity.gridX && this.gridY !== entity.gridY);
        },

        getAnimationByName: function(name) {
            if (name in this.animations)
                return this.animations[name];

            return null;
        },

        getSprite: function() {
            return this.sprite.name;
        },

        toggleVisibility: function() {
            this.setVisible(!this.visible);
        },

        isVisible: function() {
            return this.visible;
        },

        hasShadow: function() {
            return false;
        },

        hasPath: function() {
            return false;
        },

        onReady: function(callback) {
            this.readyCallback = callback;
        },

        onDirty: function(callback) {
            this.dirtyCallback = callback;
        }

    });

});