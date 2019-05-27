/* global Modules */

define(function() {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.renderer = game.renderer;
            self.camera = game.camera;
            self.input = game.input;

            self.direction = null;
        },

        reset: function() {
            this.direction = null;
        },

        setUp: function() {
            this.direction = Modules.Orientation.Up;
        },

        setDown: function() {
            this.direction = Modules.Orientation.Down;
        },

        setRight: function() {
            this.direction = Modules.Orientation.Right;
        },

        setLeft: function() {
            this.direction = Modules.Orientation.Left;
        },

        getDirection: function() {
            return this.direction;
        }

    });

});