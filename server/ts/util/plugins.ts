/** @format */

import * as fs from 'fs';
import path from 'path';
const Filter = /^([^\\.].*)\.js$/;

function identity(val) {
    return val;
}

export default function requireItems(directory) {
    const files = fs.readdirSync(directory);
    const modules = {};
    const resolve = identity;

    files.forEach(async file => {
        const match = file.match(Filter);

        if (match) modules[match[1]] = resolve(await import(directory + file));
    });

    return modules;
}
