export default abstract class WorldContext {
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
}
