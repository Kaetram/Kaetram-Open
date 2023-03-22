import { Constants } from '@kaetram/common/network/modules';
import { buildPlayerInfo } from '@kaetram/e2e/cypress/fixtures/builders/playerinfo.builder';

export default abstract class WorldContext {
    public USERNAME = `fvantom_${Math.floor(Math.random() * 10_000_000) + 1}`;
    public PASSWORD = 'test';

    private lookups = new Map<string, string>();
    // protected database: Database | undefined;

    protected constructor() {
        // Lookups that you want to reuse across all contexts go here
        this.registerLookup('notification popup', '#notification');
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

    public abstract injectDefaultData(): void;

    public abstract before(): void;

    protected cleanup(): void {
        this.cleanupDefaultPlayers();
    }

    protected injectDefaultPlayers() {
        let [x, y] = Constants.SPAWN_POINT?.split(',') || [0, 0],
            playerInfo = buildPlayerInfo(this.USERNAME, {
                x: +x,
                y: +y
            });

        cy.createPlayerInfo(playerInfo);
    }

    protected cleanupDefaultPlayers() {
        cy.removePlayerFromCollection('player_achievements', this.USERNAME);
        cy.removePlayerFromCollection('player_bank', this.USERNAME);
        cy.removePlayerFromCollection('player_equipment', this.USERNAME);
        cy.removePlayerFromCollection('player_info', this.USERNAME);
        cy.removePlayerFromCollection('player_inventory', this.USERNAME);
        cy.removePlayerFromCollection('player_quests', this.USERNAME);
        cy.removePlayerFromCollection('player_skills', this.USERNAME);
        cy.removePlayerFromCollection('player_statistics', this.USERNAME);
    }
}
