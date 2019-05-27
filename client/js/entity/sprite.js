/* global log, _ */

define(['./animation'], function(Animation) {

    return Class.extend({

        init: function(sprite, scale) {
            var self = this;

            self.sprite = sprite;
            self.scale = scale;

            self.id = sprite.id;

            self.loaded = false;

            self.offsetX = 0;
            self.offsetY = 0;
            self.offsetAngle = 0;

            self.whiteSprite = {
                loaded: false
            };

            self.loadSprite();
        },

        load: function() {
            var self = this;

            self.image = new Image();
            self.image.crossOrigin = 'Anonymous';
            self.image.src = self.filepath;

            self.image.onload = function() {
                self.loaded = true;

                if (self.onLoadCallback)
                    self.onLoadCallback();
            };
        },

        loadSprite: function() {
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
        },

        update: function(newScale) {
            var self = this;

            self.scale = newScale;

            self.loadSprite();
            self.load();
        },

        createAnimations: function() {
            var self = this,
                animations = {};

            for (var name in self.animationData) {
                if (self.animationData.hasOwnProperty(name)) {
                    var a = self.animationData[name];

                    animations[name] = new Animation(name, a.length, a.row, self.width, self.height);
                }
            }

            return animations;
        },

        /**
         * This is when an entity gets hit, they turn red then white.
         */

        createHurtSprite: function() {
            var self = this;

            if (!self.loaded)
                self.load();

            if (self.whiteSprite.loaded)
                return;

            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d'),
                spriteData, data;

            canvas.width = self.image.width;
            canvas.height = self.image.height;

            context.drawImage(self.image, 0, 0, self.image.width, self.image.height);

            try {
                spriteData = context.getImageData(0, 0, self.image.width, self.image.height);
                data = spriteData.data;

                for (var i = 0; i < data.length; i+= 4) {
                    data[i] = 255;
                    data[i + 1] = data[i + 2] = 75;
                }

                spriteData.data = data;

                context.putImageData(spriteData, 0, 0);

                self.whiteSprite = {
                    image: canvas,
                    loaded: true,
                    offsetX: self.offsetX,
                    offsetY: self.offsetY,
                    width: self.width,
                    height: self.height
                }

            } catch (e) {}
        },

        getHurtSprite: function() {
            var self = this;

            try {
                if (!self.loaded)
                    self.load();

                self.createHurtSprite();

                return self.whiteSprite;
            } catch (e) {}
        },

        onLoad: function(callback) {
            this.onLoadCallback = callback;
        }

    });

});