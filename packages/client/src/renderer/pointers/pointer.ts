import Modules from '../../utils/modules';

export default class Pointer {
    id: string;
    element: JQuery<HTMLElement>;
    type: number;
    blinkInterval: NodeJS.Timeout;
    visible: boolean;
    x: number;
    y: number;

    constructor(id: string, element: JQuery, type: number) {
        this.id = id;
        this.element = element;
        this.type = type;

        this.blinkInterval = null;
        this.visible = true;

        this.x = -1;
        this.y = -1;

        this.load();
    }

    load(): void {
        this.blinkInterval = setInterval(() => {
            if (this.visible) this.hide();
            else this.show();

            this.visible = !this.visible;
        }, 600);
    }

    destroy(): void {
        clearInterval(this.blinkInterval);

        if (this.type === Modules.Pointers.Button) this.hide();
        else this.element.remove();
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    show(): void {
        if (this.type === Modules.Pointers.Button) this.element.addClass('active');
        else this.element.css('display', 'block');
    }

    hide(): void {
        if (this.type === Modules.Pointers.Button) this.element.removeClass('active');
        else this.element.css('display', 'none');
    }
}
