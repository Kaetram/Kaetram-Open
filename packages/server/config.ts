import dotenv from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import camelcase from 'camelcase';

const envConfig = dotenvParseVariables(dotenv.load());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const appConfig: Record<string, any> = Object.keys(envConfig).reduce((result, key) => {
    const camelCaseKey = camelcase(key);
    return {
        ...result,
        [camelCaseKey]: envConfig[key]
    };
}, {});

export default appConfig;
