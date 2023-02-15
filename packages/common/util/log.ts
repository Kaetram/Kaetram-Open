import fs from 'node:fs';
import path from 'node:path';

import config from '../config';

type ConsoleLogType = 'info' | 'debug' | 'warn' | 'error' | 'log' | 'trace';

/**
 * Simple logging file that serves to be used globally
 * and to neatly display logs, errors, warnings, and notices.
 * Can be adapted and expanded, without using megabytes of npm repos.
 */

class Log {
    private logLevel = config.debugLevel || 'all';

    private streamPath = path.resolve('../../', 'runtime.log');
    private logStreamPath = path.resolve('../../', 'logs.log');
    private bugStreamPath = path.resolve('../../', 'bugs.log');

    private stream = config.fsDebugging ? fs.createWriteStream(this.streamPath) : null;
    private logStream = fs.createWriteStream(this.logStreamPath);
    private bugStream = fs.createWriteStream(this.bugStreamPath);

    private logFolderPath = '../logs';

    private chatStream = this.createLogStream('chat');
    private dropsStream = this.createLogStream('drops');
    private generalStream = this.createLogStream('general');
    private storesStream = this.createLogStream('stores');
    private tradesStream = this.createLogStream('trades');

    private debugging = config.debugging;

    public constructor() {
        if (!fs.existsSync(this.logFolderPath)) fs.mkdirSync(this.logFolderPath);
    }

    private createLogStream(name: string) {
        let log = path.resolve(this.logFolderPath, `${name}.log`);

        return fs.createWriteStream(log, { flags: 'a' });
    }

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

    public critical(...data: unknown[]): void {
        this.send('error', data, 41, 'critical');
    }

    public notice(...data: unknown[]): void {
        this.send('log', data, 32, 'notice');
    }

    public trace(...data: unknown[]): void {
        this.send('trace', data, 35);
    }

    public bug(...data: unknown[]): void {
        this.write(new Date(), '[BUG]', data, this.bugStream);
    }

    public log(...data: unknown[]): void {
        this.write(new Date(), '[LOG]', data, this.logStream);
    }

    // Game-specific loggers
    public chat(...data: unknown[]): void {
        this.write(new Date(), '[CHAT]', data, this.chatStream);
    }

    public drop(...data: unknown[]): void {
        this.write(new Date(), '[DROP]', data, this.dropsStream);
    }

    public general(...data: unknown[]): void {
        this.write(new Date(), '[GENERAL]', data, this.generalStream);
    }

    public stores(...data: unknown[]): void {
        this.write(new Date(), '[STORES]', data, this.storesStream);
    }

    public trade(...data: unknown[]): void {
        this.write(new Date(), '[TRADE]', data, this.tradesStream);
    }

    /**
     * Formats a piece of text and creates a log in the console.
     * @param type The type of logging we are doing.
     * @param data Contains the text information about the log.
     * @param color The colour of the log.
     * @param title Title of the log (optional).
     */

    private send(type: ConsoleLogType, data: unknown[], color = 1, title: string = type): void {
        let date = new Date(),
            formattedTitle = `[${title.toUpperCase()}]`,
            space = ' '.repeat(Math.max(9 - formattedTitle.length, 0));

        this.write(date, formattedTitle + space, data);

        if (this.isLoggable(title)) return;

        let coloredTitle = `\u001B[1m\u001B[37m\u001B[${color}m${formattedTitle}\u001B[0m`;

        console[type](date, coloredTitle + space, ...data);
    }

    private write(date: Date, title: string, data: unknown[], stream = this.stream) {
        let parsed = data.map((data) => (typeof data === 'object' ? JSON.stringify(data) : data));

        stream?.write(`[${date}] ${title} ${parsed.join(' ')}\n`);
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
