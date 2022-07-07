import { Given, When } from '@badeball/cypress-cucumber-preprocessor';
import { getWorldContext } from '../worldutils';

When('I click on the {string}', function (title: string) {
    let context = getWorldContext(this);
    context.findElementViaTitle(title).click();
});

Given('I fill in the {string} field with {string}', function (fieldName: string, value: string) {
    let context = getWorldContext(this),
        targeting = context.findElementViaTitle(fieldName);
    expect(targeting).to.exist;
    targeting.type(value);
});
