/** @format */

const path = require('path');
const { task, series, parallel, src, dest } = require('gulp');
const workbox = require('workbox-build');

// maxAgeSeconds
// * One minute: max-age=60
// * One hour: max-age=3600
// * One day: max-age=86400
// * One week: max-age=604800
// * One month: max-age=2628000
// * One year: max-age=31536000

task('generate-sw', async () => {
    const build = await workbox.generateSW({
        swDest: path.resolve(__dirname, './client/sw.js'),
        globDirectory: path.resolve(__dirname, './client/'),
        globPatterns: [
            '**/*.{mp3,css,json,json-dist,js,ico,eot,svg,ttf,woff,png,gif,jpg,html,txt,xml}'
        ],
        maximumFileSizeToCacheInBytes: 5e6,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
            {
                urlPattern: /txt|xml|html|css|js|json/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'web',
                    expiration: {
                        maxAgeSeconds: 86400
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                        headers: { 'x-test': 'true' }
                    }
                }
            },
            {
                urlPattern: /ico|png|gif|jpg/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'images',
                    expiration: {
                        maxAgeSeconds: 604800
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                        headers: { 'x-test': 'true' }
                    }
                }
            },
            {
                urlPattern: /woff|eot|woff2|ttf|svg/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'audio',
                    expiration: {
                        maxAgeSeconds: 604800
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                        headers: { 'x-test': 'true' }
                    }
                }
            },
            {
                urlPattern: /mp3/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'fonts',
                    expiration: {
                        maxAgeSeconds: 604800
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                        headers: { 'x-test': 'true' }
                    }
                }
            }
        ]
    });
    const { count, size, warnings } = build;

    warnings.forEach(console.warn);
    console.log(`${count} files will be precached, totaling ${size} bytes.`);

    return build;
});

exports.default = series(
    'generate-sw'
);
