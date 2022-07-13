/// <reference types="cypress" />

import { PlayerInfo } from '../entities/playerinfo';
import { PlayerInventory } from '../entities/playerinventory';

type CollectionName = 'player_info' | 'player_inventory';

/**
 * Sample usage:
 *  cy.resetCollection('player_info');
 */
Cypress.Commands.add('resetCollection', (collection: CollectionName) => {
    return cy.request('DELETE', `http://localhost:3000/api/v1/${collection}`).then(() => {
        return true;
    });
});

/**
 * Sample usage:
 *  cy.createPlayerInfo(playerInfo);
 */
Cypress.Commands.add('createPlayerInfo', (playerInfo: PlayerInfo) => {
    return cy.request('POST', `http://localhost:3000/api/v1/player_info`, playerInfo).then(() => {
        return true;
    });
});

/**
 * Sample usage:
 *  cy.getPlayerInfo('fvantom').then((player) => {
 *      cy.log(JSON.stringify(player));
 *  });
 */
Cypress.Commands.add('getPlayerInfo', (username: string) => {
    return cy
        .request(`http://localhost:3000/api/v1/player_info?username=${username}`)
        .then((res) => {
            // redirect status code is 302
            expect(res.body).to.exist;
            return (<PlayerInfo[]>res.body)[0];
        });
});

/**
 * Sample usage:
 *  cy.createPlayerInventory(playerInventory);
 */
Cypress.Commands.add('createPlayerInventory', (playerInventory: PlayerInventory) => {
    return cy
        .request('POST', `http://localhost:3000/api/v1/player_inventory`, playerInventory)
        .then(() => {
            return true;
        });
});

declare global {
    namespace Cypress {
        interface Chainable {
            resetCollection(collection: CollectionName): Chainable<boolean>;
            createPlayerInfo(playerInfo: PlayerInfo): Chainable<boolean>;
            getPlayerInfo(username: string): Chainable<PlayerInfo>;
            createPlayerInventory(playerInventory: PlayerInventory): Chainable<boolean>;
        }
    }
}
