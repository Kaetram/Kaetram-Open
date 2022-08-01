import WorldContext from './world.context';
import { ObjectBuilder } from 'typescript-object-builder';
import { PlayerInfo } from '../entities/playerinfo';
import defaultPlayerInfo from '../fixtures/playerinfo.default.json';

/**
 * This is used as a base class for all test-contexts which expect the player to be logged in.
 * Unlike the LoginContext and login feature tests it does not actually test the login.
 *
 * It just makes sure the players are logged in before starting the actual test
 */
export default class LoggedInContext extends WorldContext {
    public USERNAME = 'fvantom';
    public PASSWORD = 'test';

    constructor() {
        super();
    }

    injectDefaultData(): void {
        cy.resetCollection('player_info');

        let playerInfo = ObjectBuilder.basedOn<PlayerInfo>(defaultPlayerInfo)
            .with('username', this.USERNAME)
            .build();

        cy.createPlayerInfo(playerInfo);
    }

    before(): void {
        cy.get('#login-name-input').type(this.USERNAME);
        cy.get('#login-password-input').type(this.PASSWORD);
        cy.get('#login').click();
        cy.get('#health-info').should('be.visible');
    }
}
