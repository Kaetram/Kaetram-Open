import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^I click on the login button$/, function () {
    cy.get('#login').click();
});

Then(/^I see the login error "([^"]*)"$/, function (errorText: string) {
    cy.get('#load-character span.validation-error').should('have.text', errorText);
});

Given(
    /^I fill in the "([^"]*)" field with "([^"]*)"$/,
    function (fieldName: string, value: string) {
        // TODO add this to test context mapping
        let nameToTargeting = new Map<string, string>([
                ['username', '#login-name-input'],
                ['password', '#login-password-input']
            ]),
            targeting = nameToTargeting.get(fieldName);
        expect(targeting).to.exist;
        cy.get(targeting!).type(value);
    }
);
