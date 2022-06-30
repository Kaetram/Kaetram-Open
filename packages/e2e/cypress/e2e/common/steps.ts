import { Given } from '@badeball/cypress-cucumber-preprocessor';

Given(/^I go to the login page$/, function () {
    cy.visit('http://localhost:9000');
});
