import { Modules } from '@kaetram/common/network';
import _ from 'lodash-es';
import Menu from './menu';

export default class Actions extends Menu {
    protected override container: HTMLElement = document.querySelector('#action-container')!;

    // Contains the list of actions.
    private list: HTMLUListElement = document.querySelector('#action-container > ul')!;

    private buttonCallback?: (menuAction: Modules.MenuActions) => void;

    public constructor() {
        super();
    }

    /**
     * Opens the action menu with a specified array of actions. We first clear
     * all the previous actions and load the new ones in.
     * @param actions Array of actions to append to our list prior to displaying.
     * @param x The x position of the action menu.
     * @param y The y position of the action menu.
     */

    public override show(actions: Modules.MenuActions[], x: number, y: number): void {
        this.clear();

        _.each(actions, (action: Modules.MenuActions) => this.add(action));

        // Set the position of the action menu.
        this.container.style.left = `${Math.max(Math.min(x, window.innerWidth - 128), 128)}px`;
        this.container.style.top = `${Math.max(Math.min(y, window.innerHeight - 32), 32)}px`;

        super.show();
    }

    /**
     * Appends an action element to the list of actions.
     * @param menuAction Enumeration containing the string text of the action.
     */

    public override add(menuAction: Modules.MenuActions): void {
        let element = document.createElement('li'),
            action = document.createElement('div'),
            idSuffix = menuAction.toLowerCase().replaceAll(/[^\dA-Za-z]+/g, '-');

        action.classList.add('action-button');
        action.id = `action-button-${idSuffix}`;
        action.textContent = menuAction;

        // Each action has a callback associated with it.
        action.addEventListener('click', () => this.buttonCallback?.(menuAction));

        element.append(action);

        this.list.append(element);
    }

    /**
     * Removes all the `div` action elements from the list.
     */

    private clear(): void {
        this.list.innerHTML = '';
    }

    /**
     * Callback handler for when an action button has been pressed.
     * @param callback Contains the action that was pressed.
     */

    public onButton(callback: (menuAction: Modules.MenuActions) => void): void {
        this.buttonCallback = callback;
    }
}
