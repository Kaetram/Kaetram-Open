import Menu from './menu';

import _ from 'lodash';
import { Modules } from '@kaetram/common/network';

import type Entity from '../entity/entity';

export default class Interact extends Menu {
    // Contains the list of actions.
    private list: HTMLUListElement = document.querySelector('#interact > ul')!;

    private buttonCallback?: (menuAction: Modules.MenuActions) => void;
    private closeCallback?: () => void;

    public constructor() {
        super('#interact');
    }

    /**
     * Override for the show function. Takes a position as a parameter.
     * @param position The mouse position (on the screen) where we will display the interact menu.
     * @param entity The entity that the player is interacting with. Used to determine what actions to display.
     * @param pvp Whether or not the player is in a pvp zone. Adds attack action to the player entity if true.
     */

    public override show(position: Position, entity: Entity, pvp = false): void {
        this.clear();

        let actions: Modules.MenuActions[] = [];

        // Add attack interactions to all mob entities.
        if (entity.isMob()) actions.push(Modules.MenuActions.Attack);

        // Add the trade and follow interactions to all player entities.
        if (entity.isPlayer()) {
            if (pvp) actions.push(Modules.MenuActions.Attack);

            actions.push(Modules.MenuActions.Trade, Modules.MenuActions.Follow);
        }

        // Add all the actions to the list.
        _.each(actions, (action: Modules.MenuActions) => this.add(action));

        // Display only if there's enough actions.
        if (actions.length > 0) {
            let x =
                    position.x + this.container.offsetWidth > window.innerWidth
                        ? window.innerWidth - this.container.offsetWidth
                        : position.x,
                y =
                    position.y + this.container.offsetHeight > window.innerHeight
                        ? window.innerHeight - this.container.offsetHeight
                        : position.y;

            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;

            super.show();
        }
    }

    /**
     * Override for the hide function which implements the hide callback.
     */

    public override hide(): void {
        super.hide();

        this.closeCallback?.();
    }

    /**
     * Appends an action element to the list of actions.
     * @param menuAction Enumeration containing the string text of the action.
     */

    public override add(menuAction: Modules.MenuActions): void {
        let element = document.createElement('li');

        // Set the type of action to the button element
        element.classList.add('action-button', `action-${menuAction}`);

        // Assign an action when the element is clicked.
        element.addEventListener('click', () => this.buttonCallback!(menuAction));

        this.list.append(element);
    }

    /**
     * Removes all the `div` action elements from the list.
     */

    private clear(): void {
        this.list.innerHTML = '';
    }

    /**
     * Handles the press of one of the interact buttons.
     * @param callback Contains the button that was pressed.
     */

    public onButton(callback: (menuAction: Modules.MenuActions) => void): void {
        this.buttonCallback = callback;
    }

    /**
     * Callback for when the interact menu has been hidden.
     */

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }
}
