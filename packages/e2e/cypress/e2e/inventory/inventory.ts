import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import InventoryContext from './inventory.context';
import { activateWorldContext, getWorldContext } from '../worldutils';

Given('I am testing the inventory features', function () {
    activateWorldContext(this, new InventoryContext());
});

Then('I see that the {string} is empty', function (slot: string) {
    let context = getWorldContext(this),
        targeting = context.findElementViaTitle(slot);
    targeting.invoke('attr', 'style').then((attr) => {
        if (!!attr && attr.includes('background-image'))
            assert.fail(`Inventory slot [${slot}] is not empty`);
    });
});

Then(
    /^I see that the "([^"]*)" contains (\d+) "([^"]*)"$/,
    function (slot: string, amount: number, itemKey: string) {
        let context = getWorldContext(this),
            targeting = context.findElementViaTitle(slot);
        targeting.should('have.attr', 'style').and('match', new RegExp(`${itemKey}`));
        targeting
            .get('div.inventory-item-count')
            .invoke('text')
            .then((text) => {
                let count = text.length > 0 ? Number(text) : NaN;
                if ((isNaN(count) && amount > 1) || (!isNaN(count) && count !== amount))
                    assert.fail(
                        `Inventory slot does not contain the correct amount [${amount} =! ${text}, ${count}]`
                    );
            });
    }
);
