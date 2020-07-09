/* global module */

import * as fs from 'fs';
const Filter = /^([^\\.].*)\.js$/;

function identity(val: any) {
    return val;
}

export default function requireItems(directory: any) {
    let files = fs.readdirSync(directory),
        modules = {},
        resolve = identity;

    files.forEach(async (file) => {
        let match = file.match(Filter);

        if (match) modules[match[1]] = resolve((await import(directory + file)).default);
    });

    return modules;
}
