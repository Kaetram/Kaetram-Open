import LoggedInContext from '../loggedin.context';

import { buildPlayerInventory } from '@kaetram/e2e/cypress/fixtures/builders/playerinventory.builder';

export default class InventoryContext extends LoggedInContext {
    public constructor() {
        super();
        this.registerLookup('inventory button', '#inventory-button');
        this.registerLookup('inventory window', '#inventory');
        this.registerLookup(
            'first inventory slot',
            '#inventory-container > ul > li:first-child div.item-slot'
        );
        this.registerLookup('drop command', '.action-drop-one');
    }

    public override injectDefaultData(): void {
        super.injectDefaultData();

        let playerInventory = buildPlayerInventory(this.USERNAME);
        cy.createPlayerInventory(playerInventory);
    }
}
