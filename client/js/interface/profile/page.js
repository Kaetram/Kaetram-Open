/* global log */

define(['jquery'], function($) {

    return Class.extend({

        init: function(element) {
            var self = this;

            self.body = $(element);

            self.loaded = false;
        },

        show: function() {
            this.body.fadeIn('slow');
        },

        hide: function() {
            this.body.fadeOut('slow');
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        },

        load: function() {
            log.info('Uninitialized.');
        },

        resize: function() {
            log.info('Uninitialized.');
        },

        update: function() {
            log.info('Uninitialized.');
        },

        getImageFormat: function(scale, name) {
            if (!name || name === 'null')
                return '';

            return 'url("img/' + scale + '/item-' + name + '.png")';
        }

    });

});