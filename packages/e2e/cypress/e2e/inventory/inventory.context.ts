import { ObjectBuilder } from 'typescript-object-builder';
import defaultPlayerInventory from '../../fixtures/playerinventory.default.json';
import LoggedInContext from '../loggedin.context';
import { PlayerInventory } from '../../entities/playerinventory';

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

    injectDefaultData(): void {
        super.injectDefaultData();

        cy.resetCollection('player_inventory');

        let playerInventory = ObjectBuilder.basedOn<PlayerInventory>(defaultPlayerInventory)
            .with('username', 'fvantom')
            .build();

        cy.createPlayerInventory(playerInventory);
    }
}
