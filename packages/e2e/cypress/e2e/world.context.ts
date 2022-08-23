import { Constants } from '@kaetram/common/network/modules';
import { ObjectBuilder } from 'typescript-object-builder';
import { PlayerInfo } from '@kaetram/e2e/cypress/entities/playerinfo';
import defaultPlayerInfo from '@kaetram/e2e/cypress/fixtures/playerinfo.default.json';

export default abstract class WorldContext {
    public USERNAME = 'fvantom';
    public PASSWORD = 'test';

    private lookups = new Map<string, string>();
    // protected database: Database | undefined;

    protected constructor() {
        // Lookups that you want to reuse across all contexts go here
    }

    protected registerLookup(title: string, lookup: string) {
        this.lookups.set(title, lookup);
    }

    public findElementViaTitle(title: string) {
        if (!this.lookups.has(title))
            assert.fail(
                `Cannot find element with lookup title [${title}]. Did you register it in your active context?`
            );

        let lookup = this.lookups.get(title);
        return cy.get(lookup!);
    }

    abstract injectDefaultData(): void;

    abstract before(): void;

    injectDefaultPlayers() {
        // TODO do not reset the whole collection
        cy.resetCollection('player_info');

        let [x, y] = Constants.SPAWN_POINT?.split(',') || [0, 0];
        cy.log(`injectDefaultData: ${x}, ${y}`);
        let playerInfo = ObjectBuilder.basedOn<PlayerInfo>(defaultPlayerInfo)
            .with('username', this.USERNAME)
            .with('x', +x)
            .with('y', +y)
            .build();

        cy.createPlayerInfo(playerInfo);
    }
}
