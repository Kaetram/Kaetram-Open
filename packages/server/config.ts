import dotenv from 'dotenv';
import dotenvParseVariables from 'dotenv-parse-variables';
import camelcase from 'camelcase';

const envConfig = dotenvParseVariables(dotenv.config().parsed || { ...process.env });

const appConfig: Record<string, any> = Object.keys(envConfig).reduce((result, key) => {
    const camelCaseKey = camelcase(key);
    return {
        ...result,
        [camelCaseKey]: envConfig[key]
    };
}, {});

export default appConfig;
