import * as dotenv from 'dotenv';
import * as dotenvParseVariables from 'dotenv-parse-variables';
import * as camelcase from 'camelcase';

const envConfig = dotenvParseVariables(dotenv.config().parsed);

const appConfig = Object.keys(envConfig).reduce((result, key) => {
    const camelCaseKey = camelcase(key);
    return {
        ...result,
        [camelCaseKey]: envConfig[key],
    };
}, {});

export default dotenvParseVariables(appConfig);
