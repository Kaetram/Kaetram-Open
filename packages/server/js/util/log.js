let fs = require('fs');

class Log {

    /**
     * Simple logging file that serves to be used globally
     * and to neatly display logs, errors, warnings, and notices.
     * Can be adapted and expanded, without using megabytes of npm repos.
     **/

    constructor() {
		// Stream can be used to keep a log of what happened.
        this.logLevel = config.debugLevel || 'all';
		this.stream = config.fsDebugging ? fs.createWriteStream('runtime.log') : null; // Write to a different stream

		this.debugging = config.debug;
    }

    info(message) {
        if (this.isLoggable('info'))
            return;

        this.send(null, `[${new Date()}] INFO ${message}`);
    }

	debug(message) {
		if (!this.debugging)
			return;

		this.send('\x1b[36m%s\x1b[0m', `[${new Date()}] DEBUG ${message}`)
	}

    warning(message) {
        if (this.isLoggable('warning'))
            return;

        this.send('\x1b[33m%s\x1b[0m', `[${new Date()}] WARNING ${message}`);
    }

    error(message) {
        if (this.isLoggable('error'))
            return;

        this.send('\x1b[31m%s\x1b[0m', `[${new Date()}] ERROR ${message}`);
    }

    notice(message) {
        if (this.isLoggable('notice'))
            return;

        this.send('\x1b[32m%s\x1b[0m', `[${new Date()}] NOTICE ${message}`);
    }

	trace(message) {
		this.send('\x1b[35m%s\x1b[0m', `[${new Date()}] TRACE ${message}`, true);
	}

    send(colour, message, trace) {
		if (this.stream)
			this.stream.write(message + '\n');

		if (!colour)
			console.log(message);
		else if (trace)
			console.trace(colour, message);
		else
			console.log(colour, message);
    }

	isLoggable(type) {
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

     * FgBlack = "\x1b[30m"
     * FgRed = "\x1b[31m"
     * FgGreen = "\x1b[32m"
     * FgYellow = "\x1b[33m"
     * FgBlue = "\x1b[34m"
     * FgMagenta = "\x1b[35m"
     * FgCyan = "\x1b[36m"
     * FgWhite = "\x1b[37m"

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

module.exports = Log;
