let tooltip!: HTMLElement;

/**
 * Creates a tooltip and shows it on the given element.
 * @param element The element to attach the tooltip to.
 * @param text The text to display in the tooltip.
 */
function showTooltip(element: HTMLElement, text: string) {
    // If the tooltip already exists, don't create a new one
    tooltip ??= document.createElement('div');

    // Get the element's bounding rectangle
    let rect = element.getBoundingClientRect();

    tooltip.classList.add('bubble');
    tooltip.textContent = text;

    // Add the tooltip to the DOM
    document.querySelector('#bubbles')!.append(tooltip);

    // Set the style of the tooltip
    tooltip.style.padding = '5px 10px';
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight}px`;

    // Mouse events

    element.addEventListener('blur', () => tooltip.remove());
    element.addEventListener('mouseout', () => tooltip.remove());
    element.addEventListener('mouseleave', () => tooltip.remove());

    // Touch events

    element.addEventListener('touchend', (event) => {
        if (event.target !== element) tooltip.remove();
    });
    element.addEventListener('touchcancel', (event) => {
        if (event.target !== element) tooltip.remove();
    });

    document.addEventListener('touchend', (event) => {
        if (event.target !== element) tooltip.remove();
    });
    document.addEventListener('touchcancel', (event) => {
        if (event.target !== element) tooltip.remove();
    });
}

/**
 * Listens for events on the given element and shows a tooltip when the event is triggered.
 * @param element The element to attach the tooltip to.
 * @param text The text to display in the tooltip.
 */
export function attachTooltip(element: HTMLElement, text: string): void {
    element.addEventListener('focus', () => showTooltip(element, text));
    element.addEventListener('mouseover', () => showTooltip(element, text));
    element.addEventListener('mouseenter', () => showTooltip(element, text));
    element.addEventListener('touchstart', () => showTooltip(element, text));
}
