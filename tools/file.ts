import semver from 'semver';

const module = semver.satisfies(process.version, '>=0.7.1')
    ? require('fs')
    : require('path');

export const { stat } = module;
export const { existsSync } = module;

export default module;
