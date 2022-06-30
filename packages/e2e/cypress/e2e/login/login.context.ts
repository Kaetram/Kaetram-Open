import WorldContext from '../world.context';
import { ObjectBuilder } from 'typescript-object-builder';
import { PlayerInfo } from '../../entities/playerinfo';
import defaultPlayerInfo from '../../fixtures/playerinfo.default.json';

export default class LoginContext extends WorldContext {
    constructor() {
        super();
        this.registerLookup('login button', '#login');
        this.registerLookup('username', '#login-name-input');
        this.registerLookup('password', '#login-password-input');
    }

    injectDefaultData(): void {
        cy.resetCollection('player_info');

        let playerInfo = ObjectBuilder.basedOn<PlayerInfo>(defaultPlayerInfo)
            .with('username', 'fvantom')
            .build();

        cy.createPlayerInfo(playerInfo);
    }
}
