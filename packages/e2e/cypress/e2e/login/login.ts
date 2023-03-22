import LoginContext from './login.context';

import { activateWorldContext } from '../worldutils';

import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I am testing the login features', function () {
    activateWorldContext(this, new LoginContext());
});

Then('I see the login error {string}', function (errorText: string) {
    cy.get('#load-character span.validation-error').should('have.text', errorText);
});

Then('I am logged in successfully', function () {
    cy.wait(1000);
    cy.get('#health-info', { timeout: 60_000 }).should('be.visible');
});
