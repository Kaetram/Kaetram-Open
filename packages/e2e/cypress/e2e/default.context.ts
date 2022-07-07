import WorldContext from './world.context';

export default class DefaultContext extends WorldContext {
    constructor() {
        super();
    }

    injectDefaultData(): void {
        // default data to inject in the db goes here
    }
}
