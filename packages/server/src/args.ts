import config from '@kaetram/common/config';

/**
 * Class responsible for overriding the default arguments.
 */

export default class Args {
    public constructor(private params: string[] = process.argv) {
        if (params.length < 2) return;

        // Iterate through the additional parameters and override the default values.
        for (let i = 2; i < this.params.length; i += 2) {
            let paramIdentifier = this.params[i],
                paramValue = this.params[i + 1];

            this.override(paramIdentifier, paramValue);
        }
    }

    /**
     * Takes a parameter key and overrides the environment variables in the
     * configuration based on that.
     * @param key The key of the parameter.
     * @param value The value of the parameter.
     */

    private override(key: string, value: string): void {
        switch (key) {
            case '--host': {
                config.host = value;
                break;
            }

            case '--port': {
                config.port = parseInt(value);
                config.apiPort = parseInt(value) + 1;
                break;
            }

            case 'remoteServerHost': {
                config.remoteServerHost = value;
                break;
            }

            case 'serverId': {
                config.serverId = parseInt(value);
                break;
            }

            case 'updateTime': {
                config.updateTime = parseInt(value);
                break;
            }

            case 'maxPlayers': {
                config.maxPlayers = parseInt(value);
            }
        }
    }
}
