import LoggedInContext from '../loggedin.context';
import { buildPlayerInventory } from '@kaetram/e2e/cypress/fixtures/builders/playerinventory.builder';

export default class InventoryContext extends LoggedInContext {
    constructor() {
        super();
        this.registerLookup('inventory button', '#inventory-button');
        this.registerLookup('inventory window', '#inventory');
        this.registerLookup(
            'first inventory slot',
            '#inventory > ul > li:first-child div.item-slot'
        );
        // This assumes the first action is 'drop', add a 'data-test' attribute to each action for better targeting
        this.registerLookup('drop command', '#action-container div.action-button:first-child');
    }

    override injectDefaultData(): void {
        super.injectDefaultData();

        let playerInventory = buildPlayerInventory(this.USERNAME);
        cy.createPlayerInventory(playerInventory);
    }
}
