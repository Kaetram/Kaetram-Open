import Utils from '../../utils/util';

import type { Opcodes } from '@kaetram/common/network';

export default class Arrow {
    // Hardcoded value representing the width of the arrow element divided by 2.
    public offsetWidth = 36;

    public x = -1;
    public y = -1;

    public element: HTMLElement = document.createElement('div');

    private blinkInterval = -1;
    private visible = true;

    public constructor(
        public type: Opcodes.Pointer,
        public instance: string
    ) {
        // Apply the correct class name to the element.
        this.element.classList.add('pointer');

        // Blink interval essentially hides and shows the arrow every 600ms.
        this.blinkInterval = window.setInterval(() => {
            if (this.visible) Utils.fadeOut(this.element);
            else Utils.fadeIn(this.element);

            this.visible = !this.visible;
        }, 600);
    }

    /**
     * Sets the arrow's position on the screen. The position corresponds to the
     * absolute x and y coordinate (not the grid position) in the game.
     * @param x The x coordinate.
     * @param y The y coordinate.
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

        this.element.remove();
    }

    /**
     * Resets all the styles for the arrow element.
     */

    public reset(): void {
        this.element.style.top = '';
        this.element.style.left = '';
        this.element.style.right = '';
        this.element.style.bottom = '';
        this.element.style.transform = '';
    }
}
