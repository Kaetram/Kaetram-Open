import fs from 'fs';

import config from '../config';

type ConsoleLogType = 'info' | 'debug' | 'warn' | 'error' | 'log' | 'trace';

/**
 * Simple logging file that serves to be used globally
 * and to neatly display logs, errors, warnings, and notices.
 * Can be adapted and expanded, without using megabytes of npm repos.
 */
class Log {
    private logLevel = config.debugLevel || 'all';
    // Stream can be used to keep a log of what happened.
    private stream = config.fsDebugging ? fs.createWriteStream('runtime.log') : null; // Write to a different stream

    private debugging = config.debugging;

    public info(...data: unknown[]): void {
        this.send('info', data);
    }

    public debug(...data: unknown[]): void {
        if (!this.debugging) return;

        this.send('debug', data, 36);
    }

    public warning(...data: unknown[]): void {
        this.send('warn', data, 33, 'warning');
    }

    public error(...data: unknown[]): void {
        this.send('error', data, 41);
    }

    public notice(...data: unknown[]): void {
        this.send('log', data, 32, 'notice');
    }

    public trace(...data: unknown[]): void {
        this.send('trace', data, 35);
    }

    private send(type: ConsoleLogType, data: unknown[], color = 1, title: string = type): void {
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
