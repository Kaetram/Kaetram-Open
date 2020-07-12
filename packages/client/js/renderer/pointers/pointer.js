import Modules from '../../utils/modules';

export default class Pointer {
    constructor(id, element, type) {
        var self = this;

        self.id = id;
        self.element = element;
        self.type = type;

        self.blinkInterval = null;
        self.visible = true;

        self.x = -1;
        self.y = -1;

        self.load();
    }

    load() {
        var self = this;

        self.blinkInterval = setInterval(function () {
            if (self.visible) self.hide();
            else self.show();

            self.visible = !self.visible;
        }, 600);
    }

    destroy() {
        var self = this;

        clearInterval(self.blinkInterval);

        if (self.type === Modules.Pointers.Button) self.hide();
        else self.element.remove();
    }

    setPosition(x, y) {
        var self = this;

        self.x = x;
        self.y = y;
    }

    show() {
        if (this.type === Modules.Pointers.Button) this.element.addClass('active');
        else this.element.css('display', 'block');
    }

    hide() {
        if (this.type === Modules.Pointers.Button) this.element.removeClass('active');
        else this.element.css('display', 'none');
    }
}
