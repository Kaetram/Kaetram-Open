/// <reference types="cypress" />

import type { PlayerInfo } from '../entities/playerinfo';
import type { PlayerInventory } from '../entities/playerinventory';

type CollectionName =
    | 'player_achievements'
    | 'player_bank'
    | 'player_equipment'
    | 'player_info'
    | 'player_inventory'
    | 'player_quests'
    | 'player_skills'
    | 'player_statistics';

/**
 * Sample usage:
 *  cy.createPlayerInfo(playerInfo);
 */
Cypress.Commands.add('createPlayerInfo', (playerInfo: PlayerInfo) => {
    return cy
        .request(
            'POST',
            `http://localhost:3000/api/v1/player_info/username/${playerInfo.username}`,
            playerInfo
        )
        .then(() => {
            return true;
        });
});

/**
 * Sample usage:
 *  cy.removePlayerFromCollection('player_info', 'fvantom');
 */
Cypress.Commands.add(
    'removePlayerFromCollection',
    (collection: CollectionName, username: string) => {
        return cy
            .request('DELETE', `http://localhost:3000/api/v1/${collection}/username/${username}`)
            .then(() => {
                return true;
            });
    }
);

/**
 * Sample usage:
 *  cy.getPlayerInfo('fvantom').then((player) => {
 *      cy.log(JSON.stringify(player));
 *  });
 */
Cypress.Commands.add('getPlayerInfo', (username: string) => {
    return cy
        .request(`http://localhost:3000/api/v1/player_info/username/${username}`)
        .then((res) => {
            // redirect status code is 302
            expect(res.body).to.exist;
            return res.body[0] as PlayerInfo;
        });
});

/**
 * Sample usage:
 *  cy.createPlayerInventory(playerInventory);
 */
Cypress.Commands.add('createPlayerInventory', (playerInventory: PlayerInventory) => {
    return cy
        .request(
            'POST',
            `http://localhost:3000/api/v1/player_inventory/username/${playerInventory.username}`,
            playerInventory
        )
        .then(() => {
            return true;
        });
});

declare global {
    namespace Cypress {
        interface Chainable {
            createPlayerInfo(playerInfo: PlayerInfo): Chainable<boolean>;
            removePlayerFromCollection(
                collection: CollectionName,
                username: string
            ): Chainable<boolean>;
            getPlayerInfo(username: string): Chainable<PlayerInfo>;
            createPlayerInventory(playerInventory: PlayerInventory): Chainable<boolean>;
        }
    }
}
