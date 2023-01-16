import Timer from '../../utils/timer';

import $ from 'jquery';

export default class Blob {
    public element: JQuery;
    public duration = 5000;

    private timer: Timer;
    public static = false;

    public constructor(
        public instance: string,
        message: string,
        duration = 5000,
        public position?: Position
    ) {
        this.timer = new Timer(Date.now(), duration);

        this.element = this.createBlob(instance, message);

        // Automatically static if we provied an absolute position.
        this.static = !!this.position;
    }

    /**
     * Updates a blob with the new text and resets the timer.
     * @param text The new string text we are displaying.
     * @param time The current game time.
     */

    public update(text: string, time: number): void {
        // Reset timer
        this.timer.time = time;

        $(this.element).find('p').html(text);
    }

    /**
     * Has the timer reached the end of the bubble's duration?
     * @param time The current game time from the updater.
     * @returns Whether or not the timer has reached the end of the bubble's duration.
     */

    public isOver(time: number): boolean {
        return this.timer.isOver(time);
    }

    /**
     * Removes the JQuery element from the DOM.
     */

    public destroy(): void {
        $(this.element).remove();
    }

    /**
     * Creates a JQuery HTML element of the bubble with the specified
     * id and message contents.
     * @param instance Bubble's identifier, generally the entity's instance.
     * @param message Message that we are displaying in the bubble.
     * @returns A JQuery element that is appended to the container.
     */

    public createBlob(instance: string, message: string): JQuery {
        return $(
            `<div id="${instance}" class="bubble"><p>${message}</p><div class="bubble-tip"></div></div>`
        );
    }
}
