/* global module */

const fs = require('fs');
const Filter = /^([^\\.].*)\.js$/;

function identity(val) {
    return val;
}

module.exports = function requireItems(directory) {
    const files = fs.readdirSync(directory);
    const modules = {};
    const resolve = identity;

    files.forEach(file => {
        const match = file.match(Filter);

        if (match)
            modules[match[1]] = resolve(require(directory + file));
    });

    return modules;
};
