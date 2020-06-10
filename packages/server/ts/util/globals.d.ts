import Log from './log';

declare global {
	export let log: Log;
	export let config: any;
}

declare let log: Log;
declare let config: any;
