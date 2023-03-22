import WorldContext from './world.context';

export default class DefaultContext extends WorldContext {
    public constructor() {
        super();
    }

    public injectDefaultData(): void {
        // default data to inject in the db goes here
    }

    public before(): void {
        // default data to inject in the db goes here
    }
}
