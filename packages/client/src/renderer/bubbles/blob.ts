import Timer from '../../utils/timer';

export default class Blob {
    public x = -1;
    public y = -1;

    public element: HTMLElement;
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
     * Sets the position of the blob to the specified x and y coordinates.
     * @param x The x coordinate (absolute position on the map).
     * @param y The y coordinate (absolute position on the map).
     */

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Updates a blob with the new text and resets the timer.
     * @param text The new string text we are displaying.
     * @param time The current game time.
     */

    public update(text: string, time: number): void {
        // Reset timer
        this.timer.time = time;

        let textElement = this.element.querySelector('p')!;

        if (!textElement) return;

        // Update text
        textElement.innerHTML = text;
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
     * Removes the element from the DOM.
     */

    public destroy(): void {
        this.element.remove();
    }

    /**
     * Creates a HTMLElement given the specified instance and message.
     * @param instance The instance of the blob, generally the entity's instance.
     * @param message The message we want to display in the blob.
     */

    private createBlob(instance: string, message: string): HTMLElement {
        let blob = document.createElement('div'),
            text = document.createElement('p');

        // Add the identifiers and classes to the blob.
        blob.id = instance;
        blob.classList.add('bubble');

        // Add the message to the text element.
        text.innerHTML = message;

        // Combine elements and return the result.
        blob.append(text);

        return blob;
    }
}
