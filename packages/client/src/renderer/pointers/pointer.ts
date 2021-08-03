import { Modules } from '@kaetram/common/network';

export default class Pointer {
    private blinkInterval!: number;
    private visible = true;

    public x = -1;
    public y = -1;

    public constructor(public id: string, public element: JQuery, public type: Modules.Pointers) {
        this.load();
    }

    private load(): void {
        this.blinkInterval = window.setInterval(() => {
            if (this.visible) this.hide();
            else this.show();

            this.visible = !this.visible;
        }, 600);
    }

    public destroy(): void {
        clearInterval(this.blinkInterval);

        if (this.type === Modules.Pointers.Button) this.hide();
        else this.element.remove();
    }

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    private show(): void {
        if (this.type === Modules.Pointers.Button) this.element.addClass('active');
        else this.element.show();
    }

    private hide(): void {
        if (this.type === Modules.Pointers.Button) this.element.removeClass('active');
        else this.element.hide();
    }
}
