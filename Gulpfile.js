/** @format */

const path = require('path');
const { task, series } = require('gulp');
const workbox = require('workbox-build');

task('generate-sw', async () => {
    const build = await workbox.injectManifest({
        swSrc: path.resolve(__dirname, './client/workbox-sw.js'),
        swDest: path.resolve(__dirname, './client/sw.js'),
        globDirectory: path.resolve(__dirname, './client/'),
        globPatterns: [
            '**/*.{mp3,css,json,json-dist,js,ico,eot,svg,ttf,woff,png,gif,jpg,html,txt,xml}'
        ],
        maximumFileSizeToCacheInBytes: 5e6
    });
    const { count, size, warnings } = build;

    warnings.forEach(console.warn);
    console.log(`${count} files will be precached, totaling ${size} bytes.`);

    return build;
});

exports.default = series('generate-sw');
