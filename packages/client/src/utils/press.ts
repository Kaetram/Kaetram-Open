let holdTimeout: number | undefined;

// A touch is considered a hold if it lasts longer than 200ms.
const HOLD_TIME = 200;

/**
 * Resets the hold timeout.
 */

function resetTimeout() {
    // Clear the hold timeout if it exists
    if (holdTimeout !== undefined) {
        clearTimeout(holdTimeout);

        holdTimeout = undefined;
    }
}

/**
 * Registers a secondary press event, which is a right click or a long press.
 * @param element The element to register the event on.
 * @param callback The callback to call when the event is triggered.
 */

// Register event listeners to detect a hold event.
export function onSecondaryPress(
    element: HTMLElement,
    callback: (position: { x: number; y: number }) => void
) {
    // Get the game container element.
    let gameContainer = document.querySelector<HTMLElement>('#game-container')!;

    element.addEventListener('contextmenu', (event) => {
        // Prevent the default browser context menu.
        event.preventDefault();

        // Reset the hold timeout in case the touch is still active.
        resetTimeout();

        // Call the callback with the touch position.
        callback({ x: event.clientX, y: event.clientY });
    });

    // Prevent the default browser context menu on the game container.
    gameContainer.addEventListener('contextmenu', (event) => event.preventDefault());

    element.addEventListener('touchstart', (event) => {
        // Get the first touch.
        let [touch] = event.touches;

        // Set a timeout to call the callback after HOLD_TIME ms.
        holdTimeout = window.setTimeout(
            () => callback({ x: touch.clientX, y: touch.clientY }),
            HOLD_TIME
        );
    });

    // Reset the hold timeout in case the touch is still active.
    gameContainer.addEventListener('touchmove', resetTimeout);
}

/**
 * Registers a drag and drop event.
 * @param element The element to register the event on.
 * @param dropCallback The callback to call when the element is dropped.
 * @param exception A function that returns true if the drag and drop should be cancelled.
 */

export function onDragDrop(
    element: HTMLElement,
    dropCallback: (clone: HTMLElement, target: HTMLElement) => void,
    exception?: () => boolean
) {
    let isHolding = false,
        dragClone: HTMLElement | undefined,
        gameContainer = document.querySelector<HTMLElement>('#game-container')!;

    // Add the event listeners for the mouse events
    element.addEventListener('mousedown', () => startHold());
    gameContainer.addEventListener('mousemove', (event) => moveHold(event.clientX, event.clientY));
    gameContainer.addEventListener('mouseup', (event) => endHold(event.clientX, event.clientY));

    // Add the event listeners for the touch events
    element.addEventListener('touchstart', () => startHold(HOLD_TIME));
    gameContainer.addEventListener('touchmove', (event) => {
        let [touch] = event.touches;

        if (isHolding) event.preventDefault();

        moveHold(touch.clientX, touch.clientY);
    });
    gameContainer.addEventListener('touchend', (event) => {
        let [touch] = event.changedTouches;

        endHold(touch.clientX, touch.clientY);
    });
    gameContainer.addEventListener('touchcancel', cancelHold);

    // When the user starts holding the item, start the hold timeout.
    function startHold(delay?: number) {
        // The timeout is used to determine if the user is holding the item.
        // If the timeout is reset, the user is not holding the item.
        holdTimeout = window.setTimeout(() => {
            // If the exception function returns true, cancel the hold.
            if (exception?.()) return;

            cancelHold();
            // The user is holding the item.
            isHolding = true;

            // Create a clone of the item element.
            dragClone = element.cloneNode(true) as HTMLElement;

            dragClone.style.position = 'absolute';
            dragClone.style.opacity = '0.75';
            dragClone.style.top = `${-element.clientHeight}px`;
            dragClone.style.left = `${-element.clientWidth}px`;
            dragClone.style.pointerEvents = 'none';
            dragClone.style.touchAction = 'none';

            // Append the clone to the game container.
            gameContainer?.append(dragClone);
        }, delay);
    }

    // When the user moves the item, update the clone's position.
    function moveHold(x: number, y: number) {
        // Reset the hold timeout.
        resetTimeout();

        // If the user is not holding the item or the clone does not exist, cancel the hold.
        if (!isHolding || !dragClone) return cancelHold();

        // Update the clone's position.
        dragClone.style.top = `${y - element.clientHeight / 2}px`;
        dragClone.style.left = `${x - element.clientWidth / 2}px`;
    }

    // When the user stops holding the item, drop the item.
    function endHold(x: number, y: number) {
        // If the user is not holding the item, cancel the hold.
        if (!isHolding) return;

        // Save the clone element in a variable.
        let clone = dragClone;
        cancelHold();

        // Get the element at the specified coordinates.
        let target = document.elementFromPoint(x, y) as HTMLElement | null;

        // If the target does not exist or the clone does not exist, cancel the hold.
        if (!target || !clone) return;

        // Call the drop callback with the clone and the target.
        dropCallback(clone, target);
    }

    // Cancel the hold.
    function cancelHold() {
        // Reset the hold timeout.
        resetTimeout();
        isHolding = false;

        // Remove the clone from the game container.
        dragClone?.remove();
        dragClone = undefined;

        // Remove the focused class from the item element.
        element.classList.remove('item-slot-focused');
    }
}
