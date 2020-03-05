import * as fs from 'fs';
import Log from 'log';
import config from '../../config.json';

const log = new Log(
  config.debugLevel,
  config.localDebug ? fs.createWriteStream('runtime.log') : null
);

export default log;
