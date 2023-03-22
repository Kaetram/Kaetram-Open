import WorldContext from '../world.context';

export default class LoginContext extends WorldContext {
    public constructor() {
        super();
        this.registerLookup('login button', '#login');
        this.registerLookup('username', '#login-name-input');
        this.registerLookup('password', '#login-password-input');
    }

    public injectDefaultData(): void {
        super.injectDefaultPlayers();
    }

    public before() {
        // Nothing needs to happen here
    }
}
