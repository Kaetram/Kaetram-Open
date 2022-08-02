import Menu from './menu';

export default class Notification extends Menu {
    private title: HTMLElement = document.querySelector('#notification-text-title')!;
    private description: HTMLElement = document.querySelector('#notification-text-description')!;

    private timeout!: number | null;

    public constructor() {
        super('#notification');
    }

    /**
     * The notification system has a special behavior
     * when it is displayed. The CSS handles the smooth
     * animation for it, and when we display it, we must
     * move it according to the screen size.
     */

    public override show(title: string, message: string, colour: string): void {
        // If a notification is already visible we hide it and display new one.
        if (this.isVisible()) {
            this.hide(false);
            window.setTimeout(() => this.show(title, message, colour), 700);
            return;
        }

        // Displays the notification.
        this.container.classList.add('active');
        this.setPosition();

        // Updates the title's colour.
        this.title.style.color = colour;

        // Sets the title and description.
        this.title.innerHTML = title;
        this.description.innerHTML = message;

        // Clear the timeout if it exists.
        clearTimeout(this.timeout!);

        // Starts a timeout.
        this.timeout = window.setTimeout(() => this.hide(false), 7000);
    }

    /**
     * Override for hiding the notification. We move the notification outside the
     * screen area and remove its active element.
     */

    public override hide(ignore = true): void {
        if (ignore) return;

        // Hides the notification.
        this.container.classList.remove('active');
        this.container.style.top = '100%';
    }

    /**
     * Updates the position of the notification.
     */

    public override resize(): void {
        // Don't update unless visible.
        if (!this.isVisible()) return;

        this.setPosition();
    }

    /**
     * Override for whether or not the notification is
     * currently visible. Notifications are checked by
     * verifying the class list instead of body display.
     * @returns Whether the class list contains the active
     * element.
     */

    public override isVisible(): boolean {
        return this.container.classList.contains('active');
    }

    /**
     * Calculates the positioning of the notification
     * based on the current screen size.
     * @returns The window's size minus the notification's
     * height. This places the notification at the bottom
     * of the screen.
     */

    private getPosition(): number {
        return window.innerHeight - this.container.offsetHeight;
    }

    /**
     * Updates the notification's body positioning relative to the screen.
     */

    private setPosition(): void {
        this.container.style.top = `${this.getPosition()}px`;
    }
}
