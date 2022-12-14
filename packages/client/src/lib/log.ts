/**
 * A class that handles logging.
 *
 * @param level The level of logging to perform.
 */
class Logger {
    public constructor(public level: 'debug' | 'info') {}

    public info(...data: unknown[]): void {
        if (this.level === 'debug' || this.level === 'info') console.info(...data);
    }

    public debug(...data: unknown[]): void {
        if (this.level === 'debug') console.debug(...data);
    }

    public error(...data: unknown[]): void {
        console.error(...data);
    }
}

export default new Logger(import.meta.env.DEV ? 'debug' : 'info');
