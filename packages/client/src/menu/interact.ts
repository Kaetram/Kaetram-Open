import Menu from './menu';

import { Modules } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';

export default class Interact extends Menu {
    // Contains the list of actions.
    private list: HTMLUListElement = document.querySelector('#interact > ul')!;

    private buttonCallback?: (menuAction: Modules.MenuActions) => void;
    private closeCallback?: () => void;

    public constructor(private player: Player) {
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

        if (entity.isItem()) actions.push(Modules.MenuActions.Examine);

        // Add attack interactions to all mob entities.
        if (entity.isMob()) actions.push(Modules.MenuActions.Attack, Modules.MenuActions.Examine);

        // Add the trade and follow interactions to all player entities.
        if (entity.isPlayer()) {
            // Use attack if player is in PvP
            if (pvp) actions.push(Modules.MenuActions.Attack);
            else actions.push(Modules.MenuActions.Follow);

            // Add the trade action
            actions.push(Modules.MenuActions.Trade);

            // If we don't have the player added then add the add friend action.
            if (!this.player.hasFriend(entity.name)) actions.push(Modules.MenuActions.AddFriend);
        }

        // Add all the actions to the list.
        for (let action of actions) this.add(action);

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
