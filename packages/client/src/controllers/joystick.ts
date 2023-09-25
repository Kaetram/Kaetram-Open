import type Game from '../game';

/**
 * Joystick controller for mobile devices.
 */
export default class JoystickController {
    private container: HTMLDivElement = document.querySelector('#joystick')!;
    private handle: HTMLDivElement = document.querySelector('#joystick-handle')!;

    private position!: Position;
    /** Whether or not the joystick is being moving. */
    private moving = false;

    public constructor(public game: Game) {
        this.container.addEventListener('touchstart', (event) => {
            this.handle.classList.add('active');
            this.onTouch(event);
        });
        this.container.addEventListener('touchmove', this.onTouch.bind(this));
        this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
        this.container.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    }

    /**
     * Show the joystick.
     */

    public show() {
        this.container.hidden = false;
    }

    /**
     * Hide the joystick.
     */

    public hide() {
        this.container.hidden = true;
    }

    /**
     * Handles the touch event for the joystick.
     * @param event The touch event.
     */

    private onTouch(event: TouchEvent) {
        let [{ clientX, clientY }] = event.touches,
            { left, top, width, height } = this.container.getBoundingClientRect(),
            // Calculate the distance from the center of the joystick (both from 0 to 1).
            dx = Math.max(0, Math.min(1, (clientX - left) / width)),
            dy = Math.max(0, Math.min(1, (clientY - top) / height)),
            // Calculate and restrict the distance from the center of the joystick (from 0 to 0.75).
            distance = Math.min(0.75, Math.hypot(dx - 0.5, dy - 0.5) * 2),
            // Using the distance, calculate the angle of the joystick (from -PI to PI).
            angle = Math.atan2(dy - 0.5, dx - 0.5),
            // Unit vector of the angle (from -1 to 1).
            ux = Math.cos(angle),
            uy = Math.sin(angle);

        // Translate the handle to the calculated position.
        this.handle.style.transform = `translate(${ux * distance * 100}%, ${uy * distance * 100}%)`;

        // If the distance is less than 0.25, we don't want to move.
        if (distance < 0.25) {
            this.moving = false;
            this.game.player.joystickMovement = false;

            return;
        }

        let wasMoving = this.moving;

        // Set the position and start moving.
        this.position = { x: Math.round(ux), y: Math.round(uy) };
        this.moving = true;
        this.game.player.joystickMovement = true;

        // Only call `move` if we weren't already moving.
        if (!wasMoving) this.move();
    }

    /**
     * Handles the movement of the player using the joystick's position.
     */

    private move() {
        let { player, map, input } = this.game,
            // Calculate the player's position on the grid.
            x = player.x + this.position.x * map.tileSize,
            y = player.y + this.position.y * map.tileSize,
            gridX = Math.round(player.x / map.tileSize + this.position.x),
            gridY = Math.round(player.y / map.tileSize + this.position.y);

        input.player.disableAction = false;

        input.move({ x, y, gridX, gridY }, false);

        if (this.moving) requestAnimationFrame(this.move.bind(this));
    }

    /**
     * Handles the touch end event for the joystick.
     */

    private onTouchEnd() {
        this.moving = false;

        this.handle.classList.remove('active');
        this.handle.style.transform = '';
    }
}
