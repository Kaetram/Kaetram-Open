/** @format */

import semver from 'semver';

const module = semver.satisfies(process.version, '>=0.7.1')
    ? require('fs')
    : require('path');

export const exists = module.exists;
export const existsSync = module.existsSync;

export default module;
