import Utils from '../../utils/util';

import { Opcodes } from '@kaetram/common/network';

export default class Arrow {
    public x = -1;
    public y = -1;

    private blinkInterval!: number;
    private visible = true;

    public constructor(
        public id: string,
        public element: HTMLElement,
        public type: Opcodes.Pointer
    ) {
        this.load();
    }

    private load(): void {
        this.blinkInterval = window.setInterval(() => {
            if (this.visible) Utils.fadeOut(this.element);
            else Utils.fadeIn(this.element);

            this.visible = !this.visible;
        }, 600);
    }

    /**e
     * Sets the coordinates of the pointer.
     * @param x Sets the x position of the pointer (relative or absolute).
     * @param y Sets the y position of the pointer (relative or absolute).
     */

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Clears the interval and deletes the pointer element.
     */

    public destroy(): void {
        clearInterval(this.blinkInterval);

        if (this.type === Opcodes.Pointer.Button) this.hide();
        else this.element.remove();
    }

    /**
     * Hides the current pointer.
     */

    private hide(): void {
        if (this.type === Opcodes.Pointer.Button) this.element.classList.remove('active');
        else this.element.style.display = 'none';
    }
}
