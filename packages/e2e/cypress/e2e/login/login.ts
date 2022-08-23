import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import LoginContext from './login.context';
import { activateWorldContext } from '../worldutils';

Given('I am testing the login features', function () {
    activateWorldContext(this, new LoginContext());
});

Then('I see the login error {string}', function (errorText: string) {
    cy.get('#load-character span.validation-error').should('have.text', errorText);
});

Then('I am logged in successfully', function () {
    cy.wait(1000);
    cy.get('#health-info', { timeout: 60_000 }).should('be.visible');
    // TODO @Keros, if you remove this line,
    //  you can crash the server because you log off too soon after logging in.
    cy.wait(3000);
});
