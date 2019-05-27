define(function() {

    return Class.extend({

        init: function(id, element, type) {
            var self = this;

            self.id = id;
            self.element = element;
            self.type = type;

            self.blinkInterval = null;
            self.visible = true;

            self.x = -1;
            self.y = -1;

            self.load();
        },

        load: function() {
            var self = this;

            self.blinkInterval = setInterval(function() {
                if (self.visible)
                    self.hide();
                else
                    self.show();

                self.visible = !self.visible;
            }, 600);
        },

        destroy: function() {
            var self = this;

            clearInterval(self.blinkInterval);
            self.element.remove();
        },

        setPosition: function(x, y) {
            var self = this;

            self.x = x;
            self.y = y;
        },

        show: function() {
            this.element.css('display', 'block');
        },

        hide: function() {
            this.element.css('display', 'none');
        }

    });

});