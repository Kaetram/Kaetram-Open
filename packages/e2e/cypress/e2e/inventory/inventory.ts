import InventoryContext from './inventory.context';

import { activateWorldContext, getWorldContext } from '../worldutils';

import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I am testing the inventory features', function () {
    activateWorldContext(this, new InventoryContext());
});

Then('I see that the {string} is empty', function (slot: string) {
    let context = getWorldContext(this),
        targeting = context.findElementViaTitle(slot);
    targeting.should('exist').should('have.attr', 'data-key').and('eq', '');
});

Then(
    /^I see that the "([^"]*)" contains (\d+) "([^"]*)"$/,
    function (slot: string, amount: number, itemKey: string) {
        let context = getWorldContext(this);
        context.findElementViaTitle(slot).should('have.attr', 'data-key').and('eq', itemKey);
        context.findElementViaTitle(slot).should('have.attr', 'data-count').and('eq', `${amount}`);
        context.findElementViaTitle(slot).within(() => {
            cy.get('div.item-count')
                .invoke('text')
                .then((text) => {
                    cy.log(`amount: ${amount}, text: ${text}`);
                    let count = text.length > 0 ? Number(text) : NaN;
                    if ((isNaN(count) && amount > 1) || (!isNaN(count) && count !== amount))
                        assert.fail(
                            `Inventory slot item count label does not contain the correct amount [${amount} =! ${text}, ${count}]`
                        );
                });
        });
    }
);
