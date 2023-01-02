import WorldContext from './world.context';

/**
 * This is used as a base class for all test-contexts which expect the player to be logged in.
 * Unlike the LoginContext and login feature tests it does not actually test the login.
 *
 * It just makes sure the players are logged in before starting the actual test
 */
export default class LoggedInContext extends WorldContext {
    public constructor() {
        super();
    }

    public injectDefaultData(): void {
        super.injectDefaultPlayers();
    }

    public before(): void {
        cy.get('#login-name-input').type(this.USERNAME);
        cy.get('#login-password-input').type(this.PASSWORD);
        cy.get('#login').click();
        cy.wait(1000);
        cy.get('#health-info', { timeout: 60_000 }).should('be.visible');
        cy.wait(1000);
    }
}
