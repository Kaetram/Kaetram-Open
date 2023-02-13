import Menu from './menu';

import Util from '../utils/util';

import type { Modules } from '@kaetram/common/network';
import type { Bonuses, Stats } from '@kaetram/common/types/item';

export default class Actions extends Menu {
    private page: HTMLElement = document.querySelector('#action-page')!;

    // Contains the list of actions.
    private list: HTMLUListElement = document.querySelector('#action-page > ul')!;

    // Info about the current action.
    private name: HTMLElement = document.querySelector('#action-page > .action-item-name')!;
    private description: HTMLElement = document.querySelector(
        '#action-page > .action-item-description'
    )!;

    // Drop dialog elements
    public dropDialog: HTMLElement = document.querySelector('#action-drop')!;
    private dropCount: HTMLInputElement = document.querySelector('#action-drop .dialog-count')!;
    private dropAccept: HTMLElement = document.querySelector('#action-drop .dialog-accept')!;
    private dropCancel: HTMLElement = document.querySelector('#action-drop .dialog-cancel')!;

    private buttonCallback?: (menuAction: Modules.MenuActions) => void;
    private dropCallback?: (count: number) => void;

    public constructor() {
        super('#action-container');

        this.dropCancel.addEventListener('click', this.hideDropDialog.bind(this));
        this.dropAccept.addEventListener('click', this.handleDrop.bind(this));
    }

    /**
     * Handles the click event for the drop dialog.
     */

    public handleDrop(): void {
        let count = this.dropCount.valueAsNumber;

        // Reset the input field value
        this.dropCount.value = '';

        // Hide the drop dialog.
        this.hideDropDialog();

        // Exit the actions menu dialog
        this.hide();

        // Send the callback to the inventory handler.
        this.dropCallback?.(count);
    }

    /**
     * Opens the action menu with a specified array of actions. We first clear
     * all the previous actions and load the new ones in.
     * @param actions Array of actions to append to our list prior to displaying.
     * @param name The name of the item that the actions are being performed on.
     * @param attackStats The attack stats of the item.
     * @param defenseStats The defense stats of the item.
     * @param bonuses The bonuses of the item.
     */

    public override show(
        actions: Modules.MenuActions[],
        name: string,
        attackStats: Stats,
        defenseStats: Stats,
        bonuses: Bonuses,
        itemDescription = ''
    ): void {
        this.clear();

        for (let action of actions) this.add(action);

        // Update the name of the selected item.
        this.name.innerHTML = name;

        let description =
            itemDescription ||
            `<u>Attack Stats:</u>&emsp;&emsp;<u>Defense Stats:</u> <br>
             Crush: ${attackStats.crush}&emsp;&emsp;&emsp;&emsp; Crush: ${defenseStats.crush} <br>
             Slash: ${attackStats.slash}&emsp;&emsp;&emsp;&emsp; Slash: ${defenseStats.slash} <br>
             Stab: ${attackStats.stab}&emsp;&emsp;&emsp;&emsp;&ensp; Stab: ${defenseStats.stab} <br>
             Archery: ${attackStats.archery}&emsp;&emsp;&emsp; Archery: ${defenseStats.archery} <br>
             Magic: ${attackStats.magic}&emsp;&emsp;&emsp;&emsp; Magic: ${defenseStats.magic} <br><br>
            <u>Bonuses</u>: <br>
             Accuracy: ${bonuses.accuracy} <br>
             Strength: ${bonuses.strength} <br>
             Archery: ${bonuses.archery} <br>
             Magic: ${bonuses.magic} <br>`;

        this.description.innerHTML = description;

        super.show();
    }

    /**
     * Implementation of the `hide` superclass where we also hide the
     * drop dialog upon exiting the actions menu.
     */

    public override hide(): void {
        super.hide();

        // Hide the drop dialog.
        this.hideDropDialog();
    }

    /**
     * Appends an action element to the list of actions.
     * @param menuAction Enumeration containing the string text of the action.
     */

    public override add(menuAction: Modules.MenuActions): void {
        let element = document.querySelector(`.action-${menuAction}`);

        if (!element) {
            element = document.createElement('li');

            // Set the type of action to the button element
            element.classList.add('action-button', `action-${menuAction}`);

            this.list.append(element);
        }

        // Assign an action when the element is clicked.
        element.addEventListener('click', (e) => {
            e.preventDefault();

            this.buttonCallback?.(menuAction);
        });
    }

    /**
     * Hides the description and shows the drop dialog. Also
     * focuses on the input field for the drop dialog.
     */

    public showDropDialog(): void {
        Util.fadeIn(this.dropDialog);
        Util.fadeOut(this.description);

        this.page.classList.add('dimmed');

        this.dropCount.value = '1';
        this.dropCount.focus();
    }

    /**
     * Hides the drop dialog and brings back the description info.
     */

    public hideDropDialog(): void {
        Util.fadeOut(this.dropDialog);
        Util.fadeIn(this.description);

        this.page.classList.remove('dimmed');
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

    /**
     * Callback handler for when the drop dialog has been accepted.
     * @param callback Contains the number of items to be dropped.
     */

    public onDrop(callback: (count: number) => void): void {
        this.dropCallback = callback;
    }
}
