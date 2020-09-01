class Logger {
    level: string;

    constructor(level: string) {
        this.level = level;
    }

    info(...data: unknown[]) {
        if (this.level === 'debug' || this.level === 'info') window?.console.info(...data);
    }

    debug(...data: unknown[]) {
        if (this.level === 'debug') window?.console.log(...data);
    }

    error(...data: unknown[]) {
        window?.console.error(...data);
    }
}

export default new Logger('debug');
