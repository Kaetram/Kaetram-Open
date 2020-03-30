import Modules from '../../utils/modules';

export default class Pointer {
    id: any;
    element: any;
    type: any;
    blinkInterval: any;
    visible: boolean;
    x: number;
    y: number;
    constructor(id, element, type) {
        this.id = id;
        this.element = element;
        this.type = type;

        this.blinkInterval = null;
        this.visible = true;

        this.x = -1;
        this.y = -1;

        this.load();
    }

    load() {
        this.blinkInterval = setInterval(() => {
            if (this.visible) this.hide();
            else this.show();

            this.visible = !this.visible;
        }, 600);
    }

    destroy() {
        clearInterval(this.blinkInterval);

        if (this.type === Modules.Pointers.Button) this.hide();
        else this.element.remove();
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    show() {
        if (this.type === Modules.Pointers.Button)
            this.element.addClass('active');
        else this.element.css('display', 'block');
    }

    hide() {
        if (this.type === Modules.Pointers.Button)
            this.element.removeClass('active');
        else this.element.css('display', 'none');
    }
}
