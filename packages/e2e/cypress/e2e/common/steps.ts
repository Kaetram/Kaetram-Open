import { getWorldContext } from '../worldutils';

import { After, Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

// this will get called before each scenario
After(function () {
    let context = getWorldContext(this);
    cy.log('Called "after" cypress step', this.worldContext, context);
    cy.visit('/');
    // Give the server time to save the player
    cy.wait(3000);
    this.worldContext?.cleanup();
});

When('I click on the {string}', function (title: string) {
    let context = getWorldContext(this);
    context.findElementViaTitle(title).click();
    cy.wait(100);
});

Given('I fill in the {string} field', function (fieldName: string) {
    let context = getWorldContext(this),
        targeting = context.findElementViaTitle(fieldName);
    expect(targeting).to.exist;
    switch (fieldName) {
        case 'username': {
            targeting.type(context.USERNAME);
            break;
        }
        case 'password': {
            targeting.type(context.PASSWORD);
            break;
        }
    }
});

Given('I fill in the {string} field with {string}', function (fieldName: string, value: string) {
    let context = getWorldContext(this),
        targeting = context.findElementViaTitle(fieldName);
    expect(targeting).to.exist;
    targeting.type(value);
});

Then('I see the {string}', function (title: string) {
    let context = getWorldContext(this);
    context.findElementViaTitle(title).should('be.visible');
});
