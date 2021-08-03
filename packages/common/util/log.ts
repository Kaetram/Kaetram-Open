import fs from 'fs';

import config from '../config';

/**
 * Simple logging file that serves to be used globally
 * and to neatly display logs, errors, warnings, and notices.
 * Can be adapted and expanded, without using megabytes of npm repos.
 */
class Log {
    // Stream can be used to keep a log of what happened.
    private logLevel = config.debugLevel || 'all';
    private stream = config.fsDebugging ? fs.createWriteStream('runtime.log') : null; // Write to a different stream

    private debugging = config.debugging;

    public info(...message: unknown[]): void {
        this.send('info', message);
    }

    public debug(...message: unknown[]): void {
        if (!this.debugging) return;

        this.send('debug', message, 36);
    }

    public warning(...message: unknown[]): void {
        this.send('warn', message, 33, 'warning');
    }

    public error(...message: unknown[]): void {
        this.send('error', message, 41);
    }

    public notice(...message: unknown[]): void {
        this.send('log', message, 32, 'notice');
    }

    public trace(...message: unknown[]): void {
        this.send('trace', message, 35);
    }

    private send(type: keyof Console, data: unknown[], color = 1, title: string = type): void {
        let date = new Date(),
            formattedTitle = `[${title.toUpperCase()}]`,
            space = ' '.repeat(Math.max(9 - formattedTitle.length, 0));

        this.write(date, formattedTitle + space, data);

        if (this.isLoggable(title)) return;

        let coloredTitle = `\u001B[1m\u001B[37m\u001B[${color}m${formattedTitle}\u001B[0m`;

        console[type](date, coloredTitle + space, ...data);
    }

    private write(date: Date, title: string, data: unknown[]) {
        let parsed = data.map((data) => (typeof data === 'object' ? JSON.stringify(data) : data));

        this.stream?.write(`${date} ${title} ${parsed.join(' ')}\n`);
    }

    private isLoggable(type: string) {
        return this.logLevel !== 'all' && this.logLevel !== type;
    }

    /**
     * Reset = "\x1b[0m"
     * Bright = "\x1b[1m"
     * Dim = "\x1b[2m"
     * Underscore = "\x1b[4m"
     * Blink = "\x1b[5m"
     * Reverse = "\x1b[7m"
     * Hidden = "\x1b[8m"
     *
     * FgBlack = "\x1b[30m"
     * FgRed = "\x1b[31m"
     * FgGreen = "\x1b[32m"
     * FgYellow = "\x1b[33m"
     * FgBlue = "\x1b[34m"
     * FgMagenta = "\x1b[35m"
     * FgCyan = "\x1b[36m"
     * FgWhite = "\x1b[37m"
     *
     * BgBlack = "\x1b[40m"
     * BgRed = "\x1b[41m"
     * BgGreen = "\x1b[42m"
     * BgYellow = "\x1b[43m"
     * BgBlue = "\x1b[44m"
     * BgMagenta = "\x1b[45m"
     * BgCyan = "\x1b[46m"
     * BgWhite = "\x1b[47m"
     *
     **/
}

export default new Log();
